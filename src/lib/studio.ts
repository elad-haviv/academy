import 'server-only';
import { db } from './db';
import { readingMinutes } from './markdown';

/**
 * The content studio's data layer.
 *
 * Two rules decide whether something is public:
 *   1. status === 'published'                       (an editor approved it)
 *   2. for labs: validation_state === 'validated'
 *      AND repo_ref === last_validated_ref          (the reviewed code is the shipped code)
 *
 * A creator can never publish their own work; an editor can never approve a lab
 * whose repository has moved since it was validated. Both checks live here, so
 * no page or action can skip them.
 */

export type ContentStatus = 'draft' | 'in-review' | 'published' | 'changes-requested';

export const STATUS_LABEL: Record<ContentStatus, string> = {
  draft: 'טיוטה',
  'in-review': 'בבדיקה',
  published: 'פורסם',
  'changes-requested': 'נדרש תיקון',
};

export function slugify(input: string): string {
  const ascii = input
    .toLowerCase()
    .replace(/['"׳״]/g, '')
    .replace(/[^a-z0-9\u05d0-\u05ea]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (/^[a-z0-9-]+$/.test(ascii) && ascii.length >= 3) return ascii.slice(0, 64);
  // Hebrew or non-latin titles get a stable, readable fallback.
  const suffix = Math.random().toString(36).slice(2, 6);
  return `item-${suffix}`;
}

export function validSlug(s: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(s);
}

/* ---------------- tutorials (WYSIWYG articles) ---------------- */

export type TutorialRow = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  tags: string;
  level: string;
  minutes: number;
  category: string;
  status: ContentStatus;
  author_id: number | null;
  origin: string;
  updated_at: string | null;
  published: string;
};

export function getTutorialRow(slug: string): TutorialRow | null {
  const row = db().prepare('SELECT * FROM tutorials WHERE slug = ?').get(slug) as
    | TutorialRow
    | undefined;
  return row ?? null;
}

export function saveTutorial(input: {
  slug?: string;
  title: string;
  excerpt: string;
  body: string;
  tags: string;
  level: string;
  category: string;
  authorId: number;
}): string {
  const d = db();
  const now = new Date().toISOString();
  const slug = input.slug && validSlug(input.slug) ? input.slug : slugify(input.title);
  const minutes = Math.max(1, readingMinutes(input.body));
  const existing = getTutorialRow(slug);

  if (existing) {
    d.prepare(
      `UPDATE tutorials
          SET title = ?, excerpt = ?, body = ?, tags = ?, level = ?, category = ?,
              minutes = ?, updated_at = ?, author_id = COALESCE(author_id, ?),
              origin = 'studio'
        WHERE slug = ?`,
    ).run(input.title, input.excerpt, input.body, input.tags, input.level, input.category, minutes, now, input.authorId, slug);
  } else {
    d.prepare(
      `INSERT INTO tutorials (slug, title, excerpt, tags, level, minutes, published, body, category, access, status, author_id, origin, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'free', 'draft', ?, 'studio', ?)`,
    ).run(slug, input.title, input.excerpt, input.tags, input.level, minutes, now.slice(0, 10), input.body, input.category, input.authorId, now);
  }
  return slug;
}

/* ---------------- courses: sections (modules) + lessons ---------------- */

export function saveCourse(input: {
  slug?: string;
  title: string;
  subtitle: string;
  description: string;
  level: string;
  category: string;
  authorId: number;
}): string {
  const d = db();
  const now = new Date().toISOString();
  const slug = input.slug && validSlug(input.slug) ? input.slug : slugify(input.title);
  const existing = d.prepare('SELECT slug FROM courses WHERE slug = ?').get(slug);
  if (existing) {
    d.prepare(
      `UPDATE courses SET title = ?, subtitle = ?, description = ?, level = ?, category = ?,
              origin = 'studio', updated_at = ?, author_id = COALESCE(author_id, ?)
        WHERE slug = ?`,
    ).run(input.title, input.subtitle, input.description, input.level, input.category, now, input.authorId, slug);
  } else {
    d.prepare(
      `INSERT INTO courses (slug, title, subtitle, description, level, language, status, kind, category, access, author_id, origin, updated_at)
       VALUES (?, ?, ?, ?, ?, 'he', 'draft', 'course', ?, 'free', ?, 'studio', ?)`,
    ).run(slug, input.title, input.subtitle, input.description, input.level, input.category, input.authorId, now);
  }
  return slug;
}

/** Replace the whole section list in one go — order is the array order. */
export function saveSections(courseSlug: string, titles: string[]) {
  const d = db();
  d.prepare('DELETE FROM course_modules WHERE course_slug = ?').run(courseSlug);
  titles
    .map((t) => t.trim())
    .filter(Boolean)
    .forEach((title, i) => {
      d.prepare(
        'INSERT INTO course_modules (course_slug, idx, title, summary) VALUES (?, ?, ?, "")',
      ).run(courseSlug, i, title);
    });
}

export function saveLesson(input: {
  courseSlug: string;
  slug?: string;
  title: string;
  body: string;
  moduleIdx: number;
  isPreview: boolean;
  authorId: number;
}) {
  const d = db();
  const slug = input.slug && validSlug(input.slug) ? input.slug : slugify(input.title);
  const existing = d
    .prepare('SELECT slug FROM lessons WHERE course_slug = ? AND slug = ?')
    .get(input.courseSlug, slug);
  const nextIdx = (
    d.prepare('SELECT COALESCE(MAX(idx), -1) + 1 AS n FROM lessons WHERE course_slug = ?').get(input.courseSlug) as { n: number }
  ).n;
  const minutes = Math.max(1, readingMinutes(input.body));

  if (existing) {
    d.prepare(
      `UPDATE lessons SET title = ?, body = ?, module_idx = ?, minutes = ?, is_preview = ?, origin = 'studio'
        WHERE course_slug = ? AND slug = ?`,
    ).run(input.title, input.body, input.moduleIdx, minutes, input.isPreview ? 1 : 0, input.courseSlug, slug);
  } else {
    d.prepare(
      `INSERT INTO lessons (course_slug, slug, module_idx, idx, title, minutes, body, access, is_preview, author_id, origin)
       VALUES (?, ?, ?, ?, ?, ?, ?, '', ?, ?, 'studio')`,
    ).run(input.courseSlug, slug, input.moduleIdx, nextIdx, input.title, minutes, input.body, input.isPreview ? 1 : 0, input.authorId);
  }
  refreshCourseTotals(input.courseSlug);
  return slug;
}

export function refreshCourseTotals(courseSlug: string) {
  const d = db();
  const row = d
    .prepare('SELECT count(*) AS n, COALESCE(sum(minutes), 0) AS m FROM lessons WHERE course_slug = ?')
    .get(courseSlug) as { n: number; m: number };
  d.prepare('UPDATE courses SET lesson_count = ?, minutes = ? WHERE slug = ?').run(row.n, row.m, courseSlug);
}

/* ---------------- labs: git-backed, re-validated on every ref change ---------------- */

export type LabRow = {
  slug: string;
  title: string;
  subtitle: string;
  vertical: string;
  status: string;
  entitlement: string;
  embed_url: string | null;
  repo_url: string | null;
  repo_ref: string | null;
  validation_state: 'unverified' | 'validated' | 'stale';
  last_validated_ref: string | null;
  correctness_owner: string | null;
  validated_on: string | null;
  outcomes: string;
  failure_modes: string;
  learner_roles: string;
  buyer_roles: string;
  prerequisites: string;
  minutes: number;
  author_id: number | null;
};

export function saveLab(input: {
  slug?: string;
  title: string;
  subtitle: string;
  vertical: string;
  repoUrl: string;
  repoRef: string;
  embedUrl: string;
  outcomes: string[];
  failureModes: string[];
  authorId: number;
}): string {
  const d = db();
  const now = new Date().toISOString();
  const slug = input.slug && validSlug(input.slug) ? input.slug : slugify(input.title);
  const ref = input.repoRef.trim() || 'main';
  const existing = d.prepare('SELECT * FROM labs WHERE slug = ?').get(slug) as LabRow | undefined;

  const json = (a: string[]) => JSON.stringify(a.filter(Boolean));

  if (existing) {
    // Any change to the shipped ref invalidates the previous review.
    const moved = (existing.repo_ref ?? '') !== ref || (existing.repo_url ?? '') !== input.repoUrl.trim();
    d.prepare(
      `UPDATE labs
          SET title = ?, subtitle = ?, vertical = ?, repo_url = ?, repo_ref = ?, embed_url = ?,
              outcomes = ?, failure_modes = ?, updated_at = ?,
              validation_state = CASE WHEN ? = 1 THEN 'stale' ELSE validation_state END,
              author_id = COALESCE(author_id, ?)
        WHERE slug = ?`,
    ).run(
      input.title, input.subtitle, input.vertical, input.repoUrl.trim(), ref, input.embedUrl.trim(),
      json(input.outcomes), json(input.failureModes), now, moved ? 1 : 0, input.authorId, slug,
    );
  } else {
    d.prepare(
      `INSERT INTO labs (slug, title, subtitle, vertical, kind, status, entitlement, embed_url, repo_url, repo_ref,
                         validation_state, outcomes, failure_modes, learner_roles, buyer_roles, prerequisites,
                         minutes, author_id, updated_at)
       VALUES (?, ?, ?, ?, 'simulator', 'draft', 'lab:' || ?, ?, ?, ?, 'unverified', ?, ?, '[]', '[]', '[]', 0, ?, ?)`,
    ).run(slug, input.title, input.subtitle, input.vertical, slug, input.embedUrl.trim() || null,
      input.repoUrl.trim(), ref, json(input.outcomes), json(input.failureModes), input.authorId, now);
  }
  return slug;
}

/** Public visibility: published AND validated AND the validated ref is the current one. */
export function labIsPublic(row: LabRow): boolean {
  return (
    row.status === 'published' &&
    row.validation_state === 'validated' &&
    Boolean(row.last_validated_ref) &&
    row.last_validated_ref === row.repo_ref
  );
}

/* ---------------- workflow ---------------- */

export type ReviewItem = {
  id: number;
  subject_type: string;
  subject_id: string;
  submitted_by: number | null;
  status: string;
  note: string;
  created_at: string;
  reviewed_at: string | null;
  title?: string;
  author_name?: string;
};

export function submitForReview(
  subjectType: 'tutorial' | 'course' | 'lab',
  subjectId: string,
  userId: number,
) {
  const d = db();
  const now = new Date().toISOString();
  const table = subjectType === 'tutorial' ? 'tutorials' : subjectType === 'course' ? 'courses' : 'labs';
  d.prepare(`UPDATE ${table} SET status = 'in-review' WHERE slug = ?`).run(subjectId);
  d.prepare(
    `INSERT INTO reviews_queue (subject_type, subject_id, submitted_by, status, created_at)
     VALUES (?, ?, ?, 'pending', ?)`,
  ).run(subjectType, subjectId, userId, now);
}

export function pendingReviews(): ReviewItem[] {
  return db()
    .prepare(
      `SELECT q.*, 
              COALESCE(t.title, c.title, l.title) AS title,
              u.name AS author_name
         FROM reviews_queue q
         LEFT JOIN tutorials t ON q.subject_type = 'tutorial' AND t.slug = q.subject_id
         LEFT JOIN courses   c ON q.subject_type = 'course'   AND c.slug = q.subject_id
         LEFT JOIN labs      l ON q.subject_type = 'lab'      AND l.slug = q.subject_id
         LEFT JOIN users     u ON u.id = q.submitted_by
        WHERE q.status = 'pending'
        ORDER BY q.created_at ASC`,
    )
    .all() as unknown as ReviewItem[];
}

/**
 * Approve or send back. Approving a lab is what mints its validity: the reviewer
 * becomes the named correctness owner and the current ref becomes the validated one.
 */
export function reviewDecision(input: {
  queueId: number;
  approve: boolean;
  note: string;
  reviewerId: number;
  reviewerName: string;
}) {
  const d = db();
  const now = new Date().toISOString();
  const q = d.prepare('SELECT * FROM reviews_queue WHERE id = ?').get(input.queueId) as
    | { id: number; subject_type: string; subject_id: string }
    | undefined;
  if (!q) throw new Error('review item not found');

  d.prepare(
    `UPDATE reviews_queue SET status = ?, note = ?, reviewed_by = ?, reviewed_at = ? WHERE id = ?`,
  ).run(input.approve ? 'approved' : 'changes', input.note, input.reviewerId, now, input.queueId);

  const table = q.subject_type === 'tutorial' ? 'tutorials' : q.subject_type === 'course' ? 'courses' : 'labs';
  d.prepare(`UPDATE ${table} SET status = ? WHERE slug = ?`).run(
    input.approve ? 'published' : 'changes-requested',
    q.subject_id,
  );

  if (q.subject_type === 'lab' && input.approve) {
    const lab = d.prepare('SELECT repo_ref FROM labs WHERE slug = ?').get(q.subject_id) as
      | { repo_ref: string | null }
      | undefined;
    d.prepare(
      `UPDATE labs SET validation_state = 'validated', last_validated_ref = ?, correctness_owner = ?, validated_on = ?
        WHERE slug = ?`,
    ).run(lab?.repo_ref ?? '', input.reviewerName, now.slice(0, 10), q.subject_id);
  }
}
