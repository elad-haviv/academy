import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'אודות' };

const ROADMAP = [
  { title: 'יסודות הפורטל', body: 'קטלוג קורסים, שיעורים, התקדמות, חשבונות ודירוגים. זה מה שקיים היום.' },
  { title: 'מעבדות בפנים', body: 'קורס AGL וקורס הגנרטורים עוברים מתוך האתר עצמו, עם שמירת התקדמות אחודה בין הקורסים למעבדות.' },
  { title: 'מסלולי לימוד', body: 'רצפים מוגדרים בין קורסים — קדם־דרישות, מסלול לפי תפקיד (חשמלאי, מהנדס, מפתח) ומעקב אחרי השלמת מסלול.' },
  { title: 'תרגול והערכה', body: 'תרגילים עם בדיקה אוטומטית, מבחני סיום, ומשוב שמסביר למה תשובה שגויה שגויה.' },
  { title: 'וידאו ותמלול', body: 'שיעורי וידאו עם תמלול בעברית, חיפוש בתוך הסרטון וקישור ישיר לחומרי התרגול.' },
  { title: 'קהילה', body: 'שאלות בשיעור, הערות, ותשובות שלומדים אחרים — וקודם כל של מי שכתב את הקורס.' },
];

export default function AboutPage() {
  return (
    <>
      <div className="page-head">
        <div className="wrap">
          <h1>אודות Haviv Academy</h1>
          <p>
            Haviv Academy הוא הדור הבא של TutsZone — אתר המדריכים הישן. הרעיון נשאר אותו רעיון: להסביר דברים טכניים בעברית,
            בצורה מדויקת. השיטה משתנה: פחות מאמרים מפוזרים, יותר קורסים שלמים ומעבדות שבהן מתרגלים.
          </p>
        </div>
      </div>

      <div className="wrap course-grid">
        <div className="course-body">
          <div className="prose">
            <h2>למה עוד אתר לימודים</h2>
            <p>
              רוב התוכן הטכני בעברית מגיע בשתי צורות: פוסט קצר שמטפל במקרה אחד, או סרטון ארוך שאי אפשר לחפש בו. מי
              שמנסה ללמוד באמת — חשמלאי שרוצה להבין מערכות תאורה בשדה, מהנדס שמתכנן גנרטור, מפתח שנכנס לפרויקט עם Docker —
              צריך משהו אחר: רצף, תרגול, ובדיקה שהבין.
            </p>
            <p>
              לכן האתר בנוי משלושה חלקים. <strong>קורסים</strong> שהם רצף שיעורים קצרים עם התקדמות נשמרת.{' '}
              <strong>מדריכים</strong> שהם תשובה מהירה לשאלה אחת. ו<strong>מעבדות</strong> — סימולציות ומודלים
              אינטראקטיביים שבהם טועים בבטחה, ומגלים את התקלה בעצמכם.
            </p>

            <h2>הקו של האתר</h2>
            <ul>
              <li>עברית קודם. מונחים באנגלית נשארים באנגלית, עם הסבר.</li>
              <li>בלי הבטחות שווא: אם משהו הוא הדגמה חינוכית ולא הסמכה מקצועית, כתוב את זה.</li>
              <li>תוכן בגישה חופשית. חשבון נועד לשמור התקדמות, לא לחסום קריאה.</li>
              <li>כל שיעור צריך לעמוד בפני עצמו — מי שנכנס באמצע מבין על מה מדובר.</li>
            </ul>

            <h2>מפת דרכים</h2>
            <table>
              <thead>
                <tr>
                  <th>שלב</th>
                  <th>מה נכנס</th>
                </tr>
              </thead>
              <tbody>
                {ROADMAP.map((item) => (
                  <tr key={item.title}>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{item.title}</td>
                    <td>{item.body}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2>מי בונה את זה</h2>
            <p>
              אלעד חביב — מהנדס חשמל ומפתח. האתר נבנה ונכתב יחד עם סוכן AI (Hermes) שעובד על הקוד, על הפריסה ועל הניסוח, אבל
              כל שיעור עובר בדיקה אנושית לפני שהוא עולה. קוד המקור פתוח ב־
              <a href="https://github.com/elad-haviv/academy" target="_blank" rel="noreferrer">
                GitHub
              </a>
              .
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 26, flexWrap: 'wrap' }}>
            <Link href="/courses" className="btn small">
              לקטלוג הקורסים
            </Link>
            <Link href="/labs" className="btn ghost small">
              למעבדות
            </Link>
          </div>
        </div>
        <aside className="side-panel">
          <h3>בקצרה</h3>
          <dl>
            <dt>הוקם</dt>
            <dd>2026</dd>
            <dt>שפה</dt>
            <dd>עברית (RTL)</dd>
            <dt>גישה</dt>
            <dd>חופשית</dd>
            <dt>מבוסס על</dt>
            <dd>TutsZone</dd>
            <dt>סטאק</dt>
            <dd style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.82rem' }}>Next.js · SQLite</dd>
          </dl>
        </aside>
      </div>
    </>
  );
}
