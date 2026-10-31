import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/Sections';
import { currentUser } from '@/lib/auth';
import { activeEntitlements } from '@/lib/access';
import { allCourses, completedLessons } from '@/lib/content';
import { loadLabs } from '@/lib/labs';
import { duration, lessons as lessonLabel } from '@/lib/format';
import { logoutAction } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'האזור שלי' };

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/dashboard');

  const entitlements = activeEntitlements(user!.id);
  const full = entitlements.includes('all');
  const courses = allCourses();
  const labs = loadLabs();

  return (
    <>
      <SiteHeader current="" />
      <main className="wrap dash">
        <div className="dash-head">
          <div>
            <p className="eyebrow">
              <span className="pip" aria-hidden="true" />
              {full ? 'גישה מלאה · ניסיון או מנוי' : 'חשבון חינמי'}
            </p>
            <h1>שלום, {user!.name}</h1>
            <p className="lede">
              {full
                ? 'כל המעבדות והשיעורים פתוחים בפניך.'
                : 'המדריכים והשיעור הראשון בכל קורס פתוחים. מעבדות דורשות מנוי.'}
            </p>
          </div>
          <form action={logoutAction}>
            <button className="btn ghosted" type="submit">
              יציאה
            </button>
          </form>
        </div>

        <section className="dash-block">
          <div className="sec-head">
            <h2>המעבדות שלך</h2>
            <Link className="sec-link" href="/labs">
              כל המעבדות ›
            </Link>
          </div>
          <div className="lab-grid">
            {labs.map((lab) => (
              <article className="lab-card lab-card-flat" key={lab.slug}>
                <div className="lab-body">
                  <div className="lab-top">
                    <span className="tag">{lab.vertical === 'gensets' ? 'גנרטורים' : 'תאורת מסלולים'}</span>
                    <span className={full ? 'chip chip-ok' : 'chip chip-soon'}>
                      {full ? 'פתוח' : 'דורש מנוי'}
                    </span>
                  </div>
                  <h3>{lab.title}</h3>
                  <p className="sub">{lab.subtitle}</p>
                  <div className="lab-foot">
                    <span className="owner">{duration(lab.minutes)}</span>
                    <Link className="btn sm" href={`/labs/${lab.slug}`}>
                      {full ? 'כניסה' : 'פרטים'}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="dash-block">
          <div className="sec-head">
            <h2>ההתקדמות שלך</h2>
            <Link className="sec-link" href="/courses">
              כל הקורסים ›
            </Link>
          </div>
          {courses.map((c) => {
            const done = completedLessons(user!.id, c.slug).length;
            const pct = c.lesson_count ? Math.round((done / c.lesson_count) * 100) : 0;
            return (
              <Link className="row" key={c.slug} href={`/courses/${c.slug}`}>
                <span className="n">{pct}%</span>
                <span className="r-title">{c.title}</span>
                <span className="r-desc">{c.subtitle}</span>
                <span className="r-meta">
                  {done}/{c.lesson_count}
                </span>
                <span className="r-meta">{lessonLabel(c.lesson_count)}</span>
                <span className="r-arrow" aria-hidden="true">
                  ›
                </span>
              </Link>
            );
          })}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
