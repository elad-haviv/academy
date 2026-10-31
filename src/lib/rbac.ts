import 'server-only';
import { db, meta, setMeta } from './db';
import type { User } from './auth';

/**
 * Permissions
 * -----------
 * Roles are arbitrary rows; a role is just a named bundle of capabilities.
 * A user can hold several roles, and `user_capabilities` can grant or revoke a
 * single capability on top of what the roles say (allow=1 grant, allow=0 revoke).
 *
 * Effective set = (union of role capabilities) - revoked + directly granted.
 * Every guard in the app goes through `can()`, so the UI and the server actions
 * can never disagree about who may do what.
 */

export type Capability = {
  key: string;
  label: string;
  grp: 'content' | 'labs' | 'people' | 'system';
};

export const CAPABILITIES: Capability[] = [
  { key: 'content.create', label: 'יצירת תוכן חדש', grp: 'content' },
  { key: 'content.edit.own', label: 'עריכת תוכן עצמי', grp: 'content' },
  { key: 'content.edit.any', label: 'עריכת תוכן של אחרים', grp: 'content' },
  { key: 'content.submit', label: 'שליחה לבדיקה', grp: 'content' },
  { key: 'content.publish', label: 'פרסום תוכן מאושר', grp: 'content' },
  { key: 'content.review', label: 'אישור או החזרה לטיוטה', grp: 'content' },
  { key: 'content.delete', label: 'מחיקת תוכן', grp: 'content' },
  { key: 'labs.manage', label: 'ניהול רישום מעבדות', grp: 'labs' },
  { key: 'labs.validate', label: 'אימות מעבדה (בדיקת נכונות)', grp: 'labs' },
  { key: 'users.read', label: 'צפייה במשתמשים', grp: 'people' },
  { key: 'users.manage', label: 'ניהול משתמשים ותפקידים', grp: 'people' },
  { key: 'roles.manage', label: 'יצירת תפקידים והרשאות', grp: 'people' },
  { key: 'audit.read', label: 'צפייה ביומן פעולות', grp: 'system' },
];

export const CAPABILITY_KEYS = new Set(CAPABILITIES.map((c) => c.key));

export const DEFAULT_ROLES: {
  slug: string;
  name: string;
  description: string;
  capabilities: string[];
}[] = [
  {
    slug: 'system_admin',
    name: 'מנהל מערכת',
    description: 'הכול: משתמשים, תפקידים, תוכן ואימות מעבדות.',
    capabilities: CAPABILITIES.map((c) => c.key),
  },
  {
    slug: 'content_creator',
    name: 'יוצר תוכן',
    description: 'כותב מדריכים, קורסים ומעבדות, ומגיש לבדיקה. לא מפרסם לבד.',
    capabilities: [
      'content.create',
      'content.edit.own',
      'content.submit',
      'labs.manage',
    ],
  },
  {
    slug: 'content_moderator',
    name: 'עורך תוכן',
    description: 'בודק תוכן שהוגש, מאשר פרסום, מחזיר לתיקון ומאמת מעבדות.',
    capabilities: [
      'content.create',
      'content.edit.own',
      'content.edit.any',
      'content.review',
      'content.publish',
      'labs.manage',
      'labs.validate',
      'users.read',
    ],
  },
  {
    slug: 'content_consumer',
    name: 'לומד',
    description: 'צורך תוכן. אין הרשאות ניהול.',
    capabilities: [],
  },
];

const SEED_KEY = 'permissions_seed_v1';

