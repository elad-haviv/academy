import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { registerAction } from '@/app/actions';
import { currentUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'הרשמה' };

const ERRORS: Record<string, string> = {
  name: 'צריך שם באורך שני תווים לפחות.',
  email: 'כתובת האימייל לא תקינה.',
  password: 'הסיסמה צריכה להיות באורך 8 תווים לפחות.',
  taken: 'כבר יש חשבון עם האימייל הזה. אפשר להתחבר.',
};

export default function RegisterPage({ searchParams }: { searchParams: { error?: string; next?: string } }) {
  const user = currentUser();
  const next = searchParams.next ?? '/dashboard';
  if (user) redirect(next);

  return (
    <div className="wrap">
      <div className="auth-shell">
        <h1>פתיחת חשבון</h1>
        <p className="sub">חינם, בלי כרטיס אשראי. החשבון שומר את ההתקדמות בקורסים ובמעבדות.</p>
        {searchParams.error ? <p className="form-error">{ERRORS[searchParams.error] ?? 'משהו לא עבד, נסו שוב.'}</p> : null}
        <form action={registerAction} className="auth-form">
          <input type="hidden" name="next" value={next} />
          <label>
            שם
            <input type="text" name="name" required autoComplete="name" placeholder="איך לפנות אליך" />
          </label>
          <label>
            אימייל
            <input type="email" name="email" required autoComplete="email" placeholder="you@example.com" dir="ltr" />
          </label>
          <label>
            סיסמה
            <input type="password" name="password" required minLength={8} autoComplete="new-password" dir="ltr" />
          </label>
          <button type="submit" className="btn">
            יצירת חשבון
          </button>
        </form>
        <p className="auth-switch">
          יש כבר חשבון? <Link href={`/login?next=${encodeURIComponent(next)}`}>התחברות</Link>
        </p>
      </div>
    </div>
  );
}
