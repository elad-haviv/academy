import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/Sections';
import { getTutorial, allTutorials } from '@/lib/content';
import { renderRich } from '@/lib/markdown';
import { duration, heDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = getTutorial(slug);
  return { title: t?.title ?? 'מדריך', description: t?.excerpt ?? undefined };
}

export default async function TutorialPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = getTutorial(slug);
  if (!t) notFound();

  const others = allTutorials().filter((x) => x.slug !== slug).slice(0, 3);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: t.title,
    description: t.excerpt,
    inLanguage: 'he',
    datePublished: t.published,
    author: { '@type': 'Person', name: 'Elad Haviv' },
    publisher: { '@type': 'Organization', name: 'Haviv Academy' },
  };

  return (
    <>
      <SiteHeader current="tutorials" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="wrap article">
        <nav className="crumbs">
          <Link href="/tutorials">מדריכים</Link>
          <span aria-hidden="true">›</span>
          <span>{t.title}</span>
        </nav>
        <article>
          <p className="lesson-meta">
            {duration(t.minutes)} · {heDate(t.published)} · חינם
          </p>
          <h1>{t.title}</h1>
          <p className="lede">{t.excerpt}</p>
          <div className="prose" dangerouslySetInnerHTML={{ __html: renderRich(t.body) }} />
        </article>

        <aside className="article-foot">
          <div className="emp-in">
            <div>
              <h2>רוצים להפעיל מערכת, לא רק לקרוא?</h2>
              <p>שתי מעבדות אינטראקטיביות: תאורת מסלולים וגנרטורים. ניסיון של 7 ימים, בלי כרטיס.</p>
            </div>
            <Link className="btn lg" href="/labs">
              למעבדות
            </Link>
          </div>
          <div className="sec-head">
            <h2>עוד מדריכים</h2>
          </div>
          {others.map((o) => (
            <Link className="row" key={o.slug} href={`/tutorials/${o.slug}`}>
              <span className="n">·</span>
              <span className="r-title">{o.title}</span>
              <span className="r-desc">{o.excerpt}</span>
              <span className="r-meta">{duration(o.minutes)}</span>
              <span className="r-arrow" aria-hidden="true">
                ›
              </span>
            </Link>
          ))}
        </aside>
      </main>
      <SiteFooter />
    </>
  );
}
