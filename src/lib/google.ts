import 'server-only';
import crypto from 'node:crypto';
import { db } from './db';
import { promoteBootstrapAdmin } from './rbac';

/**
 * Google SSO (OpenID Connect, authorization-code flow).
 *
 * Configured entirely by env: GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET.
 * Optional GOOGLE_REDIRECT_URI when the derived one does not match what was
 * registered in the Google console.
 *
 * Nothing here trusts the client: the state is compared against an httpOnly
 * cookie set at /auth/google/start, and only a verified Google email links to
 * an existing account (otherwise anyone could claim someone else's address).
 */

// Overridable so the flow can be exercised end to end against a local mock
// (GOOGLE_*_URL); production never sets them.
const AUTH_ENDPOINT = process.env.GOOGLE_AUTH_URL || 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = process.env.GOOGLE_TOKEN_URL || 'https://oauth2.googleapis.com/token';
const USERINFO_ENDPOINT = process.env.GOOGLE_USERINFO_URL || 'https://openidconnect.googleapis.com/v1/userinfo';

export const OAUTH_STATE_COOKIE = 'academy_oauth_state';

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function redirectUri(): string {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  const base = process.env.APP_ORIGIN || 'https://academy.haviv.pro';
  return `${base.replace(/\/$/, '')}/auth/google/callback`;
}

export function newState(): string {
  return crypto.randomBytes(24).toString('hex');
}

export function authorizeUrl(state: string): string {
  const url = new URL(AUTH_ENDPOINT);
  url.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID ?? '');
  url.searchParams.set('redirect_uri', redirectUri());
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  url.searchParams.set('prompt', 'select_account');
  url.searchParams.set('access_type', 'online');
  return url.toString();
}

export type GoogleProfile = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
};

export async function exchangeCode(code: string): Promise<GoogleProfile> {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID ?? '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    redirect_uri: redirectUri(),
    grant_type: 'authorization_code',
  });

  const tokenRes = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });
  if (!tokenRes.ok) throw new Error(`google token exchange failed: ${tokenRes.status}`);
  const token = (await tokenRes.json()) as { access_token?: string; id_token?: string };
  if (!token.access_token) throw new Error('google token response had no access_token');

  const infoRes = await fetch(USERINFO_ENDPOINT, {
    headers: { authorization: `Bearer ${token.access_token}` },
    cache: 'no-store',
  });
  if (!infoRes.ok) throw new Error(`google userinfo failed: ${infoRes.status}`);
  const info = (await infoRes.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean | string;
    name?: string;
  };

  if (!info.sub || !info.email) throw new Error('google profile incomplete');
  return {
    sub: String(info.sub),
    email: String(info.email).toLowerCase(),
    emailVerified: info.email_verified === true || info.email_verified === 'true',
    name: (info.name || String(info.email).split('@')[0]).trim(),
  };
}

/**
 * Link the Google account to a local user.
 * - Known (provider, sub): reuse that user.
 * - Verified email matching an existing user: link it to that user.
 * - Otherwise: create a new user with the default consumer role.
 */
export function linkOrCreateUser(profile: GoogleProfile): number {
  if (!profile.emailVerified) {
    throw new Error('google account email is not verified');
  }
  const d = db();
  const now = new Date().toISOString();

  const linked = d
    .prepare('SELECT user_id FROM oauth_accounts WHERE provider = ? AND provider_account_id = ?')
    .get('google', profile.sub) as { user_id: number } | undefined;
  if (linked) {
    d.prepare('UPDATE users SET email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?').run(
      now,
      linked.user_id,
    );
    return linked.user_id;
  }

  const existing = d.prepare('SELECT id FROM users WHERE email = ?').get(profile.email) as
    | { id: number }
    | undefined;

  let userId: number;
  if (existing) {
    userId = existing.id;
    d.prepare('UPDATE users SET email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?').run(
      now,
      userId,
    );
  } else {
    const info = d
      .prepare(
        `INSERT INTO users (email, name, password_hash, role, email_verified_at, created_at)
         VALUES (?, ?, NULL, 'student', ?, ?)`,
      )
      .run(profile.email, profile.name, now, now);
    userId = Number(info.lastInsertRowid);
  }

  d.prepare(
    `INSERT INTO oauth_accounts (provider, provider_account_id, user_id, email_at_link, linked_at)
     VALUES ('google', ?, ?, ?, ?) ON CONFLICT(provider, provider_account_id) DO UPDATE SET user_id = excluded.user_id`,
  ).run(profile.sub, userId, profile.email, now);

  // Default role for a freshly linked identity (no-op if they already hold roles).
  const hasRole = d.prepare('SELECT 1 AS x FROM user_roles WHERE user_id = ?').get(userId);
  if (!hasRole) {
    const role = d.prepare("SELECT id FROM roles WHERE slug = 'content_consumer'").get() as
      | { id: number }
      | undefined;
    if (role) {
      d.prepare(
        'INSERT INTO user_roles (user_id, role_id, granted_by, created_at) VALUES (?, ?, NULL, ?) ON CONFLICT DO NOTHING',
      ).run(userId, role.id, now);
    }
  }

  promoteBootstrapAdmin(userId, profile.email);
  return userId;
}
