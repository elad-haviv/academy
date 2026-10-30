import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { paywallEnabled, resolveViewer } from '@/lib/access';
import { getCourse } from '@/lib/queries';
import { categoryLabel, trackLabel } from '@/lib/taxonomy';

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const lab = getCourse(params.slug);
  if (!lab) return { title: 'מעבדה' };
  return {
    title: lab.title,
    description: lab.subtitle,
    alternates: { canonical: `/labs/${lab.slug}` },
  };
}

export default function LabPage({ params }: { params: { slug: string } }) {
  const lab = getCourse(params.slug);
  if (!lab || lab.kind !== 'lab') notFound();

  // Premium labs: non-members get the plan page and the iframe is never emitted.
  const viewer = resolveViewer();
  const locked = paywallEnabled() && lab.access === 'premium' && !viewer.isMember;
  const embeddable = Boolean(lab.externalUrl && lab.externalUrl.startsWith('/')) && !locked;

  if (embeddable && lab.externalUrl) {
    return <iframe className="lab-frame" src={lab.externalUrl} title={lab.title} />;
  }

  return (
    <>
      <div className="page-head">
        <div className="wrap">
          <div className="kicker mono" style={{ fontSize: '0.76rem', color: 'var(--ink-faint)' }}>
            {lab.tags.join(' · ')}
          </div>
          <h1>{lab.title}</h1>
          <p>{lab.subtitle}</p>
        </div>
      </div>
      <div className="wrap course-grid">
        <div className="course-body">
          <div className="prose">
            {lab.description.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {locked ? (
            <div className="paywall" aria-labelledby="lab-paywall-title">
              <div className="paywall-head">
                <h2 id="lab-paywall-title">המעבדה פתוחה למנויים</h2>
                <p>המעבדה הזו רצה בדפדפן ומגיבה לכל פעולה. במנוי היא נפתחת במלואה, כולל תרחישי הכשל והתרגילים.</p>
              </div>
              <dl className="paywall-facts">
                <div>
                  <dt>מנוי</dt>
                  <dd>₪349 לשנה · ₪39 לחודש</dd>
                </div>
                <div>
                  <dt>ניסיון</dt>
                  <dd>7 ימים חינם, בלי כרטיס אשראי</dd>
                </div>
                <div>
                  <dt>כולל</dt>
                  <dd>כל הקורסים והמעבדות</dd>
                </div>
              </dl>
              <div className="paywall-actions">
                <Link href="/pricing" className="btn">
                  התחלת ניסיון
                </Link>
                <Link href="/pricing#compare" className="paywall-link">
                  מה כלול במנוי
                </Link>
              </div>
            </div>
          ) : (
            <div className="notice">
              המעבדה הזו נבנית בימים אלה ותעלה לאקדמיה עם מסלול מלא: מודולים, תרגילים ומשוב. עד אז אפשר ללמוד את הקורסים
              והמדריכים שכבר פתוחים.
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 22 }}>
            <Link href="/courses" className="btn small">
              לקורסים
            </Link>
            {!locked && lab.externalUrl ? (
              <a href={lab.externalUrl} className="btn ghost small" target="_blank" rel="noreferrer">
                פתיחה בחלון חדש
              </a>
            ) : null}
          </div>
        </div>
        <aside className="side-panel">
          <h3>פרטים</h3>
          <dl>
            <dt>סטטוס</dt>
            <dd>{lab.status === 'in-development' ? 'בבנייה' : 'פתוח'}</dd>
            <dt>גישה</dt>
            <dd>{lab.access === 'premium' ? 'במנוי' : 'חופשית'}</dd>
            {lab.category ? (
              <>
                <dt>נושא</dt>
                <dd>
                  <Link href={`/categories/${lab.category}`} style={{ color: 'var(--blueprint)' }}>
                    {categoryLabel(lab.category)}
                  </Link>
                </dd>
              </>
            ) : null}
            {lab.tracks.length ? (
              <>
                <dt>מסלול</dt>
                <dd>
                  {lab.tracks.map((track, index) => (
                    <span key={track}>
                      {index ? ' · ' : ''}
                      <Link href={`/tracks/${track}`} style={{ color: 'var(--blueprint)' }}>
                        {trackLabel(track)}
                      </Link>
                    </span>
                  ))}
                </dd>
              </>
            ) : null}
            <dt>נושאים</dt>
            <dd>{lab.tags.join(', ')}</dd>
            <dt>התקנה</dt>
            <dd>לא נדרשת</dd>
          </dl>
        </aside>
      </div>
    </>
  );
}
