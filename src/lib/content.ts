import { db } from './db';
import { readingMinutes } from './markdown';

export type Course = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  level: string;
  minutes: number;
  lesson_count: number;
  category: string;
  tracks: string;
  access: string;
  featured: number;
  sort: number;
  external_url: string | null;
  kind: string;
};

export type Lesson = {
  course_slug: string;
  slug: string;
  module_idx: number;
  idx: number;
  title: string;
  minutes: number;
  body: string;
  access: string;
  is_preview: number;
  video_url: string | null;
};

export type Tutorial = {
  slug: string;
  title: string;
  excerpt: string;
  tags: string;
  level: string;
  minutes: number;
  published: string;
  body: string;
  category: string;
};

const COURSE_COLS = `slug, title, subtitle, description, level, minutes, lesson_count,
  category, tracks, access, featured, sort, external_url, kind`;

export function allCourses(): Course[] {
  return db()
    .prepare(
      `SELECT ${COURSE_COLS} FROM courses
        WHERE status = 'published' AND kind <> 'lab'
        ORDER BY featured DESC, sort ASC, title ASC`,
    )
    .all() as unknown as Course[];
}

export function getCourse(slug: string): Course | null {
  const row = db().prepare(`SELECT ${COURSE_COLS} FROM courses WHERE slug = ?`).get(slug);
  return (row as Course | undefined) ?? null;
}

export function courseLessons(slug: string): Lesson[] {
  return db()
    .prepare(
      `SELECT course_slug, slug, module_idx, idx, title, minutes, body, access, is_preview, video_url
         FROM lessons WHERE course_slug = ? ORDER BY idx ASC`,
    )
    .all(slug) as unknown as Lesson[];
}

export function getLesson(courseSlug: string, lessonSlug: string): Lesson | null {
  const row = db()
    .prepare(
      `SELECT course_slug, slug, module_idx, idx, title, minutes, body, access, is_preview, video_url
         FROM lessons WHERE course_slug = ? AND slug = ?`,
    )
    .get(courseSlug, lessonSlug);
  return (row as Lesson | undefined) ?? null;
}

export function allTutorials(): Omit<Tutorial, 'body'>[] {
  return db()
    .prepare(
      `SELECT slug, title, excerpt, tags, level, minutes, published, '' AS body, category
         FROM tutorials WHERE status = 'published' ORDER BY published DESC`,
    )
    .all() as unknown as Omit<Tutorial, 'body'>[];
}

export function getTutorial(slug: string): Tutorial | null {
  const row = db()
    .prepare("SELECT * FROM tutorials WHERE slug = ? AND status = 'published'")
    .get(slug);
  return (row as Tutorial | undefined) ?? null;
}

export function completedLessons(userId: number, courseSlug: string): string[] {
  const rows = db()
    .prepare('SELECT lesson_slug FROM completions WHERE user_id = ? AND course_slug = ?')
    .all(userId, courseSlug) as unknown as { lesson_slug: string }[];
  return rows.map((r) => r.lesson_slug);
}

export function isComplete(userId: number, courseSlug: string, lessonSlug: string): boolean {
  const row = db()
    .prepare('SELECT 1 AS x FROM completions WHERE user_id = ? AND course_slug = ? AND lesson_slug = ?')
    .get(userId, courseSlug, lessonSlug);
  return Boolean(row);
}

/** Minutes are computed from the body, never authored — 165 wpm. */
export function computedMinutes(body: string): number {
  return readingMinutes(body);
}
