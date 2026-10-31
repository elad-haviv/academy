'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  clearSessionCookie,
  createSession,
  createUser,
  currentUser,
  destroySession,
  findUserByEmail,
  setSessionCookie,
  verifyPassword,
  SESSION_COOKIE,
} from '@/lib/auth';
import { grantTrial } from '@/lib/access';
import { cookies } from 'next/headers';

function fail(path: string, code: string): never {
  redirect(`${path}?error=${code}`);
}

export async function registerAction(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '/dashboard');

  if (name.length < 2) fail('/register', 'name');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('/register', 'email');
  if (password.length < 8) fail('/register', 'password');
  if (findUserByEmail(email)) fail('/register', 'exists');

  const id = createUser(email, name, password);
  grantTrial(id); // 7 days, no card required
  const token = createSession(id);
  await setSessionCookie(token);
  revalidatePath('/');
  redirect(next);
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '/dashboard');

  const user = findUserByEmail(email);
  if (!user || !verifyPassword(password, user.password_hash)) fail('/login', 'credentials');

  const token = createSession(user.id);
  await setSessionCookie(token);
  redirect(next);
}

export async function logoutAction() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) destroySession(token);
  await clearSessionCookie();
  redirect('/');
}

export async function completeLessonAction(formData: FormData) {
  const courseSlug = String(formData.get('course') ?? '');
  const lessonSlug = String(formData.get('lesson') ?? '');
  const user = await currentUser();
  if (!user) redirect(`/login?next=/courses/${courseSlug}/${lessonSlug}`);

  db()
    .prepare(
      `INSERT INTO completions (user_id, course_slug, lesson_slug, completed_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, course_slug, lesson_slug) DO NOTHING`,
    )
    .run(user!.id, courseSlug, lessonSlug, new Date().toISOString());

  revalidatePath(`/courses/${courseSlug}`);
  redirect(`/courses/${courseSlug}/${lessonSlug}?done=1`);
}

export async function waitlistAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const note = String(formData.get('note') ?? '').trim();
  const source = String(formData.get('source') ?? 'employers');
  const lang = String(formData.get('lang') ?? 'he');
  const back = lang === 'en' ? '/en/for-employers' : '/for-employers';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect(`${back}?error=email`);

  db()
    .prepare(
      `INSERT INTO waitlist (email, name, note, source, created_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET name = excluded.name, note = excluded.note`,
    )
    .run(email.toLowerCase(), name, note, source, new Date().toISOString());

  redirect('/for-employers?sent=1');
}
