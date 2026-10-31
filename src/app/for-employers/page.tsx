import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/Sections';
import { waitlistAction } from '../actions';

export const metadata = {
  title: 'למעסיקים',
  description: 'רישיונות לפי מושב, חשבונית מס עם מע״מ ותוכנית הכשרה לפי תפקיד לצוותי חשמל ותחזוקה.',
};

const ROWS = [
  ['מושבים', 'מ־5 מושבים ומעלה, ניהול מרכזי, הוספה והסרה בכל חודש'],
  ['חשבונית', 'חשבונית מס עם מע״מ, חשבונית ירוקה, שוטף+30'],
  ['תוכנית', 'מסלול לפי תפקיד: חשמלאי שדה, טכנאי תחזוקה, מנהל משמרת'],
  ['דוח', 'התקדמות לפי עובד והשלמות מעבדה — CSV או דוח חודשי במייל'],
  ['הטמעה', 'שעה עם מדריך בצוות, מרחוק, בשבוע הראשון'],
];

export default async function EmployersPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;

  return (
    <>
      <SiteHeader current="" />
      <main className="wrap page">
        <header className="page-head">
          <p className="eyebrow">
            <span className="pip" aria-hidden="true" />
            ארגונים · מוסדות · קבלנים
          </p>
          <h1>הכשרה לצוות, לא קורס בודד</h1>
          <p className="lede">
            אותו תוכן, בגישה ארגונית: מושבים, חשבונית, תוכנית לפי תפקיד ודוח התקדמות. תגובה תוך יום
            עסקים.
          </p>
        </header>

        <div className="emp-grid">
          <div className="emp-table">
            {ROWS.map(([k, v]) => (
              <div className="emp-row" key={k}>
                <b>{k}</b>
                <span>{v}</span>
              </div>
            ))}
          </div>

          <div className="emp-form">
            {sent ? (
              <div className="form-ok">
                <b>קיבלנו.</b>
                <p>נחזור במייל תוך יום עסקים עם הצעה ומספר מושבים מתאים.</p>
                <Link className="ghost" href="/labs">
                  בינתיים — לראות את המעבדות ›
                </Link>
              </div>
            ) : (
              <form action={waitlistAction} className="form">
                <input type="hidden" name="source" value="employers" />
                <h2>בקשת הצעה</h2>
                {error === 'email' && <p className="form-error">כתובת אימייל לא תקינה.</p>}
                <label>
                  שם
                  <input type="text" name="name" required autoComplete="name" placeholder="שם מלא" />
                </label>
                <label>
                  אימייל בעבודה
                  <input type="email" name="email" required autoComplete="email" placeholder="name@company.co.il" />
                </label>
                <label>
                  מה צריך
                  <textarea
                    name="note"
                    rows={4}
                    placeholder="כמה עובדים, אילו תפקידים, מתי מתחילים"
                  />
                </label>
                <button className="btn lg" type="submit">
                  שליחה
                </button>
                <p className="form-note">בלי ספאם. פרטים נשמרים לצורך הצעה בלבד.</p>
              </form>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
