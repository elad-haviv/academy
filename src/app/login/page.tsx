import Link from 'next/link';
import { redirect } from 'next/navigation';
import { loginAction } from '../actions';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/Sections';
import { currentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'כניסה' };

const ERRORS: Record<string, string> = {
  credentials: 'האימייל או הסיסמה לא נכונים.',
  email: 'כתובת אימייל לא תקינה.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const user = await currentUser();
  if (user) redirect('/dashboard');

  return (
    <>
      <SiteHeader current="" />
      <main className="wrap auth">
        <div className="auth-card">
          <h1>כניסה</h1>
          <p className="auth-sub">המשך מהמקום שבו הפסקת.</p>
          {error && <p className="form-error">{ERRORS[error] ?? 'משהו נכשל. נסה שוב.'}</p>}
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
            אין חשבון? <Link href="/register">פתיחה בניסיון 7 ימים</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
