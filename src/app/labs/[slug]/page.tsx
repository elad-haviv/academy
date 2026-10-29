import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCourse } from '@/lib/queries';

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const lab = getCourse(params.slug);
  return { title: lab ? lab.title : 'מעבדה' };
}

export default function LabPage({ params }: { params: { slug: string } }) {
  const lab = getCourse(params.slug);
  if (!lab || lab.kind !== 'lab') notFound();

  if (lab.externalUrl && lab.externalUrl.startsWith('/')) {
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
          <div className="notice">
            המעבדה הזו נבנית בימים אלה ותעלה לאקדמיה עם מסלול מלא: מודולים, תרגילים ומשוב. עד אז אפשר ללמוד את הקורסים
            והמדריכים שכבר פתוחים.
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 22 }}>
            <Link href="/courses" className="btn small">
              לקורסים
            </Link>
            {lab.externalUrl ? (
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
            <dt>נושאים</dt>
            <dd>{lab.tags.join(', ')}</dd>
            <dt>שפה</dt>
            <dd>עברית / אנגלית</dd>
            <dt>התקנה</dt>
            <dd>לא נדרשת</dd>
          </dl>
        </aside>
      </div>
    </>
  );
}
