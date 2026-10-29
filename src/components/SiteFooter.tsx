import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="cols">
          <div style={{ maxWidth: '34ch' }}>
            <strong style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: '1.1rem' }}>Haviv Academy</strong>
            <p style={{ marginTop: 8 }}>
              לימוד הנדסה, חשמל ותוכנה בעברית — קורסים בקצב שלך, מדריכים קצרים ומעבדות שבהן מתרגלים על מערכת אמיתית ולא על שקופית.
            </p>
          </div>
          <div>
            <h4>ללמוד</h4>
            <Link href="/courses">כל הקורסים</Link>
            <Link href="/labs">מעבדות אינטראקטיביות</Link>
            <Link href="/tutorials">מדריכים</Link>
            <Link href="/videos">וידאו</Link>
          </div>
          <div>
            <h4>החשבון שלי</h4>
            <Link href="/dashboard">הלימודים שלי</Link>
            <Link href="/login">התחברות</Link>
            <Link href="/register">הרשמה</Link>
          </div>
          <div>
            <h4>על האתר</h4>
            <Link href="/about">אודות ומפת דרכים</Link>
            <a href="https://github.com/elad-haviv/academy" target="_blank" rel="noreferrer">
              קוד המקור
            </a>
          </div>
        </div>
        <div className="footer-note">
          <span>Haviv Academy — הדור הבא של TutsZone. נבנה ומתוחזק בידי אלעד חביב.</span>
          <span className="mono">academy.haviv.pro</span>
        </div>
      </div>
    </footer>
  );
}
