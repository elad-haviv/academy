'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { assertCapability } from '@/lib/guard';
import { capabilitiesFor } from '@/lib/rbac';
import {
  saveCourse,
  saveLab,
  saveLesson,
  saveSections,
  saveTutorial,
  submitForReview,
} from '@/lib/studio';

function audit(actorId: number, action: string, subject: string, detail = '') {
  db()
    .prepare(
      `INSERT INTO audit_log (actor_user_id, action, subject, detail, ip, created_at)
       VALUES (?, ?, ?, ?, '', ?)`,
    )
    .run(actorId, action, subject, detail, new Date().toISOString());
}

async function actor(capability: string) {
  const user = await currentUser();
  if (!user) redirect(`/login?next=/studio`);
  assertCapability(user!, capability);
  return user!;
}

/** Creators may edit their own rows; editors may edit anyone's. */
function assertCanEdit(
  user: { id: number },
  row: { author_id?: number | null } | null | undefined,
  caps: Set<string>,
) {
  if (!row) return; // creating
  if (caps.has('content.edit.any')) return;
  if (row.author_id && row.author_id === user.id) return;
  throw new Error('forbidden: not your content');
}

/* ---------------- tutorials ---------------- */

export async function saveTutorialAction(formData: FormData) {
  const me = await actor('content.create');
  const slug = String(formData.get('slug') ?? '').trim() || undefined;
  const existing = slug
    ? (db().prepare('SELECT author_id FROM tutorials WHERE slug = ?').get(slug) as
        | { author_id: number | null }
        | undefined)
    : undefined;
  const caps = capabilitiesFor(me.id);
  assertCanEdit(me, existing, caps);

  const saved = saveTutorial({
    slug,
    title: String(formData.get('title') ?? '').trim() || 'ללא כותרת',
    excerpt: String(formData.get('excerpt') ?? '').trim(),
    body: String(formData.get('body') ?? ''),
    tags: String(formData.get('tags') ?? '').trim(),
    level: String(formData.get('level') ?? 'Beginner'),
    category: String(formData.get('category') ?? '').trim(),
    authorId: me.id,
  });
  audit(me.id, 'tutorial.save', saved);
  revalidatePath('/studio');
  redirect(`/studio/tutorials/${saved}?saved=1`);
}

/* ---------------- courses ---------------- */

export async function saveCourseAction(formData: FormData) {
  const me = await actor('content.create');
  const saved = saveCourse({
    slug: String(formData.get('slug') ?? '').trim() || undefined,
    title: String(formData.get('title') ?? '').trim() || 'ללא כותרת',
    subtitle: String(formData.get('subtitle') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    level: String(formData.get('level') ?? 'Beginner'),
    category: String(formData.get('category') ?? '').trim(),
    authorId: me.id,
  });
  audit(me.id, 'course.save', saved);
  revalidatePath('/studio');
  redirect(`/studio/courses/${saved}?saved=meta`);
}

export async function saveSectionsAction(formData: FormData) {
  const me = await actor('content.create');
  const slug = String(formData.get('slug') ?? '');
  const titles = String(formData.get('sections') ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  saveSections(slug, titles);
  audit(me.id, 'course.sections', slug, String(titles.length));
  revalidatePath(`/studio/courses/${slug}`);
  redirect(`/studio/courses/${slug}?saved=sections`);
}

export async function saveLessonAction(formData: FormData) {
  const me = await actor('content.create');
  const courseSlug = String(formData.get('course') ?? '');
  const saved = saveLesson({
    courseSlug,
    slug: String(formData.get('lesson_slug') ?? '').trim() || undefined,
    title: String(formData.get('title') ?? '').trim() || 'שיעור',
    body: String(formData.get('body') ?? ''),
    moduleIdx: Number(formData.get('module_idx') ?? 0),
    isPreview: String(formData.get('is_preview') ?? '') === 'on',
    authorId: me.id,
  });
  audit(me.id, 'lesson.save', `${courseSlug}/${saved}`);
  revalidatePath(`/studio/courses/${courseSlug}`);
  redirect(`/studio/courses/${courseSlug}?saved=lesson`);
}

/* ---------------- labs ---------------- */

export async function saveLabAction(formData: FormData) {
  const me = await actor('labs.manage');
  const lines = (key: string) =>
    String(formData.get(key) ?? '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  const saved = saveLab({
    slug: String(formData.get('slug') ?? '').trim() || undefined,
    title: String(formData.get('title') ?? '').trim() || 'מעבדה',
    subtitle: String(formData.get('subtitle') ?? '').trim(),
    vertical: String(formData.get('vertical') ?? 'agl'),
    repoUrl: String(formData.get('repo_url') ?? '').trim(),
    repoRef: String(formData.get('repo_ref') ?? 'main').trim(),
    embedUrl: String(formData.get('embed_url') ?? '').trim(),
    outcomes: lines('outcomes'),
    failureModes: lines('failure_modes'),
    authorId: me.id,
  });
  audit(me.id, 'lab.save', saved, String(formData.get('repo_ref') ?? ''));
  revalidatePath('/studio/labs');
  revalidatePath('/labs');
  redirect(`/studio/labs/${saved}?saved=1`);
}

/* ---------------- submit for review ---------------- */

export async function submitForReviewAction(formData: FormData) {
  const me = await actor('content.submit');
  const type = String(formData.get('type') ?? 'tutorial') as 'tutorial' | 'course' | 'lab';
  const slug = String(formData.get('slug') ?? '');
  if (!['tutorial', 'course', 'lab'].includes(type) || !slug) throw new Error('bad submission');
  submitForReview(type, slug, me.id);
  audit(me.id, 'content.submit', `${type}:${slug}`);
  revalidatePath('/studio');
  revalidatePath('/admin/review');
  redirect(`/studio?submitted=${type}`);
}