/** Runs once per volume; safe to call on every request. */
export function ensurePermissionsSeeded() {
  if (meta(SEED_KEY) === 'done') return;
  const d = db();
  const now = new Date().toISOString();

  const insertCap = d.prepare(
    'INSERT INTO capabilities (key, label, grp) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET label = excluded.label, grp = excluded.grp',
  );
  for (const c of CAPABILITIES) insertCap.run(c.key, c.label, c.grp);

  for (const role of DEFAULT_ROLES) {
    d.prepare(
      `INSERT INTO roles (slug, name, description, is_system, created_at)
       VALUES (?, ?, ?, 1, ?) ON CONFLICT(slug) DO NOTHING`,
    ).run(role.slug, role.name, role.description, now);
    const row = d.prepare('SELECT id FROM roles WHERE slug = ?').get(role.slug) as { id: number };
    for (const cap of role.capabilities) {
      d.prepare(
        'INSERT INTO role_capabilities (role_id, capability) VALUES (?, ?) ON CONFLICT DO NOTHING',
      ).run(row.id, cap);
    }
  }

  // Carry legacy users.role values into the new role tables.
  const legacy = d
    .prepare(
      `SELECT u.id, u.role FROM users u
        WHERE NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = u.id)`,
    )
    .all() as unknown as { id: number; role: string }[];
  for (const u of legacy) {
    const slug = u.role === 'admin' ? 'system_admin' : u.role === 'creator' ? 'content_creator' : u.role === 'moderator' ? 'content_moderator' : 'content_consumer';
    const role = d.prepare('SELECT id FROM roles WHERE slug = ?').get(slug) as { id: number } | undefined;
    if (role) {
      d.prepare(
        'INSERT INTO user_roles (user_id, role_id, granted_by, created_at) VALUES (?, ?, NULL, ?) ON CONFLICT DO NOTHING',
      ).run(u.id, role.id, now);
    }
  }

  // A brand-new install has nobody who can administer it: the first user with
  // the legacy admin flag (or, failing that, nothing) is left untouched — Elad's
  // account is promoted explicitly with scripts/grant-admin.mjs.
  setMeta(SEED_KEY, 'done');
}

export type RoleRow = {
  id: number;
  slug: string;
  name: string;
  description: string;
  is_system: number;
  capabilities: string[];
};

export function listRoles(): RoleRow[] {
  ensurePermissionsSeeded();
  const d = db();
  const roles = d
    .prepare('SELECT id, slug, name, description, is_system FROM roles ORDER BY is_system DESC, name ASC')
    .all() as unknown as Omit<RoleRow, 'capabilities'>[];
  const caps = d
    .prepare('SELECT role_id, capability FROM role_capabilities')
    .all() as unknown as { role_id: number; capability: string }[];
  return roles.map((r) => ({
    ...r,
    capabilities: caps.filter((c) => c.role_id === r.id).map((c) => c.capability),
  }));
}

export function rolesFor(userId: number): RoleRow[] {
  ensurePermissionsSeeded();
  const d = db();
  return d
    .prepare(
      `SELECT r.id, r.slug, r.name, r.description, r.is_system
         FROM user_roles ur JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = ? ORDER BY r.name`,
    )
    .all(userId) as unknown as RoleRow[];
}

/** Effective capability set for a user: roles, minus revokes, plus grants. */
export function capabilitiesFor(userId: number): Set<string> {
  ensurePermissionsSeeded();
  const d = db();
  const fromRoles = d
    .prepare(
      `SELECT DISTINCT rc.capability
         FROM user_roles ur
         JOIN role_capabilities rc ON rc.role_id = ur.role_id
        WHERE ur.user_id = ?`,
    )
    .all(userId) as unknown as { capability: string }[];
  const overrides = d
    .prepare('SELECT capability, allow FROM user_capabilities WHERE user_id = ?')
    .all(userId) as unknown as { capability: string; allow: number }[];

  const set = new Set(fromRoles.map((r) => r.capability));
  for (const o of overrides) {
    if (o.allow === 1) set.add(o.capability);
    else set.delete(o.capability);
  }
  return set;
}

export function can(user: User | null, capability: string): boolean {
  if (!user) return false;
  if (!CAPABILITY_KEYS.has(capability)) return false;
  return capabilitiesFor(user.id).has(capability);
}

export function canAny(user: User | null, capabilities: string[]): boolean {
  return capabilities.some((c) => can(user, c));
}

/**
 * Bootstrap admins: emails listed in ACADEMY_ADMINS (comma separated) always
 * hold system_admin. This is the only way to create the first administrator on
 * a fresh volume — nothing self-serves admin through the UI.
 */
export function promoteBootstrapAdmin(userId: number, email: string) {
  const list = (process.env.ACADEMY_ADMINS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!list.includes(email.toLowerCase())) return;
  ensurePermissionsSeeded();
  const role = db().prepare("SELECT id FROM roles WHERE slug = 'system_admin'").get() as
    | { id: number }
    | undefined;
  if (!role) return;
  db()
    .prepare(
      'INSERT INTO user_roles (user_id, role_id, granted_by, created_at) VALUES (?, ?, NULL, ?) ON CONFLICT DO NOTHING',
    )
    .run(userId, role.id, new Date().toISOString());
}

export function hasRole(userId: number, slug: string): boolean {
  return rolesFor(userId).some((r) => r.slug === slug);
}
