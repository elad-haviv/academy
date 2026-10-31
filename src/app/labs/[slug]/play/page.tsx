import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/Sections';
import { loadLabs, isPublishable } from '@/lib/labs';
import { currentUser } from '@/lib/auth';
import { canAccess } from '@/lib/access';
import { db } from '@/lib/db';
import { duration } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lab = loadLabs().find((l) => l.slug === slug);
  return { title: lab ? `${lab.title} · הפעלה` : 'מעבדה' };
}

export default async function PlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lab = loadLabs().find((l) => l.slug === slug);
  if (!lab) notFound();
  if (lab.status !== 'published' || !isPublishable(lab) || !lab.embedUrl) {
    redirect(`/labs/${slug}`);
  }

  const user = await currentUser();
  const entitled = canAccess(user, lab.entitlement);

  // Gated player: 200 + a real explanation, never a bare 403/402.
  if (!entitled) {
    return (
      <>
        <SiteHeader current="labs" />
        <main className="wrap page">
          <nav className="crumbs">
            <Link href="/labs">מעבדות</Link>
            <span aria-hidden="true">›</span>
            <Link href={`/labs/${slug}`}>{lab.title}</Link>
            <span aria-hidden="true">›</span>
            <span>הפעלה</span>
          </nav>
          <div className="play-gate">
            <h1>המעבדה פתוחה בניסיון ובמנוי</h1>
            <p className="lede">
              {lab.title} — {duration(lab.minutes)} של תרחישים, מדידות והשלכות. ניסיון של 7 ימים פותח
              את המעבדה, בלי כרטיס אשראי.
            </p>
            <ul className="checklist">
              {lab.outcomes.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
            <div className="cta-row">
              <Link className="btn lg" href="/register?plan=annual">
                {user ? 'שדרוג לניסיון' : 'פתיחת ניסיון'}
              </Link>
              <Link className="ghost lg" href="/pricing">
                השוואת מסלולים ›
              </Link>
            </div>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  // Log that the learner opened the lab (one row per scenario track).
  db()
    .prepare(
      `INSERT INTO lab_progress (user_id, lab_slug, scenario, state, updated_at)
       VALUES (?, ?, 'entry', 'started', datetime('now'))
       ON CONFLICT(user_id, lab_slug, scenario) DO UPDATE SET updated_at = datetime('now')`,
    )
    .run(user!.id, slug);

  return (
    <>
      <div className="top-strip" aria-hidden="true" />
      <header className="play-bar">
        <Link href={`/labs/${slug}`} className="play-back">
          ‹ חזרה לתדריך
        </Link>
        <span className="play-title">{lab.title}</span>
        <span className="chip chip-ok">בהרצה</span>
        <Link className="play-back" href="/dashboard">
          האזור שלי
        </Link>
      </header>
      <iframe
        className="lab-frame"
        src={lab.embedUrl}
        title={lab.title}
        allow="fullscreen"
        loading="eager"
      />
    </>
  );
}
