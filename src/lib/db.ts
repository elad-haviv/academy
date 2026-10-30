import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { loadContent } from './content';
import { joinTracks } from './taxonomy';

let instance: DatabaseSync | null = null;

type ColumnInfo = { name: string; notnull: number; dflt_value: string | null; pk: number };

function databaseFile() {
  const dir = process.env.ACADEMY_DATA_DIR || path.join(process.cwd(), 'data');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'academy.db');
}

function columnsOf(db: DatabaseSync, table: string): ColumnInfo[] {
  return db.prepare(`PRAGMA table_info(${table})`).all() as unknown as ColumnInfo[];
}

function hasColumn(db: DatabaseSync, table: string, column: string): boolean {
  return columnsOf(db, table).some((column_) => column_.name === column);
}

/** Additive column migration: safe to run on every boot, against a live DB. */
function addColumn(db: DatabaseSync, table: string, column: string, definition: string): void {
  if (hasColumn(db, table, column)) return;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

/**
 * `users.password_hash` must become nullable (Google-only accounts have none).
 * SQLite cannot drop a NOT NULL constraint in place, so the table is rebuilt
 * inside one transaction, with foreign keys disabled so the DROP cannot cascade
 * into sessions/enrollments/completions/reviews. If foreign keys cannot be
 * disabled on this connection we leave the old schema alone — an empty-string
 * password hash is treated as "no password" by the login code, so nothing breaks.
 */
function makePasswordHashNullable(db: DatabaseSync): void {
  const passwordHash = columnsOf(db, 'users').find((column) => column.name === 'password_hash');
  if (!passwordHash || passwordHash.notnull === 0) return;

  db.exec('PRAGMA foreign_keys = OFF');
  const fk = db.prepare('PRAGMA foreign_keys').get() as { foreign_keys?: number } | undefined;
  if ((fk?.foreign_keys ?? 1) !== 0) {
    db.exec('PRAGMA foreign_keys = ON');
    console.warn('[db] foreign_keys could not be disabled; keeping users.password_hash NOT NULL');
    return;
  }

  const before = (db.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number }).c;
  db.exec('BEGIN');
  try {
    db.exec(`
      CREATE TABLE users_rebuild (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        password_hash TEXT,
        role TEXT NOT NULL DEFAULT 'student',
        email_verified_at TEXT,
        created_at TEXT NOT NULL
      );
      INSERT INTO users_rebuild (id, email, name, password_hash, role, email_verified_at, created_at)
        SELECT id, email, name, password_hash, role, email_verified_at, created_at FROM users;
      DROP TABLE users;
      ALTER TABLE users_rebuild RENAME TO users;
    `);
    const after = (db.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number }).c;
    if (after !== before) throw new Error(`users rebuild copied ${after} of ${before} rows`);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    db.exec('PRAGMA foreign_keys = ON');
    throw error;
  }
  db.exec('PRAGMA foreign_keys = ON');
}

