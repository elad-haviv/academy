import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'וידאו' };

export default function VideosPage() {
  return (
    <>
      <div className="page-head">
        <div className="wrap">
          <h1>וידאו</h1>
          <p>
            כאן ייבנו מסלולי הווידאו של האקדמיה: הדגמות קצרות של תרגילים, סיורים במעבדות והרצאות מוקלטות. בינתיים כל התוכן
            מונגש בכתב ובמעבדות אינטראקטיביות.
          </p>
        </div>
      </div>

      <div className="wrap" style={{ paddingBottom: 72 }}>
        <div className="empty" style={{ marginTop: 32 }}>
          <h3>אין עדיין שיעורי וידאו</h3>
          <p style={{ maxWidth: '52ch', margin: '0 auto 18px' }}>
            לא נפרסם סרטון כדי למלא מקום. הראשון יעלה יחד עם הקורסים המעשיים, ויוצג כאן עם פרקים, תמלול וקישור לחומרי התרגול.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/courses" className="btn small">
              לקורסים בכתב
            </Link>
            <Link href="/labs" className="btn ghost small">
              למעבדות
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
