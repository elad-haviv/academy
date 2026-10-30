import type { Metadata } from 'next';
import Link from 'next/link';
import { waitlistAction } from '@/app/actions';
import { resolveViewer } from '@/lib/access';
import { PLANS, REFUND_DAYS, TRIAL_DAYS } from '@/lib/pricing';

export const metadata: Metadata = {
  title: 'מנוי',
  description: 'מנוי אחד לכל האקדמיה: כל הקורסים, המעבדות וחומרי העבודה. ₪349 לשנה או ₪39 לחודש, 7 ימים ניסיון בלי כרטיס אשראי.',
  alternates: { canonical: '/pricing' },
};

const FREE = [
  'כל המדריכים, במלואם',
  'עמוד הקורס: מערך השיעורים, המשך ומה כל מודול מכסה',
  'השיעור הראשון בכל קורס, במלואו',
  'מעקב התקדמות בשיעורים הפתוחים',
  'חיפוש, סינון וכל עמודי המסלולים',
];

const PREMIUM = [
  'הגוף המלא של כל שיעור בכל קורס',
  'כל המעבדות האינטראקטיביות (AGL, גנרטורים)',
  'חומרי עבודה להורדה: צ׳ק־ליסטים, טבלאות כיול, תבניות',
  'שיעורים חדשים שנכנסים לקטלוג, בלי תוספת תשלום',
  'תעודת סיום קורס (בקרוב)',
];

export default function PricingPage({ searchParams }: { searchParams: { waitlist?: string } }) {
  const viewer = resolveViewer();
  const status = searchParams.waitlist ?? '';

  return (
    <>
      <div className="page-head">
        <div className="wrap">
          <h1>מנוי אחד לכל האקדמיה</h1>
          <p>
            הקריאה בקטלוג ובשיעור הראשון חופשית. מנוי פותח את הגוף המלא של כל שיעור, את המעבדות ואת חומרי העבודה —
            בקורסים הקיימים ובדברים שנבנים עכשיו.
          </p>
        </div>
      </div>

      <div className="wrap" style={{ paddingBottom: 72 }}>
        <div className="plans">
          {PLANS.map((plan) => (
            <article className="plan" data-featured={plan.featured ? 'true' : 'false'} key={plan.sku}>
              {plan.featured ? <div className="plan-flag">מומלץ</div> : null}
              <h3>{plan.name}</h3>
              <div className="plan-price">
                <b dir="ltr">{plan.price}</b>
                <span>{plan.period}</span>
              </div>
              <p>{plan.pitch}</p>
              <Link href="#waitlist" className={plan.featured ? 'btn' : 'btn ghost'}>
                הצטרפות לרשימה
              </Link>
            </article>
          ))}
        </div>

        <div className="notice" style={{ marginTop: 26 }}>
          <strong>{TRIAL_DAYS} ימים ניסיון, בלי כרטיס אשראי.</strong> מתחילים לימוד, ובתום השבוע מחליטים. ביטול בכל עת,
          והגישה נשארת עד סוף התקופה ששולמה. אם המנוי לא מתאים — החזר כספי מלא בתוך {REFUND_DAYS} יום, בלי שאלות.
        </div>

        <section className="section" id="compare" style={{ paddingInline: 0 }}>
          <h2>מה חינם ומה במנוי</h2>
          <table className="compare">
            <thead>
              <tr>
                <th scope="col">חינם, לתמיד</th>
                <th scope="col">במנוי</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <ul>
                    {FREE.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </td>
                <td>
                  <ul>
                    {PREMIUM.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="section" id="waitlist" style={{ paddingInline: 0 }}>
          <div className="waitlist">
            <h2>המנוי נפתח בהדרגה</h2>
            <p>
              אנחנו מחברים את הסליקה בימים אלה ופותחים מנויים בקבוצות קטנות, כדי שכל שיעור יקבל מענה. השאירו כתובת ונעדכן
              אתכם לפני שזה נפתח לכולם — בלי דיוור מיותר.
            </p>

            {status === 'ok' ? (
              <div className="waitlist-done" role="status">
                <strong>רשום. תודה.</strong>
                <span>נעדכן אתכם בכתובת שהשארתם ברגע שהמנוי נפתח.</span>
              </div>
            ) : (
              <>
                {status === 'exists' ? (
                  <p className="form-error" role="alert">
                    הכתובת הזו כבר ברשימה — נעדכן אתכם כשיהיה מה לעדכן.
                  </p>
                ) : null}
                {status === 'invalid' ? (
                  <p className="form-error" role="alert">
                    כתובת המייל לא נראית תקינה. אפשר לנסות שוב.
                  </p>
                ) : null}

                <form action={waitlistAction} className="auth-form waitlist-form">
                  <label>
                    כתובת מייל
                    <input type="email" name="email" required defaultValue={viewer.user?.email ?? ''} autoComplete="email" />
                  </label>
                  <label>
                    שם (לא חובה)
                    <input type="text" name="name" defaultValue={viewer.user?.name ?? ''} autoComplete="name" />
                  </label>
                  <label>
                    מה הייתם רוצים ללמוד קודם? (לא חובה)
                    <input type="text" name="note" maxLength={500} placeholder="AGL, גנרטורים, Docker…" />
                  </label>
                  <button type="submit" className="btn">
                    שמירת מקום
                  </button>
                </form>
              </>
            )}
          </div>
        </section>

        <p style={{ marginTop: 28, fontSize: '0.9rem', color: 'var(--ink-soft)' }}>
          כבר יש חשבון?{' '}
          <Link href="/dashboard" style={{ color: 'var(--blueprint)' }}>
            הלימודים שלי
          </Link>
          . המחירים בשקלים, כולל מע״מ.
        </p>
      </div>
    </>
  );
}
