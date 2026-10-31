import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/Sections';
import { Steps } from '@/components/Shelf';
import { LabCard } from '@/components/LabCard';
import { loadLabs } from '@/lib/labs';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'מעבדות',
  description:
    'סימולציות אינטראקטיביות לתאורת מסלולים ולגנרטורים: מפעילים, שוברים ומאבחנים, עם מדידות והשלכות.',
};

export default function LabsPage() {
  const labs = loadLabs();

  return (
    <>
      <SiteHeader current="labs" />
      <main className="wrap page">
        <header className="page-head">
          <p className="eyebrow">
            <span className="pip" aria-hidden="true" />
            סימולציות · {labs.length} מעבדות
          </p>
          <h1>מעבדות</h1>
          <p className="lede">
            כל מעבדה היא מערכת שעובדת באמת: מפעילים, מנתקים ושוברים — ומודדים מה קרה. אין כאן סרטון
            לצפייה. יש ציוד שמגיב, גם להחלטות שגויות.
          </p>
        </header>

        <div className="lab-grid">
          {labs.map((lab) => (
            <LabCard key={lab.slug} lab={lab} />
          ))}
        </div>

        <Steps />

        <section className="employer">
          <div className="emp-in">
            <div>
              <h2>צריך את זה לכל הצוות?</h2>
              <p>
                רישיונות לפי מושב, חשבונית עם מע״מ ותוכנית הכשרה לפי תפקיד — לשדות תעופה, קבלנים
                ומחלקות תחזוקה.
              </p>
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
