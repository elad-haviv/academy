import 'server-only';
import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { db } from './db';

export const SESSION_COOKIE = 'academy_session';
const SESSION_DAYS = 30;

export type User = {
  id: number;
  email: string;
  name: string;
  role: string;
  created_at: string;
};

/* ---- passwords: scrypt, per-user salt, no plaintext anywhere ---- */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false;
  const [scheme, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  if (candidate.length !== expected.length) return false;
  return crypto.timingSafeEqual(candidate, expected);
}

/* ---- sessions ---- */

export function createSession(userId: number): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5).toISOString();
  db().prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(
    token,
    userId,
    expires,
  );
  return token;
}

export function destroySession(token: string) {
  db().prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = db()
    .prepare(
      `SELECT u.id, u.email, u.name, u.role, u.created_at, s.expires_at
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token = ?`,
    )
    .get(token) as (User & { expires_at: string }) | undefined;

  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    destroySession(token);
    return null;
  }
  return { id: row.id, email: row.email, name: row.name, role: row.role, created_at: row.created_at };
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export function createUser(email: string, name: string, password: string): number {
  const now = new Date().toISOString();
  const info = db()
    .prepare(
      `INSERT INTO users (email, name, password_hash, role, email_verified_at, created_at)
       VALUES (?, ?, ?, 'student', NULL, ?)`,
    )
    .run(email.toLowerCase().trim(), name.trim(), hashPassword(password), now);
  return Number(info.lastInsertRowid);
}

export function findUserByEmail(email: string) {
  return db()
    .prepare('SELECT id, email, name, password_hash, role, created_at FROM users WHERE email = ?')
    .get(email.toLowerCase().trim()) as
    | (User & { password_hash: string | null })
    | undefined;
}
