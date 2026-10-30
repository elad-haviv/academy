import 'server-only';
import { db } from './db';
import { splitTracks } from './taxonomy';

export type ContentAccess = 'free' | 'premium';

export type CourseSummary = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  level: string;
  language: string;
  tags: string[];
  kind: 'course' | 'lab';
  status: string;
  externalUrl: string | null;
  featured: boolean;
  lessonCount: number;
  minutes: number;
  category: string;
  tracks: string[];
  access: ContentAccess;
};

export type LessonRef = {
  slug: string;
  title: string;
  minutes: number;
  moduleIdx: number;
  idx: number;
  access: ContentAccess;
  isPreview: boolean;
};

export type CourseDetail = CourseSummary & {
  modules: {
    idx: number;
    title: string;
    summary: string;
    lessons: { slug: string; title: string; minutes: number; access: ContentAccess; isPreview: boolean }[];
  }[];
};

function toAccess(value: unknown, fallback: ContentAccess): ContentAccess {
  return value === 'premium' || value === 'free' ? value : fallback;
}

function toSummary(row: any): CourseSummary {
  return {
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    level: row.level,
    language: row.language,
    tags: row.tags ? String(row.tags).split(',').map((t: string) => t.trim()).filter(Boolean) : [],
    kind: row.kind === 'lab' ? 'lab' : 'course',
    status: row.status,
    externalUrl: row.external_url ?? null,
    featured: Boolean(row.featured),
    lessonCount: row.lesson_count,
    minutes: row.minutes,
    category: (row.category ?? '') as string,
    tracks: splitTracks(String(row.tracks ?? '')),
    access: toAccess(row.access, 'free'),
  };
}

export type CourseFilters = {
  kind?: string;
  level?: string;
  tag?: string;
  q?: string;
  sort?: string;
  category?: string;
  track?: string;
  access?: string;
};

export function listCourses(options: CourseFilters = {}): CourseSummary[] {
  const where: string[] = [];
  const params: any[] = [];
  const kind = options.kind ?? 'course';
  where.push('kind = ?');
  params.push(kind);
  // Drafts and items in review are never listed publicly (spec §6.2).
  where.push("status NOT IN ('draft', 'review')");
  if (options.level) {
    where.push('level = ?');
    params.push(options.level);
  }
  if (options.category) {
    where.push('category = ?');
    params.push(options.category);
  }
  if (options.track) {
    where.push("(',' || replace(tracks, ', ', ',') || ',') LIKE ?");
    params.push(`%,${options.track},%`);
  }
  if (options.access) {
    where.push('access = ?');
    params.push(options.access);
  }
  if (options.tag) {
    where.push("(',' || replace(tags, ', ', ',') || ',') LIKE ?");
    params.push(`%,${options.tag},%`);
  }
  if (options.q) {
    where.push('(lower(title) LIKE ? OR lower(subtitle) LIKE ? OR lower(description) LIKE ? OR lower(tags) LIKE ?)');
    const like = `%${options.q.toLowerCase()}%`;
    params.push(like, like, like, like);
  }
  const order =
    options.sort === 'short'
      ? 'minutes ASC'
      : options.sort === 'long'
        ? 'minutes DESC'
        : options.sort === 'title'
          ? 'title ASC'
          : options.sort === 'level'
            ? "CASE level WHEN 'Beginner' THEN 1 WHEN 'Intermediate' THEN 2 ELSE 3 END ASC, sort ASC"
            : 'sort ASC, title ASC';
  const rows = db()
    .prepare(`SELECT * FROM courses WHERE ${where.join(' AND ')} ORDER BY ${order}`)
    .all(...params);
  return (rows as any[]).map(toSummary);
}

export function getCourse(slug: string): CourseDetail | null {
  const row = db().prepare('SELECT * FROM courses WHERE slug = ?').get(slug) as any;
  if (!row || row.status === 'draft' || row.status === 'review') return null;
  const summary = toSummary(row);
  const moduleRows = db()
    .prepare('SELECT idx, title, summary FROM course_modules WHERE course_slug = ? ORDER BY idx')
    .all(slug) as any[];
  const lessonRows = db()
    .prepare('SELECT slug, title, minutes, module_idx, idx, access, is_preview FROM lessons WHERE course_slug = ? ORDER BY idx')
    .all(slug) as any[];
  return {
    ...summary,
    modules: moduleRows.map((m) => ({
      idx: m.idx,
      title: m.title,
      summary: m.summary,
      lessons: lessonRows
        .filter((l) => l.module_idx === m.idx)
        .map((l) => ({
          slug: l.slug,
          title: l.title,
          minutes: l.minutes,
          access: toAccess(l.access, summary.access),
          isPreview: Boolean(l.is_preview),
        })),
    })),
  };
}

