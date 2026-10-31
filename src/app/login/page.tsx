import Link from 'next/link';
import { redirect } from 'next/navigation';
import { loginAction } from '../actions';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/Sections';
import { currentUser } from '@/lib/auth';
import { googleConfigured } from '@/lib/google';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'כניסה' };

const ERRORS: Record<string, string> = {
  credentials: 'האימייל או הסיסמה לא נכונים.',
  email: 'כתובת אימייל לא תקינה.',
  sso_failed: 'הכניסה עם Google לא הושלמה. נסו שוב.',
  sso_cancelled: 'הכניסה עם Google בוטלה.',
  sso_state: 'תוקף הבקשה פג. נסו שוב.',
  sso_unverified: 'החשבון ב-Google לא אומת. אמתו את האימייל ונסו שוב.',
  sso_unavailable: 'כניסה עם Google עדיין לא מוגדרת באתר הזה.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const sso = googleConfigured();
  const user = await currentUser();
  if (user) redirect('/dashboard');

  return (
    <>
      <SiteHeader current="" />
      <main className="wrap auth">
        <div className="auth-card">
          <h1>כניסה</h1>
          <p className="auth-sub">ממשיכים מהמקום שבו הפסקתם.</p>
          {error && <p className="form-error">{ERRORS[error] ?? 'משהו נכשל. נסו שוב.'}</p>}
          {sso && (
            <>
              <a
                className="btn lg sso-btn"
                href={`/auth/google/start?next=${encodeURIComponent(next ?? '/dashboard')}`}
              >
                <span className="sso-g" aria-hidden="true">G</span>
                כניסה עם Google
              </a>
              <p className="auth-or">או עם אימייל וסיסמה</p>
            </>
          )}
          <form action={loginAction} className="form">
            <input type="hidden" name="next" value={next ?? '/dashboard'} />
            <label>
              אימייל
              <input type="email" name="email" required autoComplete="email" placeholder="you@example.com" />
            </label>
            <label>
              סיסמה
              <input type="password" name="password" required autoComplete="current-password" minLength={6} />
            </label>
            <button className="btn lg" type="submit">
              כניסה
            </button>
          </form>
          <p className="auth-alt">
            אין חשבון? <Link href="/register">פתיחת חשבון בניסיון 7 ימים</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
