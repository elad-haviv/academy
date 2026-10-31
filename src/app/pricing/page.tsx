import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/Sections';
import { PricingRailFocus } from '@/components/PricingRailFocus';

export const metadata = {
  title: 'תמחור',
  description: '₪349 לשנה או ₪39 לחודש, כולל מע״מ. ניסיון של 7 ימים בלי כרטיס אשראי, ביטול עד 14 יום.',
};

const FAQ = [
  {
    q: 'מה כלול בניסיון?',
    a: 'הכל. שתי המעבדות, כל השיעורים וכל המדריכים, ל־7 ימים. בלי כרטיס אשראי ובלי חיוב אוטומטי בסוף.',
  },
  {
    q: 'מה קורה אחרי הניסיון?',
    a: 'הגישה למעבדות ולשיעורים נסגרת, והמדריכים נשארים פתוחים. אפשר להמשיך במנוי שנתי או חודשי בכל שלב.',
  },
  {
    q: 'אפשר לבטל?',
    a: 'כן. ביטול עד 14 יום מזכה בהחזר מלא לפי חוק הגנת הצרכן. אחרי 14 יום המנוי נגמר בסוף התקופה ולא מתחדש בלי אישור.',
  },
  {
    q: 'יש חשבונית מס?',
    a: 'כן, עם מע״מ ובשם המוסד או החברה. לחשבוניות ארגוניות ולרישיונות לפי מושב — בעמוד המעסיקים.',
  },
];

export default function PricingPage() {
  return (
    <>
      <SiteHeader current="pricing" />
      <main className="wrap page">
        <header className="page-head">
          <p className="eyebrow">
            <span className="pip" aria-hidden="true" />
            כולל מע״מ · ביטול עד 14 יום
          </p>
          <h1>תמחור</h1>
          <p className="lede">
            מסלול אחד, שני מחזורי חיוב. כל התוכן פתוח בניסיון של 7 ימים — שתי המעבדות, כל השיעורים
            והמדריכים, בלי כרטיס אשראי.
          </p>
        </header>

        <p className="plans-hint">החליקו בין המסלולים</p>
        <PricingRailFocus />
        <div className="plans">
          <div className="plan">
            <b className="name">חינם</b>
            <span className="pnum" dir="ltr">
              ₪0
            </span>
            <p>כל המדריכים, השיעור הראשון בכל קורס והקטלוג המלא. בלי הרשמה.</p>
            <Link className="btn ghosted" href="/tutorials">
              למדריכים
            </Link>
          </div>
          <div className="plan plan-hi">
            <span className="plan-tag">מומלץ</span>
            <b className="name">שנתי</b>
            <b className="pnum" dir="ltr">
              ₪349
            </b>
            <span className="per">לשנה · 29 ₪ לחודש בפועל</span>
            <p>כל השיעורים, שתי המעבדות וכל הקבצים. ניסיון 7 ימים, בלי כרטיס.</p>
            <Link className="btn" href="/register?plan=annual">
              התחילו ניסיון
            </Link>
          </div>
          <div className="plan">
            <b className="name">חודשי</b>
            <b className="pnum" dir="ltr">
              ₪39
            </b>
            <span className="per">לחודש</span>
            <p>אותה גישה מלאה, בלי התחייבות שנתית.</p>
            <Link className="btn ghosted" href="/register?plan=monthly">
              מנוי חודשי
            </Link>
          </div>
        </div>

        <section className="faq">
          <div className="sec-head">
            <h2>שאלות נפוצות</h2>
          </div>
          {FAQ.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>

        <section className="employer">
          <div className="emp-in">
            <div>
              <h2>צוות שלם?</h2>
              <p>רישיונות לפי מושב, חשבונית מס ותוכנית הכשרה לפי תפקיד. תגובה תוך יום עסקים.</p>
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