export function lessonRefs(courseSlug: string): LessonRef[] {
  const rows = db()
    .prepare(
      `SELECT l.slug, l.title, l.minutes, l.module_idx, l.idx, l.access, l.is_preview, c.access AS course_access
       FROM lessons l JOIN courses c ON c.slug = l.course_slug
       WHERE l.course_slug = ? ORDER BY l.idx`
    )
    .all(courseSlug) as any[];
  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    minutes: row.minutes,
    moduleIdx: row.module_idx,
    idx: row.idx,
    access: toAccess(row.access || row.course_access, 'free'),
    isPreview: Boolean(row.is_preview),
  }));
}

export type LessonDetail = {
  slug: string;
  title: string;
  minutes: number;
  body: string;
  moduleIdx: number;
  moduleTitle: string;
  moduleSummary: string;
  idx: number;
  access: ContentAccess;
  isPreview: boolean;
  videoUrl: string | null;
};

export function getLesson(courseSlug: string, lessonSlug: string): LessonDetail | null {
  const row = db()
    .prepare(
      `SELECT l.slug, l.title, l.minutes, l.body, l.module_idx, l.idx, l.access, l.is_preview, l.video_url,
              m.title AS module_title, m.summary AS module_summary, c.access AS course_access
       FROM lessons l
       LEFT JOIN course_modules m ON m.course_slug = l.course_slug AND m.idx = l.module_idx
       JOIN courses c ON c.slug = l.course_slug
       WHERE l.course_slug = ? AND l.slug = ?`
    )
    .get(courseSlug, lessonSlug) as any;
  if (!row) return null;
  return {
    slug: row.slug,
    title: row.title,
    minutes: row.minutes,
    body: row.body as string,
    moduleIdx: row.module_idx as number,
    moduleTitle: (row.module_title ?? '') as string,
    moduleSummary: (row.module_summary ?? '') as string,
    idx: row.idx as number,
    access: toAccess(row.access || row.course_access, 'free'),
    isPreview: Boolean(row.is_preview),
    videoUrl: (row.video_url ?? null) as string | null,
  };
}

export function isEnrolled(userId: number, courseSlug: string): boolean {
  const row = db()
    .prepare('SELECT 1 AS ok FROM enrollments WHERE user_id = ? AND course_slug = ?')
    .get(userId, courseSlug) as any;
  return Boolean(row);
}

export function courseProgress(userId: number, courseSlug: string): { completed: number; total: number; percent: number } {
  const total = (db().prepare('SELECT COUNT(*) AS c FROM lessons WHERE course_slug = ?').get(courseSlug) as any).c as number;
  const completed = (db()
    .prepare('SELECT COUNT(*) AS c FROM completions WHERE user_id = ? AND course_slug = ?')
    .get(userId, courseSlug) as any).c as number;
  return { completed, total, percent: total ? Math.round((completed / total) * 100) : 0 };
}

export function completedLessons(userId: number, courseSlug: string): Set<string> {
  const rows = db()
    .prepare('SELECT lesson_slug FROM completions WHERE user_id = ? AND course_slug = ?')
    .all(userId, courseSlug) as any[];
  return new Set(rows.map((r) => r.lesson_slug as string));
}

export function nextLessonFor(userId: number, courseSlug: string): string | null {
  const refs = lessonRefs(courseSlug);
  if (!refs.length) return null;
  const done = completedLessons(userId, courseSlug);
  const next = refs.find((r) => !done.has(r.slug));
  return (next ?? refs[refs.length - 1]).slug;
}

export function enrolledCourses(userId: number) {
  const rows = db()
    .prepare(
      `SELECT c.* FROM enrollments e JOIN courses c ON c.slug = e.course_slug
       WHERE e.user_id = ? ORDER BY e.created_at DESC`
    )
    .all(userId) as any[];
  return rows.map((row) => ({
    ...toSummary(row),
    progress: courseProgress(userId, row.slug),
  }));
}

export function enrollmentsCount(userId: number): number {
  return (db().prepare('SELECT COUNT(*) AS c FROM enrollments WHERE user_id = ?').get(userId) as any).c as number;
}

export type ReviewRow = { rating: number; body: string; author: string; createdAt: string };