function migrate(db: DatabaseSync) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT,
      role TEXT NOT NULL DEFAULT 'student',
      email_verified_at TEXT,
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
      minutes INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL DEFAULT '',
      tracks TEXT NOT NULL DEFAULT '',
      access TEXT NOT NULL DEFAULT 'free'
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
      access TEXT NOT NULL DEFAULT '',
      is_preview INTEGER NOT NULL DEFAULT 0,
      video_url TEXT,
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
      body TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      tracks TEXT NOT NULL DEFAULT '',
      access TEXT NOT NULL DEFAULT 'free'
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

    -- ---------- Iteration 1: taxonomy columns on existing tables ----------
  `);

  addColumn(db, 'courses', 'category', "TEXT NOT NULL DEFAULT ''");
  addColumn(db, 'courses', 'tracks', "TEXT NOT NULL DEFAULT ''");
  addColumn(db, 'courses', 'access', "TEXT NOT NULL DEFAULT 'free'");
  addColumn(db, 'lessons', 'access', "TEXT NOT NULL DEFAULT ''");
  addColumn(db, 'lessons', 'is_preview', 'INTEGER NOT NULL DEFAULT 0');
  addColumn(db, 'lessons', 'video_url', 'TEXT');
  addColumn(db, 'tutorials', 'category', "TEXT NOT NULL DEFAULT ''");
  addColumn(db, 'tutorials', 'tracks', "TEXT NOT NULL DEFAULT ''");
  addColumn(db, 'tutorials', 'access', "TEXT NOT NULL DEFAULT 'free'");
  addColumn(db, 'users', 'email_verified_at', 'TEXT');

  makePasswordHashNullable(db);

  // ---------- Non-content tables: created once, never touched by the seeder ----------
  db.exec(`
    CREATE TABLE IF NOT EXISTS oauth_accounts (
      provider TEXT NOT NULL,
      provider_account_id TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email_at_link TEXT NOT NULL,
      linked_at TEXT NOT NULL,
      PRIMARY KEY (provider, provider_account_id)
    );
    CREATE UNIQUE INDEX IF NOT EXISTS oauth_one_per_provider_per_user
      ON oauth_accounts(user_id, provider);

    CREATE TABLE IF NOT EXISTS email_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS email_tokens_by_user ON email_tokens(user_id, kind, created_at);

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      product_sku TEXT NOT NULL,
      amount_agorot INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'ILS',
      vat_agorot INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      provider TEXT,
      provider_ref TEXT,
      provider_payload TEXT,
      invoice_number TEXT,
      created_at TEXT NOT NULL,
      paid_at TEXT,
      refunded_at TEXT
    );

    CREATE TABLE IF NOT EXISTS entitlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject TEXT NOT NULL,
      source TEXT NOT NULL,
      starts_at TEXT NOT NULL,
      ends_at TEXT,
      order_id INTEGER REFERENCES orders(id),
      revoked_at TEXT,
      UNIQUE (user_id, subject, starts_at)
    );
    CREATE INDEX IF NOT EXISTS entitlements_by_user ON entitlements(user_id, subject);

    CREATE TABLE IF NOT EXISTS waitlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      source TEXT NOT NULL DEFAULT 'pricing',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      subject TEXT NOT NULL DEFAULT '',
      detail TEXT NOT NULL DEFAULT '',
      ip TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS audit_log_by_action ON audit_log(action, created_at);
  `);
}

/**
 * Content seeding. Courses are UPSERTed rather than deleted-and-reinserted:
 * `enrollments` and `reviews` have ON DELETE CASCADE against courses, so a plain
 * DELETE would wipe user data on every content change. Lessons/modules carry no
 * user rows and are safe to replace wholesale. Rows for courses that no longer
 * exist in content/ are pruned after the upsert.
 */
function seedContent(db: DatabaseSync) {
  const content = loadContent();
  const current = db.prepare('SELECT value FROM meta WHERE key = ?').get('content_hash') as { value: string } | undefined;
  if (current?.value === content.hash) return;

  db.exec('BEGIN');
  try {
    db.exec('DELETE FROM lessons; DELETE FROM course_modules;');
    const insertCourse = db.prepare(
      `INSERT INTO courses (slug, title, subtitle, description, level, language, tags, kind, external_url, status,
                            featured, sort, lesson_count, minutes, category, tracks, access)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET
         title = excluded.title, subtitle = excluded.subtitle, description = excluded.description,
         level = excluded.level, language = excluded.language, tags = excluded.tags, kind = excluded.kind,
         external_url = excluded.external_url, status = excluded.status, featured = excluded.featured,
         sort = excluded.sort, lesson_count = excluded.lesson_count, minutes = excluded.minutes,
         category = excluded.category, tracks = excluded.tracks, access = excluded.access`
    );
    const insertModule = db.prepare(
      'INSERT INTO course_modules (course_slug, idx, title, summary) VALUES (?, ?, ?, ?)'
    );
    const insertLesson = db.prepare(
      'INSERT INTO lessons (course_slug, slug, module_idx, idx, title, minutes, body, access, is_preview, video_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const insertTutorial = db.prepare(
      `INSERT INTO tutorials (slug, title, excerpt, tags, level, minutes, published, body, category, tracks, access)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET
         title = excluded.title, excerpt = excluded.excerpt, tags = excluded.tags, level = excluded.level,
         minutes = excluded.minutes, published = excluded.published, body = excluded.body,
         category = excluded.category, tracks = excluded.tracks, access = excluded.access`
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
        minutes,
        course.category,
        joinTracks(course.tracks),
        course.access
      );
      let lessonIdx = 0;
      course.modules.forEach((module, moduleIdx) => {
        insertModule.run(course.slug, moduleIdx, module.title, module.summary);
        for (const lesson of module.lessons) {
          insertLesson.run(
            course.slug,
            lesson.slug,
            moduleIdx,
            lessonIdx,
            lesson.title,
            lesson.minutes,
            lesson.body,
            lesson.access,
            lesson.isPreview ? 1 : 0,
            lesson.videoUrl
          );
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
        tutorial.body,
        tutorial.category,
        joinTracks(tutorial.tracks),
        tutorial.access
      );
    }

    // Prune content that was deleted from content/ (their user rows cascade, as intended).
    const courseSlugs = content.courses.map((course) => course.slug);
    const tutorialSlugs = content.tutorials.map((tutorial) => tutorial.slug);
    const placeholders = (items: string[]) => items.map(() => '?').join(',') || 'NULL';
    db.prepare(`DELETE FROM courses WHERE slug NOT IN (${placeholders(courseSlugs)})`).run(...courseSlugs);
    db.prepare(`DELETE FROM tutorials WHERE slug NOT IN (${placeholders(tutorialSlugs)})`).run(...tutorialSlugs);

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
