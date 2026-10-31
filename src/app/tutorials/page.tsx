import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/Sections';
import { allTutorials } from '@/lib/content';
import { duration } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'מדריכים',
  description: 'מדריכים קצרים בעברית: Docker, git, SSH, CSS ועוד — חינם, בלי הרשמה.',
};

export default function TutorialsPage() {
  const items = allTutorials();

  return (
    <>
      <SiteHeader current="tutorials" />
      <main className="wrap page">
        <header className="page-head">
          <p className="eyebrow">
            <span className="pip" aria-hidden="true" />
            חינם · {items.length} מדריכים
          </p>
          <h1>מדריכים</h1>
          <p className="lede">
            כל מדריך כאן פתוח בלי הרשמה ובלי תשלום. זה החלון הראווה: אם משהו כאן עזר לך, המעבדות
            הן ההמשך הטבעי.
          </p>
        </header>

        <div className="tut-list">
          {items.map((t, i) => (
            <Link className="row" key={t.slug} href={`/tutorials/${t.slug}`}>
              <span className="n">{String(i + 1).padStart(2, '0')}</span>
              <span className="r-title">{t.title}</span>
              <span className="r-desc">{t.excerpt}</span>
              <span className="r-meta">{t.level}</span>
              <span className="r-meta">{duration(t.minutes)}</span>
              <span className="r-arrow" aria-hidden="true">
                ›
              </span>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