export function reviewsFor(courseSlug: string): { reviews: ReviewRow[]; average: number } {
  const rows = db()
    .prepare(
      `SELECT r.rating, r.body, r.created_at, u.name AS author
       FROM reviews r JOIN users u ON u.id = r.user_id
       WHERE r.course_slug = ? ORDER BY r.created_at DESC LIMIT 20`
    )
    .all(courseSlug) as any[];
  const reviews = rows.map((row) => ({
    rating: row.rating,
    body: row.body,
    author: row.author,
    createdAt: row.created_at,
  }));
  const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  return { reviews, average };
}

export type TutorialSummary = {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  level: string;
  minutes: number;
  published: string;
  category: string;
  tracks: string[];
  access: ContentAccess;
};

export type TutorialFilters = { tag?: string; q?: string; level?: string; category?: string; track?: string; access?: string };

export function listTutorials(options: TutorialFilters = {}): TutorialSummary[] {
  const where: string[] = [];
  const params: any[] = [];
  if (options.tag) {
    where.push("(',' || replace(tags, ', ', ',') || ',') LIKE ?");
    params.push(`%,${options.tag},%`);
  }
  if (options.level) {
    where.push('level = ?');
    params.push(options.level);
  }
  if (options.category) {
    where.push('category = ?');
    params.push(options.category);
  }
  if (options.track) {
    where.push("(',' || replace(tracks, ', ', ',') || ',') LIKE ?");
    params.push(`%,${options.track},%`);
  }
  if (options.access) {
    where.push('access = ?');
    params.push(options.access);
  }
  if (options.q) {
    where.push('(lower(title) LIKE ? OR lower(excerpt) LIKE ? OR lower(tags) LIKE ?)');
    const like = `%${options.q.toLowerCase()}%`;
    params.push(like, like, like);
  }
  const rows = db()
    .prepare(
      `SELECT slug, title, excerpt, tags, level, minutes, published, category, tracks, access FROM tutorials
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY published DESC, title ASC`
    )
    .all(...params) as any[];
  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    tags: row.tags ? String(row.tags).split(',').map((t: string) => t.trim()).filter(Boolean) : [],
    level: row.level,
    minutes: row.minutes,
    published: row.published,
    category: (row.category ?? '') as string,
    tracks: splitTracks(String(row.tracks ?? '')),
    access: toAccess(row.access, 'free'),
  }));
}

export function getTutorial(slug: string) {
  const row = db().prepare('SELECT * FROM tutorials WHERE slug = ?').get(slug) as any;
  if (!row) return null;
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    tags: row.tags ? String(row.tags).split(',').map((t: string) => t.trim()).filter(Boolean) : [],
    level: row.level,
    minutes: row.minutes,
    published: row.published,
    category: (row.category ?? '') as string,
    tracks: splitTracks(String(row.tracks ?? '')),
    access: toAccess(row.access, 'free'),
    body: row.body as string,
  };
}

export function allTags(): string[] {
  // courses only: a tag that exists on tutorials alone lands the catalog on an empty result
  const rows = db().prepare("SELECT tags FROM courses WHERE kind = 'course'").all() as any[];
  const set = new Set<string>();
  for (const row of rows) {
    for (const tag of String(row.tags ?? '').split(',')) {
      const clean = tag.trim();
      if (clean) set.add(clean);
    }
  }
  return [...set].sort();
}

export function siteStats() {
  const courses = (db().prepare("SELECT COUNT(*) AS c FROM courses WHERE kind = 'course'").get() as any).c as number;
  const lessons = (db().prepare('SELECT COUNT(*) AS c FROM lessons').get() as any).c as number;
  const labs = (db().prepare("SELECT COUNT(*) AS c FROM courses WHERE kind = 'lab'").get() as any).c as number;
  const tutorials = (db().prepare('SELECT COUNT(*) AS c FROM tutorials').get() as any).c as number;
  const learners = (db().prepare('SELECT COUNT(*) AS c FROM users').get() as any).c as number;
  const minutes = (db().prepare("SELECT COALESCE(SUM(minutes), 0) AS m FROM courses WHERE kind = 'course'").get() as any).m as number;
  return { courses, lessons, labs, tutorials, learners, minutes, hours: Math.round(minutes / 60) };
}

export function userCompletionsCount(userId: number): number {
  return (db().prepare('SELECT COUNT(*) AS c FROM completions WHERE user_id = ?').get(userId) as any).c as number;
}
