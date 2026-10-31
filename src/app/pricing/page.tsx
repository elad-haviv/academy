import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/Sections';

export const metadata = {
  title: 'תמחור',
  description: '₪349 לשנה או ₪39 לחודש, כולל מע״מ. ניסיון 7 ימים בלי כרטיס, ביטול עד 14 יום.',
};

const FAQ = [
  {
    q: 'מה כלול בניסיון?',
    a: 'הכל. שתי המעבדות, כל 17 השיעורים וכל המדריכים, ל־7 ימים. אין צורך בכרטיס אשראי והחיוב לא מתחיל מעצמו.',
  },
  {
    q: 'מה קורה אחרי הניסיון?',
    a: 'הגישה למעבדות ולשיעורים המלאים נסגרת, והמדריכים נשארים פתוחים. אפשר להמשיך במנוי שנתי או חודשי בכל שלב.',
  },
  {
    q: 'אפשר לבטל?',
    a: 'כן. ביטול עד 14 יום מקבל החזר מלא לפי חוק הגנת הצרכן. אחרי 14 יום המנוי נגמר בסוף התקופה ולא מתחדש אוטומטית בלי אישור.',
  },
  {
    q: 'יש חשבונית מס?',
    a: 'כן, עם מע״מ ובשם המוסד או החברה. לחשבוניות ארגוניות ורישיונות לפי מושב — דרך עמוד המעסיקים.',
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
            מסלול אחד, שני מחזורי חיוב. המעבדות זה המוצר — ולכן הן במסלול בתשלום, לא בטעימה.
          </p>
        </header>

        <p className="plans-hint">החליקו בין המסלולים</p>
        <div className="plans">
          <div className="plan">
            <b className="name">חינם</b>
            <span className="pnum" dir="ltr">
              ₪0
            </span>
            <p>כל המדריכים, השיעור הראשון בכל קורס, והקטלוג המלא. בלי הרשמה למדריכים.</p>
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
            <p>כל השיעורים, שתי המעבדות, קבצים מצורפים. ניסיון 7 ימים בלי כרטיס.</p>
            <Link className="btn" href="/register?plan=annual">
              התחלת ניסיון
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
              התחלה חודשית
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
