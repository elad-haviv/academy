import Link from 'next/link';
import { logoutAction } from '@/app/actions';

export function SiteHeader({ user }: { user: { name: string } | null }) {
  return (
    <header className="site-header">
      <div className="wrap bar">
        <Link href="/" className="brand" aria-label="Haviv Academy — דף הבית">
          <strong>Haviv Academy</strong>
          <span>academy.haviv.pro</span>
        </Link>
        <nav className="nav" aria-label="ניווט ראשי">
          <Link href="/courses">קורסים</Link>
          <Link href="/labs">מעבדות</Link>
          <Link href="/tutorials">מדריכים</Link>
          <Link href="/videos">וידאו</Link>
          <Link href="/about">אודות</Link>
          {user ? (
            <>
              <Link href="/dashboard" className="account">
                {user.name.split(' ')[0]} — הלימודים שלי
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="tag" style={{ cursor: 'pointer', background: 'none' }}>
                  יציאה
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="account">
              התחברות
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
