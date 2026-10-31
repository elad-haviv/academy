import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/Sections';
import { currentUser } from '@/lib/auth';
import { rolesFor } from '@/lib/rbac';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'אין הרשאה' };

export default async function Forbidden() {
  const user = await currentUser();
  return (
    <>
      <SiteHeader current="" />
      <main className="wrap page nf">
        <p className="eyebrow"><span className="pip" aria-hidden="true" />403</p>
        <h1>אין הרשאה לעמוד הזה</h1>
        <p className="lede">
          {user
            ? `אתם מחוברים${rolesFor(user.id).length ? ' בתור ' + rolesFor(user.id).map((r) => r.name).join(' / ') : ''}, אבל אין לכם את ההרשאה שנדרשת כאן.`
            : 'צריך להתחבר כדי לראות את העמוד הזה.'}
        </p>
        <div className="cta-row">
          {user ? (
            <Link className="btn lg" href="/dashboard">לאזור שלי</Link>
          ) : (
            <Link className="btn lg" href="/login?next=/studio">כניסה</Link>
          )}
          <Link className="ghost lg" href="/">לדף הבית ›</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
