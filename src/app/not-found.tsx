import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/Sections';

export default function NotFound() {
  return (
    <>
      <SiteHeader current="" />
      <main className="wrap page nf">
        <p className="eyebrow">
          <span className="pip" aria-hidden="true" />
          404
        </p>
        <h1>הדף הזה לא כאן</h1>
        <p className="lede">
          או שהקישור השתנה, או שהתוכן עוד לא עלה. שתי המעבדות וכל השיעורים נמצאים בעמודים הראשיים.
        </p>
        <div className="cta-row">
          <Link className="btn lg" href="/labs">
            למעבדות
          </Link>
          <Link className="ghost lg" href="/courses">
            לקורסים ›
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
