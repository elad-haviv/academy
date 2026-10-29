import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { loginAction } from '@/app/actions';
import { currentUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'התחברות' };

export default function LoginPage({ searchParams }: { searchParams: { error?: string; next?: string } }) {
  const user = currentUser();
  const next = searchParams.next ?? '/dashboard';
  if (user) redirect(next);

  return (
    <div className="wrap">
      <div className="auth-shell">
        <h1>התחברות</h1>
        <p className="sub">ממשיכים מהמקום שעצרת — ההתקדמות, הסימונים והקורסים שמורים בחשבון.</p>
        {searchParams.error ? <p className="form-error">כתובת האימייל או הסיסמה לא מתאימות. נסו שוב.</p> : null}
        <form action={loginAction} className="auth-form">
          <input type="hidden" name="next" value={next} />
          <label>
            אימייל
            <input type="email" name="email" required autoComplete="email" placeholder="you@example.com" dir="ltr" />
          </label>
          <label>
            סיסמה
            <input type="password" name="password" required autoComplete="current-password" dir="ltr" />
          </label>
          <button type="submit" className="btn">
            התחברות
          </button>
        </form>
        <p className="auth-switch">
          אין חשבון?{' '}
          <Link href={`/register?next=${encodeURIComponent(next)}`}>פתיחת חשבון חינם</Link>
        </p>
      </div>
    </div>
  );
}
