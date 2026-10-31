import { db } from './db';

export type CourseRow = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  level: string;
  minutes: number;
  lesson_count: number;
  category: string;
  featured: number;
  sort: number;
};

export function listCourses(): CourseRow[] {
  return db()
    .prepare(
      `SELECT slug, title, subtitle, description, level, minutes, lesson_count, category, featured, sort
         FROM courses
        WHERE status = 'published'
          AND (kind IS NULL OR kind <> 'lab')
          AND slug NOT IN (SELECT slug FROM labs)
        ORDER BY featured DESC, sort ASC, title ASC`,
    )
    .all() as unknown as CourseRow[];
}

export function countRows(table: 'courses' | 'lessons' | 'tutorials' | 'labs'): number {
  const row = db().prepare(`SELECT count(*) AS n FROM ${table}`).get() as { n: number };
  return row.n;
}
