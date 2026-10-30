import 'server-only';
import { notFound } from 'next/navigation';
import { currentUser, type SessionUser } from './auth';
import { db } from './db';
import { getLesson, type ContentAccess, type LessonDetail } from './queries';

/**
 * Access control (spec §3.3, §5.3). One module owns the answer to
 * "may this viewer read this lesson body?" — server components and actions
 * both come through here, and gated bodies are never put in the HTML.
 *
 * The paywall is behind a single env flag so it can be switched on without a
 * code change: ACADEMY_PAYWALL=on enables premium gating; anything else renders
 * full content.
 */

export type GateReason = 'premium' | 'verify' | 'auth';

export type Gate =
  | { allowed: true; outcome: 'allowed' }
  | { allowed: false; outcome: GateReason; previewMd: string };

export type ViewerRole = 'guest' | 'student' | 'member' | 'instructor' | 'admin';

export type Entitlement = {
  id: number;
  subject: string;
  source: string;
  startsAt: string;
  endsAt: string | null;
};

export type Viewer = {
  user: SessionUser | null;
  role: ViewerRole;
  isMember: boolean;
  isVerified: boolean;
  entitlements: Entitlement[];
};

export const PREVIEW_LIMIT = 1200;
const PREVIEW_MARKER = '<!-- preview-end -->';

export function paywallEnabled(): boolean {
  return process.env.ACADEMY_PAYWALL === 'on';
}

/** An entitlement is active: started, not ended, not revoked (spec §5.4). */
export function activeEntitlements(userId: number, now: string = new Date().toISOString()): Entitlement[] {
  const rows = db()
    .prepare(
      `SELECT id, subject, source, starts_at, ends_at FROM entitlements
       WHERE user_id = ? AND starts_at <= ? AND (ends_at IS NULL OR ends_at > ?) AND revoked_at IS NULL
       ORDER BY starts_at DESC`
    )
    .all(userId, now, now) as any[];
  return rows.map((row) => ({
    id: row.id,
    subject: row.subject,
    source: row.source,
    startsAt: row.starts_at,
    endsAt: row.ends_at ?? null,
  }));
}

export function resolveViewer(): Viewer {
  const user = currentUser();
  if (!user) {
    return { user: null, role: 'guest', isMember: false, isVerified: false, entitlements: [] };
  }
  const entitlements = activeEntitlements(user.id);
  const staff = user.role === 'admin' || user.role === 'instructor';
  const isMember = staff || entitlements.some((entitlement) => entitlement.subject === 'subscription');
  const role: ViewerRole = staff ? (user.role as 'admin' | 'instructor') : isMember ? 'member' : 'student';
  return {
    user,
    role,
    // `member` is derived, never written to users.role (spec §3.1).
    isMember,
    isVerified: Boolean(user.emailVerifiedAt),
    entitlements,
  };
}

/** Subject-scoped check, e.g. 'course:docker-without-ceremony' or 'lab:agl-field-course'. */
export function hasEntitlement(viewer: Viewer, subject: string): boolean {
  if (viewer.role === 'admin' || viewer.role === 'instructor') return true;
  if (viewer.entitlements.some((entitlement) => entitlement.subject === 'subscription')) return true;
  return viewer.entitlements.some((entitlement) => entitlement.subject === subject);
}

/** True when this lesson would be gated for someone without a subscription. */
export function isPremiumLesson(lesson: { access: ContentAccess; isPreview: boolean }): boolean {
  return lesson.access === 'premium' && !lesson.isPreview;
}

/**
 * The public slice of a lesson body: everything above `<!-- preview-end -->`,
 * otherwise the first ~1200 characters cut at a paragraph boundary. Never
 * returns the full body, and never leaves an unterminated code fence.
 */
export function previewMarkdown(body: string, limit: number = PREVIEW_LIMIT): string {
  const markerIndex = body.indexOf(PREVIEW_MARKER);
  if (markerIndex !== -1) {
    return balanceFences(body.slice(0, markerIndex).trim());
  }
  const text = body.trim();
  if (text.length <= limit) return balanceFences(text);

  const head = text.slice(0, limit);
  const paragraph = head.lastIndexOf('\n\n');
  if (paragraph > limit * 0.45) return balanceFences(text.slice(0, paragraph).trim());
  const line = head.lastIndexOf('\n');
  if (line > limit * 0.6) return balanceFences(text.slice(0, line).trim());
  return balanceFences(head.trim());
}

function balanceFences(text: string): string {
  const fences = (text.match(/^```/gm) ?? []).length;
  if (fences % 2 === 0) return text;
  const lastFence = text.lastIndexOf('\n```');
  return lastFence > 0 ? text.slice(0, lastFence).trim() : text;
}

/**
 * Gate a lesson for a viewer. All four outcomes are deliberate:
 * allowed  — free, preview, member, staff, or the paywall flag is off
 * auth     — not signed in
 * verify   — signed in but the email is unverified (can't start a trial, §4.4)
 * premium  — signed in, verified, no active entitlement
 */
export function gateLesson(viewer: Viewer, lesson: { access: ContentAccess; isPreview: boolean; body: string }): Gate {
  if (!paywallEnabled()) return { allowed: true, outcome: 'allowed' };
  if (!isPremiumLesson(lesson)) return { allowed: true, outcome: 'allowed' };
  if (viewer.isMember) return { allowed: true, outcome: 'allowed' };

  const previewMd = previewMarkdown(lesson.body);
  if (!viewer.user) return { allowed: false, outcome: 'auth', previewMd };
  if (!viewer.isVerified) return { allowed: false, outcome: 'verify', previewMd };
  return { allowed: false, outcome: 'premium', previewMd };
}

export type LessonGate = { lesson: LessonDetail; gate: Gate };

/**
 * Loads a lesson and gates it. Missing lesson → 404. A gated lesson is *not*
 * redirected: spec §5.3 requires HTTP 200 with a preview so the page stays
 * indexable and shareable.
 */
export function requireLesson(viewer: Viewer, courseSlug: string, lessonSlug: string): LessonGate {
  const lesson = getLesson(courseSlug, lessonSlug);
  if (!lesson) notFound();
  return { lesson, gate: gateLesson(viewer, lesson) };
}

/** Progress tracking is allowed only on content the viewer may read fully. */
export function canTrackLesson(viewer: Viewer, lesson: { access: ContentAccess; isPreview: boolean }): boolean {
  return gateLesson(viewer, { ...lesson, body: '' }).allowed;
}
