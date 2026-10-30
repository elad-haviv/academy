import Link from 'next/link';
import { logoutAction } from '@/app/actions';
import { Mark } from './Mark';

export function SiteHeader({ user }: { user: { name: string } | null }) {
  return (
    <header className="site-header">
      <div className="wrap bar">
        <Link href="/" className="brand" aria-label="Haviv Academy — דף הבית">
          <Mark size={30} />
          <span className="brand-word">
            <strong>Haviv Academy</strong>
            <em>אקדמיית חביב</em>
          </span>
        </Link>
        <nav className="nav" aria-label="ניווט ראשי">
          <Link href="/courses">קורסים</Link>
          <Link href="/labs">מעבדות</Link>
          <Link href="/tutorials">מדריכים</Link>
          <Link href="/videos">וידאו</Link>
          <Link href="/pricing">מנוי</Link>
          <Link href="/about">אודות</Link>
        </nav>
        <div className="bar-account">
          {user ? (
            <>
              <Link href="/dashboard" className="account">
                {user.name.split(' ')[0]}
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="nav-quiet">
                  יציאה
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="account">
              התחברות
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
