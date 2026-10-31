import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import {
  OAUTH_STATE_COOKIE,
  exchangeCode,
  googleConfigured,
  linkOrCreateUser,
} from '@/lib/google';
import { createSession, setSessionCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!googleConfigured()) {
    return NextResponse.redirect(new URL('/login?error=sso_unavailable', req.url));
  }

  const url = req.nextUrl;
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (url.searchParams.get('error') || !code || !state) {
    return NextResponse.redirect(new URL('/login?error=sso_cancelled', req.url));
  }

  const jar = await cookies();
  const stored = jar.get(OAUTH_STATE_COOKIE)?.value ?? '';
  jar.delete(OAUTH_STATE_COOKIE);
  const [expected, storedNext] = stored.split('|');
  if (!expected || expected !== state) {
    return NextResponse.redirect(new URL('/login?error=sso_state', req.url));
  }
  const next = storedNext && storedNext.startsWith('/') && !storedNext.startsWith('//') ? storedNext : '/dashboard';

  try {
    const profile = await exchangeCode(code);
    const userId = linkOrCreateUser(profile);
    const token = createSession(userId);
    await setSessionCookie(token);
    db()
      .prepare(
        `INSERT INTO audit_log (actor_user_id, action, subject, detail, ip, created_at)
         VALUES (?, 'auth.sso_login', ?, 'google', ?, ?)`,
      )
      .run(userId, profile.email, req.headers.get('x-forwarded-for') ?? '', new Date().toISOString());
    return NextResponse.redirect(new URL(next, req.url));
  } catch (err) {
    const code = err instanceof Error && /not verified/.test(err.message) ? 'sso_unverified' : 'sso_failed';
    return NextResponse.redirect(new URL(`/login?error=${code}`, req.url));
  }
}
