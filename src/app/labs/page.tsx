import Link from 'next/link';
import type { Metadata } from 'next';
import { formatMinutes } from '@/lib/format';
import { listCourses } from '@/lib/queries';

export const metadata: Metadata = { title: 'מעבדות אינטראקטיביות' };

export default function LabsPage() {
  const labs = listCourses({ kind: 'lab' });
  return (
    <>
      <div className="page-head">
        <div className="wrap">
          <h1>מעבדות אינטראקטיביות</h1>
          <p>
            מעבדה היא קורס שמריצים ולא קוראים: סימולציות, מודלים תלת־ממדיים, תרשים חד־קווי שאפשר להפעיל, ותרגילי אבחון עם
            משוב מיידי. הכל בעברית, עובד בדפדפן, ולא דורש התקנה.
          </p>
        </div>
      </div>

      <div className="wrap" style={{ paddingBottom: 72 }}>
        <div className="cards" style={{ marginTop: 34 }}>
          {labs.map((lab) => (
            <article className="card" key={lab.slug}>
              <div className="kicker mono" style={{ fontSize: '0.74rem', color: 'var(--ink-faint)' }}>
                {lab.tags.join(' · ')}
              </div>
              <h3>{lab.title}</h3>
              <p>{lab.subtitle}</p>
              <p style={{ fontSize: '0.9rem' }}>{lab.description.slice(0, 180)}…</p>
              <div className="card-foot">
                <span className="stat">
                  {lab.status === 'in-development' ? 'בבנייה' : lab.minutes ? `פתוחה · ${formatMinutes(lab.minutes)}` : 'פתוחה'}
                </span>
                <Link href={`/labs/${lab.slug}`} className="btn ghost small">
                  {lab.status === 'in-development' ? 'מה בתכנון' : 'כניסה'}
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="notice" style={{ marginTop: 32 }}>
          <strong>למה מעבדה ולא סרטון?</strong> בקורס רגיל אפשר לדלג על שיעור בלי לשים לב שהחמצת משהו. במעבדה המערכת מגיבה
          למה שעשיתם: פותחים מפסק, מקבלים תקלה, ומגלים בעצמכם למה. זו הדרך היחידה שבה ידע נשאר.
        </div>
      </div>
    </>
  );
}
