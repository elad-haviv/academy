import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  OAUTH_STATE_COOKIE,
  authorizeUrl,
  googleConfigured,
  newState,
} from '@/lib/google';

export const dynamic = 'force-dynamic';

/** Starts the Google sign-in: mint a state, remember it, bounce to Google. */
export async function GET(req: NextRequest) {
  if (!googleConfigured()) {
    return NextResponse.redirect(new URL('/login?error=sso_unavailable', req.url));
  }
  const next = req.nextUrl.searchParams.get('next') || '/dashboard';
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

  const state = newState();
  const jar = await cookies();
  jar.set(OAUTH_STATE_COOKIE, `${state}|${safeNext}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 600,
  });

  return NextResponse.redirect(authorizeUrl(state));
}
