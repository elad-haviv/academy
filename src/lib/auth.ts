import 'server-only';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from './db';

export const SESSION_COOKIE = 'academy_session';
const SESSION_DAYS = 30;

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: string;
};

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, digest] = stored.split(':');
  if (scheme !== 'scrypt' || !salt || !digest) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(derived, 'hex');
  const b = Buffer.from(digest, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function createSession(userId: number): void {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  db()
    .prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
    .run(token, userId, expires.toISOString());
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    expires,
  });
}

export function destroySession(): void {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) db().prepare('DELETE FROM sessions WHERE token = ?').run(token);
  cookies().delete(SESSION_COOKIE);
}

export function currentUser(): SessionUser | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = db()
    .prepare(
      `SELECT u.id AS id, u.email AS email, u.name AS name, u.role AS role, s.expires_at AS expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`
    )
    .get(token) as
    | { id: number; email: string; name: string; role: string; expires_at: string }
    | undefined;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db().prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }
  return { id: row.id, email: row.email, name: row.name, role: row.role };
}

export function requireUser(next: string): SessionUser {
  const user = currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}
