import Link from 'next/link';
import { currentUser } from '@/lib/auth';

export async function SiteHeader({ current = 'labs' }: { current?: string }) {
  const user = await currentUser();

  const items = [
    { key: 'labs', href: '/labs', label: 'מעבדות' },
    { key: 'courses', href: '/courses', label: 'קורסים' },
    { key: 'tutorials', href: '/tutorials', label: 'מדריכים' },
    { key: 'employers', href: '/for-employers', label: 'למעסיקים' },
    { key: 'pricing', href: '/pricing', label: 'תמחור' },
  ];

  return (
    <>
      <div className="top-strip" aria-hidden="true" />
      <header className="bar">
        <div className="wrap bar-in">
          <Link href="/" className="brand">
            <span className="mark" aria-hidden="true" />
            <b>Haviv Academy</b>
          </Link>
          <nav className="nav" aria-label="ניווט ראשי">
            {items.map((it) => (
              <Link key={it.key} href={it.href} aria-current={current === it.key ? 'page' : undefined}>
                {it.label}
              </Link>
            ))}
          </nav>
          <div className="bar-cta">
            <Link className="lang" href="/en" hrefLang="en" aria-label="English">
              EN
            </Link>
            {user ? (
              <Link className="btn" href="/dashboard">
                האזור שלי
              </Link>
            ) : (
              <>
                <Link className="ghost" href="/login">
                  כניסה
                </Link>
                <Link className="btn" href="/register">
                  ניסיון חינם
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
