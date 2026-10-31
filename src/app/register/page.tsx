import Link from 'next/link';
import { redirect } from 'next/navigation';
import { registerAction } from '../actions';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/Sections';
import { currentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'פתיחת חשבון' };

const ERRORS: Record<string, string> = {
  name: 'צריך שם באורך שני תווים לפחות.',
  email: 'כתובת אימייל לא תקינה.',
  password: 'סיסמה קצרה מדי — לפחות 8 תווים.',
  exists: 'כבר יש חשבון עם האימייל הזה. נסה להיכנס.',
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; plan?: string }>;
}) {
  const { error, next, plan } = await searchParams;
  const user = await currentUser();
  if (user) redirect('/dashboard');

  return (
    <>
      <SiteHeader current="" />
      <main className="wrap auth">
        <div className="auth-card">
          <h1>פתיחת חשבון</h1>
          <p className="auth-sub">
            7 ימים מלאים, בלי כרטיס אשראי. כולל שתי המעבדות וכל השיעורים.
            {plan === 'annual' && ' אחרי הניסיון: ₪349 לשנה.'}
          </p>
          {error && <p className="form-error">{ERRORS[error] ?? 'משהו נכשל. נסה שוב.'}</p>}
          <form action={registerAction} className="form">
            <input type="hidden" name="next" value={next ?? '/dashboard'} />
            <label>
              שם
              <input type="text" name="name" required autoComplete="name" placeholder="איך לפנות אליך" />
            </label>
            <label>
              אימייל
              <input type="email" name="email" required autoComplete="email" placeholder="you@example.com" />
            </label>
            <label>
              סיסמה
              <input
                type="password"
                name="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="8 תווים לפחות"
              />
            </label>
            <button className="btn lg" type="submit">
              התחלת ניסיון
            </button>
          </form>
          <p className="auth-alt">
            כבר רשום? <Link href="/login">כניסה</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
