import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="wrap">
      <div className="auth-shell" style={{ maxWidth: 560 }}>
        <h1>הדף לא נמצא</h1>
        <p className="sub">הקישור הזה לא מוביל לשום מקום — אולי השיעור הועבר, או שהקורס עוד לא עלה.</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/courses" className="btn small">
            לקטלוג הקורסים
          </Link>
          <Link href="/" className="btn ghost small">
            לדף הבית
          </Link>
        </div>
      </div>
    </div>
  );
}
