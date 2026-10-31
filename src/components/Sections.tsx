import Link from 'next/link';

export function Pricing() {
  return (
    <section className="price">
      <div className="wrap">
        <div className="sec-head">
          <h2>כמה זה עולה</h2>
          <span className="note">כולל מע״מ · ביטול עד 14 יום</span>
        </div>
        <div className="plans">
          <div className="plan">
            <b className="name">חינם</b>
            <p>כל המדריכים, השיעור הראשון בכל קורס, והקטלוג המלא.</p>
            <Link className="btn ghosted" href="/register">
              פתיחת חשבון
            </Link>
          </div>
          <div className="plan plan-hi">
            <span className="plan-tag">מומלץ</span>
            <b className="name">מנוי שנתי</b>
            <b className="pnum" dir="ltr">
              ₪349
            </b>
            <span className="per">לשנה</span>
            <p>כל השיעורים, שתי המעבדות, קבצים מצורפים. ניסיון 7 ימים בלי כרטיס.</p>
            <Link className="btn" href="/register?plan=annual">
              התחלה
            </Link>
          </div>
          <div className="plan">
            <b className="name">מנוי חודשי</b>
            <b className="pnum" dir="ltr">
              ₪39
            </b>
            <span className="per">לחודש</span>
            <p>אותה גישה, בלי התחייבות שנתית.</p>
            <Link className="btn ghosted" href="/register?plan=monthly">
              חודשי
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function EmployerBand() {
  return (
    <section className="employer">
      <div className="wrap">
        <div className="emp-in">
          <div>
            <h2>מעסיקים והכשרות</h2>
            <p>
              רישיונות לפי מושב, חשבונית עם מע״מ, תוכנית הכשרה לפי תפקיד, ודוח התקדמות. מתאים
              לשדות תעופה, קבלנים ומכללות.
            </p>
          </div>
          <Link className="btn lg" href="/for-employers">
            בקשת הצעה
          </Link>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer>
      <div className="wrap foot-in">
        <div className="foot-brand">
          <b>Haviv Academy</b>
          <span>מעבדות לחשמל ולתעשייה · ישראל</span>
        </div>
        <div className="foot-cols">
          <div>
            <b>תוכן</b>
            <Link href="/labs">מעבדות</Link>
            <Link href="/courses">קורסים</Link>
            <Link href="/tutorials">מדריכים</Link>
          </div>
          <div>
            <b>ארגון</b>
            <Link href="/for-employers">למעסיקים</Link>
            <Link href="/pricing">תמחור</Link>
            <Link href="/contact">צור קשר</Link>
          </div>
          <div>
            <b>מידע</b>
            <Link href="/terms">תקנון</Link>
            <Link href="/privacy">פרטיות</Link>
            <Link href="/accessibility">נגישות</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
