import { db } from './db';
import type { User } from './auth';

/**
 * One function decides access. UI and route handlers both call it, so a gated
 * page and a gated API can never disagree.
 *
 * Subjects: `all` (paid subscription / trial), `lab:<slug>`, `course:<slug>`.
 * A trial entitlement is written at registration for 7 days, no card required.
 */

export const TRIAL_DAYS = 7;

export function grant(userId: number, subject: string, source: string, days?: number) {
  const now = new Date();
  const ends = days ? new Date(now.getTime() + days * 864e5).toISOString() : null;
  db()
    .prepare(
      `INSERT INTO entitlements (user_id, subject, source, starts_at, ends_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(userId, subject, source, now.toISOString(), ends);
}

export function grantTrial(userId: number) {
  grant(userId, 'all', 'trial', TRIAL_DAYS);
}

export function activeEntitlements(userId: number): string[] {
  const now = new Date().toISOString();
  const rows = db()
    .prepare(
      `SELECT subject FROM entitlements
        WHERE user_id = ?
          AND revoked_at IS NULL
          AND starts_at <= ?
          AND (ends_at IS NULL OR ends_at > ?)`,
    )
    .all(userId, now, now) as unknown as { subject: string }[];
  return rows.map((r) => r.subject);
}

export function canAccess(user: User | null, subject: string): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const held = activeEntitlements(user.id);
  return held.includes('all') || held.includes(subject);
}

/** A gated page still returns 200 with a real preview — never a 402 or blurred text. */
export const PREVIEW_CHARS = 1200;

export function preview(body: string, limit = PREVIEW_CHARS): { text: string; truncated: boolean } {
  const plain = body.replace(/\s+/g, ' ').trim();
  if (plain.length <= limit) return { text: plain, truncated: false };
  const cut = plain.slice(0, limit);
  const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('\n'));
  return { text: (lastStop > limit * 0.6 ? cut.slice(0, lastStop + 1) : cut).trim(), truncated: true };
}
