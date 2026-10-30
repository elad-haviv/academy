'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { createSession, currentUser, destroySession, hashPassword, verifyPassword } from '@/lib/auth';
import { canTrackLesson, resolveViewer } from '@/lib/access';
import { getLesson } from '@/lib/queries';

function audit(action: string, subject: string, detail = '', actorUserId: number | null = null) {
  db()
    .prepare('INSERT INTO audit_log (actor_user_id, action, subject, detail, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(actorUserId, action, subject, detail, new Date().toISOString());
}

function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === 'string' ? value : '';
  if (next.startsWith('/') && !next.startsWith('//')) return next;
  return '/dashboard';
}

export async function registerAction(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const next = safeNext(formData.get('next'));

  if (name.length < 2) redirect(`/register?error=name&next=${encodeURIComponent(next)}`);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) redirect(`/register?error=email&next=${encodeURIComponent(next)}`);
  if (password.length < 8) redirect(`/register?error=password&next=${encodeURIComponent(next)}`);

  const existing = db().prepare('SELECT id FROM users WHERE email = ?').get(email) as any;
  if (existing) redirect(`/register?error=taken&next=${encodeURIComponent(next)}`);

  const result = db()
    .prepare('INSERT INTO users (email, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(email, name, hashPassword(password), 'student', new Date().toISOString());
  createSession(Number(result.lastInsertRowid));
  redirect(next);
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const next = safeNext(formData.get('next'));

  const user = db().prepare('SELECT id, password_hash FROM users WHERE email = ?').get(email) as any;
  // password_hash IS NULL/'' means a Google-only account: always the generic error.
  if (!user || !user.password_hash || !verifyPassword(password, user.password_hash)) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }
  createSession(user.id);
  redirect(next);
}

export async function logoutAction() {
  destroySession();
  redirect('/');
}

export async function enrollAction(formData: FormData) {
  const user = currentUser();
  const courseSlug = String(formData.get('course') ?? '');
  const next = safeNext(formData.get('next'));
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  db()
    .prepare('INSERT INTO enrollments (user_id, course_slug, created_at) VALUES (?, ?, ?) ON CONFLICT DO NOTHING')
    .run(user.id, courseSlug, new Date().toISOString());
  revalidatePath(`/courses/${courseSlug}`);
  revalidatePath('/dashboard');
  redirect(next);
}

export async function completeLessonAction(formData: FormData) {
  const user = currentUser();
  const courseSlug = String(formData.get('course') ?? '');
  const lessonSlug = String(formData.get('lesson') ?? '');
  const next = safeNext(formData.get('next'));
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);

  // Progress can only be tracked on content this viewer may read fully (spec §3.2).
  const lesson = getLesson(courseSlug, lessonSlug);
  if (!lesson) redirect(`/learn/${courseSlug}`);
  if (!canTrackLesson(resolveViewer(), lesson)) redirect(`/learn/${courseSlug}/${lessonSlug}`);

  const already = db()
    .prepare('SELECT 1 AS ok FROM completions WHERE user_id = ? AND course_slug = ? AND lesson_slug = ?')
    .get(user.id, courseSlug, lessonSlug) as any;
  if (already) {
    db().prepare('DELETE FROM completions WHERE user_id = ? AND course_slug = ? AND lesson_slug = ?').run(
      user.id,
      courseSlug,
      lessonSlug
    );
  } else {
    db()
      .prepare('INSERT INTO completions (user_id, course_slug, lesson_slug, completed_at) VALUES (?, ?, ?, ?)')
      .run(user.id, courseSlug, lessonSlug, new Date().toISOString());
    db()
      .prepare('INSERT INTO enrollments (user_id, course_slug, created_at) VALUES (?, ?, ?) ON CONFLICT DO NOTHING')
      .run(user.id, courseSlug, new Date().toISOString());
  }
  revalidatePath(`/learn/${courseSlug}/${lessonSlug}`);
  revalidatePath(`/learn/${courseSlug}`);
  revalidatePath('/dashboard');
  redirect(next);
}

export async function reviewAction(formData: FormData) {
  const user = currentUser();
  const courseSlug = String(formData.get('course') ?? '');
  const rating = Number(formData.get('rating') ?? 0);
  const body = String(formData.get('body') ?? '').trim().slice(0, 1200);
  if (!user) redirect(`/login?next=${encodeURIComponent(`/courses/${courseSlug}`)}`);
  if (rating >= 1 && rating <= 5) {
    db()
      .prepare(
        `INSERT INTO reviews (course_slug, user_id, rating, body, created_at) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(course_slug, user_id) DO UPDATE SET rating = excluded.rating, body = excluded.body, created_at = excluded.created_at`
      )
      .run(courseSlug, user.id, rating, body, new Date().toISOString());
  }
  revalidatePath(`/courses/${courseSlug}`);
  redirect(`/courses/${courseSlug}#reviews`);
}

/**
 * Waitlist for the subscription while payments are not wired up (spec §5.2).
 * One row per email; a signed-in visitor gets their user_id attached.
 */
export async function waitlistAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const name = String(formData.get('name') ?? '').trim().slice(0, 80);
  const note = String(formData.get('note') ?? '').trim().slice(0, 500);

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) redirect('/pricing?waitlist=invalid#waitlist');

  const viewer = resolveViewer();
  const existing = db().prepare('SELECT id FROM waitlist WHERE email = ?').get(email) as { id: number } | undefined;
  if (existing) redirect('/pricing?waitlist=exists#waitlist');

  db()
    .prepare(
      `INSERT INTO waitlist (email, name, note, user_id, source, created_at) VALUES (?, ?, ?, ?, 'pricing', ?)
       ON CONFLICT(email) DO NOTHING`
    )
    .run(email, name || viewer.user?.name || '', note, viewer.user?.id ?? null, new Date().toISOString());
  audit('waitlist.join', email, note, viewer.user?.id ?? null);

  revalidatePath('/pricing');
  redirect('/pricing?waitlist=ok#waitlist');
}
