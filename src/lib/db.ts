import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { loadContent } from './content';

let instance: DatabaseSync | null = null;

function databaseFile() {
  const dir = process.env.ACADEMY_DATA_DIR || path.join(process.cwd(), 'data');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'academy.db');
}

function migrate(db: DatabaseSync) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS courses (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      level TEXT NOT NULL DEFAULT 'Beginner',
      language TEXT NOT NULL DEFAULT 'en',
      tags TEXT NOT NULL DEFAULT '',
      kind TEXT NOT NULL DEFAULT 'course',
      external_url TEXT,
      status TEXT NOT NULL DEFAULT 'published',
      featured INTEGER NOT NULL DEFAULT 0,
      sort INTEGER NOT NULL DEFAULT 99,
      lesson_count INTEGER NOT NULL DEFAULT 0,
      minutes INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS course_modules (
      course_slug TEXT NOT NULL REFERENCES courses(slug) ON DELETE CASCADE,
      idx INTEGER NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      PRIMARY KEY (course_slug, idx)
    );
    CREATE TABLE IF NOT EXISTS lessons (
      course_slug TEXT NOT NULL REFERENCES courses(slug) ON DELETE CASCADE,
      slug TEXT NOT NULL,
      module_idx INTEGER NOT NULL,
      idx INTEGER NOT NULL,
      title TEXT NOT NULL,
      minutes INTEGER NOT NULL DEFAULT 10,
      body TEXT NOT NULL DEFAULT '',
      PRIMARY KEY (course_slug, slug)
    );
    CREATE TABLE IF NOT EXISTS tutorials (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '',
      level TEXT NOT NULL DEFAULT 'Beginner',
      minutes INTEGER NOT NULL DEFAULT 5,
      published TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS enrollments (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_slug TEXT NOT NULL REFERENCES courses(slug) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, course_slug)
    );
    CREATE TABLE IF NOT EXISTS completions (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_slug TEXT NOT NULL,
      lesson_slug TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      PRIMARY KEY (user_id, course_slug, lesson_slug)
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_slug TEXT NOT NULL REFERENCES courses(slug) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      UNIQUE (course_slug, user_id)
    );
  `);
}

function seedContent(db: DatabaseSync) {
  const content = loadContent();
  const current = db.prepare('SELECT value FROM meta WHERE key = ?').get('content_hash') as { value: string } | undefined;
  if (current?.value === content.hash) return;

  db.exec('BEGIN');
  try {
    db.exec('DELETE FROM lessons; DELETE FROM course_modules; DELETE FROM courses; DELETE FROM tutorials;');
    const insertCourse = db.prepare(
      `INSERT INTO courses (slug, title, subtitle, description, level, language, tags, kind, external_url, status, featured, sort, lesson_count, minutes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertModule = db.prepare(
      'INSERT INTO course_modules (course_slug, idx, title, summary) VALUES (?, ?, ?, ?)'
    );
    const insertLesson = db.prepare(
      'INSERT INTO lessons (course_slug, slug, module_idx, idx, title, minutes, body) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const insertTutorial = db.prepare(
      'INSERT INTO tutorials (slug, title, excerpt, tags, level, minutes, published, body) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );

    for (const course of content.courses) {
      const lessons = course.modules.flatMap((m) => m.lessons);
      const minutes = lessons.reduce((sum, l) => sum + l.minutes, 0);
      insertCourse.run(
        course.slug,
        course.title,
        course.subtitle,
        course.description,
        course.level,
        course.language,
        course.tags.join(', '),
        course.kind,
        course.externalUrl,
        course.status,
        course.featured ? 1 : 0,
        course.sort,
        lessons.length,
        minutes
      );
      let lessonIdx = 0;
      course.modules.forEach((module, moduleIdx) => {
        insertModule.run(course.slug, moduleIdx, module.title, module.summary);
        for (const lesson of module.lessons) {
          insertLesson.run(course.slug, lesson.slug, moduleIdx, lessonIdx, lesson.title, lesson.minutes, lesson.body);
          lessonIdx += 1;
        }
      });
    }

    for (const tutorial of content.tutorials) {
      insertTutorial.run(
        tutorial.slug,
        tutorial.title,
        tutorial.excerpt,
        tutorial.tags.join(', '),
        tutorial.level,
        tutorial.minutes,
        tutorial.published,
        tutorial.body
      );
    }

    db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(
      'content_hash',
      content.hash
    );
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function db() {
  if (instance) return instance;
  const database = new DatabaseSync(databaseFile());
  migrate(database);
  seedContent(database);
  instance = database;
  return database;
}
