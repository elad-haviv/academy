import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Single SQLite connection for the whole process.
 *
 * The schema below is the canonical shape already present on production
 * volumes (`/data/academy.db`), carried forward from the v1 and
 * spec-iteration builds. Do not introduce a parallel model — extend this one
 * with additive migrations only, so a fresh volume and an existing one end up
 * identical.
 *
 * Code is stateless, data is stateful: the DB lives on the persistent volume
 * and is never committed, never wiped by a deploy.
 */

const DATA_DIR = process.env.ACADEMY_DATA_DIR || path.join(process.cwd(), 'data');
export const DB_FILE = path.join(DATA_DIR, 'academy.db');

declare global {
  // eslint-disable-next-line no-var
  var __academyDb: DatabaseSync | undefined;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  email             TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  password_hash     TEXT,
  role              TEXT NOT NULL DEFAULT 'student',
  email_verified_at TEXT,
  created_at        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS email_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at    TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS email_tokens_by_user ON email_tokens(user_id, kind, created_at);

CREATE TABLE IF NOT EXISTS oauth_accounts (
  provider            TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_at_link       TEXT NOT NULL,
  linked_at           TEXT NOT NULL,
  PRIMARY KEY (provider, provider_account_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS oauth_one_per_provider_per_user
  ON oauth_accounts(user_id, provider);

CREATE TABLE IF NOT EXISTS audit_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  subject       TEXT NOT NULL DEFAULT '',
  detail        TEXT NOT NULL DEFAULT '',
  ip            TEXT NOT NULL DEFAULT '',
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS audit_log_by_action ON audit_log(action, created_at);

/* ---- shelf: courses / lessons / tutorials ---- */

CREATE TABLE IF NOT EXISTS courses (
  slug         TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  subtitle     TEXT NOT NULL DEFAULT '',
  description  TEXT NOT NULL DEFAULT '',
  level        TEXT NOT NULL DEFAULT 'Beginner',
  language     TEXT NOT NULL DEFAULT 'en',
  tags         TEXT NOT NULL DEFAULT '',
  kind         TEXT NOT NULL DEFAULT 'course',
  external_url TEXT,
  status       TEXT NOT NULL DEFAULT 'published',
  featured     INTEGER NOT NULL DEFAULT 0,
  sort         INTEGER NOT NULL DEFAULT 99,
  lesson_count INTEGER NOT NULL DEFAULT 0,
  minutes      INTEGER NOT NULL DEFAULT 0,
  category     TEXT NOT NULL DEFAULT '',
  tracks       TEXT NOT NULL DEFAULT '',
  access       TEXT NOT NULL DEFAULT 'free'
);

CREATE TABLE IF NOT EXISTS course_modules (
  course_slug TEXT NOT NULL REFERENCES courses(slug) ON DELETE CASCADE,
  idx         INTEGER NOT NULL,
  title       TEXT NOT NULL,
  summary     TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (course_slug, idx)
);

CREATE TABLE IF NOT EXISTS lessons (
  course_slug TEXT NOT NULL REFERENCES courses(slug) ON DELETE CASCADE,
  slug        TEXT NOT NULL,
  module_idx  INTEGER NOT NULL,
  idx         INTEGER NOT NULL,
  title       TEXT NOT NULL,
  minutes     INTEGER NOT NULL DEFAULT 10,
  body        TEXT NOT NULL DEFAULT '',
  access      TEXT NOT NULL DEFAULT '',
  is_preview  INTEGER NOT NULL DEFAULT 0,
  video_url   TEXT,
  PRIMARY KEY (course_slug, slug)
);

CREATE TABLE IF NOT EXISTS tutorials (
  slug      TEXT PRIMARY KEY,
  title     TEXT NOT NULL,
  excerpt   TEXT NOT NULL DEFAULT '',
  tags      TEXT NOT NULL DEFAULT '',
  level     TEXT NOT NULL DEFAULT 'Beginner',
  minutes   INTEGER NOT NULL DEFAULT 5,
  published TEXT NOT NULL DEFAULT '',
  body      TEXT NOT NULL DEFAULT '',
  category  TEXT NOT NULL DEFAULT '',
  tracks    TEXT NOT NULL DEFAULT '',
  access    TEXT NOT NULL DEFAULT 'free'
);

/* ---- the product: labs ---- */

CREATE TABLE IF NOT EXISTS labs (
  slug              TEXT PRIMARY KEY,
  title             TEXT NOT NULL,
  subtitle          TEXT,
  vertical          TEXT,
  kind              TEXT NOT NULL DEFAULT 'simulator',
  status            TEXT NOT NULL DEFAULT 'in-development',
  entitlement       TEXT NOT NULL,
  embed_url         TEXT,
  correctness_owner TEXT,
  validated_on      TEXT,
  learner_roles     TEXT NOT NULL DEFAULT '[]',
  buyer_roles       TEXT NOT NULL DEFAULT '[]',
  outcomes          TEXT NOT NULL DEFAULT '[]',
  failure_modes     TEXT NOT NULL DEFAULT '[]',
  prerequisites     TEXT NOT NULL DEFAULT '[]',
  minutes           INTEGER NOT NULL DEFAULT 0,
  position          INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lab_scenarios (
  lab_slug         TEXT NOT NULL REFERENCES labs(slug) ON DELETE CASCADE,
  slug             TEXT NOT NULL,
  title            TEXT NOT NULL,
  brief            TEXT,
  success_criteria TEXT NOT NULL DEFAULT '[]',
  minutes          INTEGER NOT NULL DEFAULT 0,
  position         INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (lab_slug, slug)
);

/* ---- learner state ---- */

CREATE TABLE IF NOT EXISTS enrollments (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL REFERENCES courses(slug) ON DELETE CASCADE,
  created_at  TEXT NOT NULL,
  PRIMARY KEY (user_id, course_slug)
);

CREATE TABLE IF NOT EXISTS completions (
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_slug  TEXT NOT NULL,
  lesson_slug  TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  PRIMARY KEY (user_id, course_slug, lesson_slug)
);

CREATE TABLE IF NOT EXISTS lab_progress (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lab_slug   TEXT NOT NULL,
  scenario   TEXT NOT NULL,
  state      TEXT NOT NULL DEFAULT 'started',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, lab_slug, scenario)
);

CREATE TABLE IF NOT EXISTS reviews (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  course_slug TEXT NOT NULL REFERENCES courses(slug) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating      INTEGER NOT NULL,
  body        TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL,
  UNIQUE (course_slug, user_id)
);

/* ---- commercial ---- */

CREATE TABLE IF NOT EXISTS orders (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id          INTEGER NOT NULL REFERENCES users(id),
  product_sku      TEXT NOT NULL,
  amount_agorot    INTEGER NOT NULL,
  currency         TEXT NOT NULL DEFAULT 'ILS',
  vat_agorot       INTEGER NOT NULL DEFAULT 0,
  status           TEXT NOT NULL,
  provider         TEXT,
  provider_ref     TEXT,
  provider_payload TEXT,
  invoice_number   TEXT,
  created_at       TEXT NOT NULL,
  paid_at          TEXT,
  refunded_at      TEXT
);

CREATE TABLE IF NOT EXISTS entitlements (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject    TEXT NOT NULL,
  source     TEXT NOT NULL,
  starts_at  TEXT NOT NULL,
  ends_at    TEXT,
  order_id   INTEGER REFERENCES orders(id),
  revoked_at TEXT,
  UNIQUE (user_id, subject, starts_at)
);
CREATE INDEX IF NOT EXISTS entitlements_by_user ON entitlements(user_id, subject);

CREATE TABLE IF NOT EXISTS waitlist (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL DEFAULT '',
  note       TEXT NOT NULL DEFAULT '',
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  source     TEXT NOT NULL DEFAULT 'pricing',
  created_at TEXT NOT NULL
);

/* ---- permissions: custom roles, capabilities, per-user overrides ---- */

CREATE TABLE IF NOT EXISTS roles (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_system   INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS capabilities (
  key   TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  grp   TEXT NOT NULL DEFAULT 'content'
);

CREATE TABLE IF NOT EXISTS role_capabilities (
  role_id    INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  capability TEXT NOT NULL REFERENCES capabilities(key) ON DELETE CASCADE,
  PRIMARY KEY (role_id, capability)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id    INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  granted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, role_id)
);

/* allow=1 grants a capability the roles do not give; allow=0 revokes one they do. */
CREATE TABLE IF NOT EXISTS user_capabilities (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  capability TEXT NOT NULL REFERENCES capabilities(key) ON DELETE CASCADE,
  allow      INTEGER NOT NULL,
  granted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, capability)
);

CREATE TABLE IF NOT EXISTS reviews_queue (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_type TEXT NOT NULL,
  subject_id   TEXT NOT NULL,
  submitted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status       TEXT NOT NULL DEFAULT 'pending',
  note         TEXT NOT NULL DEFAULT '',
  reviewed_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at   TEXT NOT NULL,
  reviewed_at  TEXT
);
CREATE INDEX IF NOT EXISTS reviews_queue_open ON reviews_queue(status, created_at);
`;

/* Additive column migrations for volumes created before a column existed.
   SQLite has no IF NOT EXISTS for columns, so each runs and may fail once. */
const MIGRATIONS = [
  `ALTER TABLE courses ADD COLUMN author_id INTEGER`,
  `ALTER TABLE courses ADD COLUMN origin TEXT NOT NULL DEFAULT 'seed'`,
  `ALTER TABLE courses ADD COLUMN updated_at TEXT`,
  `ALTER TABLE lessons ADD COLUMN author_id INTEGER`,
  `ALTER TABLE lessons ADD COLUMN origin TEXT NOT NULL DEFAULT 'seed'`,
  `ALTER TABLE tutorials ADD COLUMN author_id INTEGER`,
  `ALTER TABLE tutorials ADD COLUMN origin TEXT NOT NULL DEFAULT 'seed'`,
  `ALTER TABLE tutorials ADD COLUMN status TEXT NOT NULL DEFAULT 'published'`,
  `ALTER TABLE tutorials ADD COLUMN updated_at TEXT`,
  `ALTER TABLE labs ADD COLUMN author_id INTEGER`,
  `ALTER TABLE labs ADD COLUMN repo_url TEXT`,
  `ALTER TABLE labs ADD COLUMN repo_ref TEXT`,
  `ALTER TABLE labs ADD COLUMN validation_state TEXT NOT NULL DEFAULT 'unverified'`,
  `ALTER TABLE labs ADD COLUMN last_validated_ref TEXT`,
  `ALTER TABLE labs ADD COLUMN updated_at TEXT`,
];

function open(): DatabaseSync {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(DB_FILE);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  db.exec(SCHEMA);
  for (const sql of MIGRATIONS) {
    try {
      db.exec(sql);
    } catch {
      /* column already exists on this volume */
    }
  }
  return db;
}

export function db(): DatabaseSync {
  if (!global.__academyDb) global.__academyDb = open();
  return global.__academyDb;
}

export function meta(key: string): string | null {
  const row = db().prepare('SELECT value FROM meta WHERE key = ?').get(key) as
    | { value: string }
    | undefined;
  return row ? row.value : null;
}

export function setMeta(key: string, value: string) {
  db()
    .prepare(
      'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    )
    .run(key, value);
}
