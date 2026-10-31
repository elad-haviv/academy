import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/Sections';
import { loadLabs, isPublishable } from '@/lib/labs';
import { currentUser } from '@/lib/auth';
import { canAccess } from '@/lib/access';
import { duration } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lab = loadLabs().find((l) => l.slug === slug);
  return { title: lab?.title ?? 'מעבדה', description: lab?.subtitle };
}

export default async function LabPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lab = loadLabs().find((l) => l.slug === slug);
  if (!lab) notFound();

  const user = await currentUser();
  const entitled = canAccess(user, lab.entitlement);
  const live = lab.status === 'published' && isPublishable(lab);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: lab.title,
    description: lab.subtitle,
    inLanguage: 'he',
    learningResourceType: 'Simulation',
    timeRequired: `PT${lab.minutes}M`,
    provider: { '@type': 'Organization', name: 'Haviv Academy' },
    offers: { '@type': 'Offer', price: '349', priceCurrency: 'ILS', category: 'subscription' },
  };

  return (
    <>
      <SiteHeader current="labs" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="wrap page">
        <nav className="crumbs">
          <Link href="/labs">מעבדות</Link>
          <span aria-hidden="true">›</span>
          <span>{lab.title}</span>
        </nav>

        <header className="lab-hero">
          <div className="lab-hero-copy">
            <p className="eyebrow">
              <span className="pip" aria-hidden="true" />
              {lab.vertical === 'gensets' ? 'גנרטורים' : 'תאורת מסלולים'} · {duration(lab.minutes)}
            </p>
            <h1>{lab.title}</h1>
            <p className="lede">{lab.subtitle}</p>
            <div className="cta-row">
              {live ? (
                <Link className="btn lg" href={entitled ? `/labs/${lab.slug}/play` : '/register?plan=annual'}>
                  {entitled ? 'כניסה למעבדה' : 'ניסיון 7 ימים — התחילו'}
                </Link>
              ) : (
                <Link className="btn lg" href="/for-employers">
                  רשימת המתנה
                </Link>
              )}
              <Link className="ghost lg" href="/pricing">
                מה כלול ›
              </Link>
            </div>
            <dl className="facts">
              <div>
                <dt>מאמת תוכן</dt>
                <dd>{lab.correctnessOwner ?? 'טרם נקבע'}</dd>
              </div>
              <div>
                <dt>אומת</dt>
                <dd>{lab.validatedOn ?? '—'}</dd>
              </div>
              <div>
                <dt>סטטוס</dt>
                <dd>{live ? 'פעילה' : 'בפיתוח'}</dd>
              </div>
            </dl>
          </div>
          <div className="lab-hero-art">
            <Image src={lab.cover} alt={lab.title} width={760} height={506} />
          </div>
        </header>

        <div className="lab-detail">
          <section>
            <h2>מה לומדים</h2>
            <ul className="checklist">
              {lab.outcomes.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2>מה נשבר, ומה לומדים מזה</h2>
            <ul className="checklist fault">
              {lab.failureModes.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2>למי זה</h2>
            <p className="mini-label">לומדים</p>
            <ul className="tags">
              {lab.learnerRoles.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p className="mini-label">משלמים</p>
            <ul className="tags">
              {lab.buyerRoles.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p className="mini-label">דרישות קדם</p>
            <ul className="tags">
              {lab.prerequisites.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="employer">
          <div className="emp-in">
            <div>
              <h2>לצוות שלם</h2>
              <p>רישיונות לפי מושב, חשבונית עם מע״מ ותוכנית הכשרה לפי תפקיד.</p>
            </div>
            <Link className="btn lg" href="/for-employers">
              בקשת הצעה
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
