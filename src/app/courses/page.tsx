import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/Sections';
import { allCourses, courseLessons } from '@/lib/content';
import { duration, lessons as lessonLabel } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'קורסים',
  description: 'המדף: קורסים קצרים ומעשיים לחשמל ולתוכנה, בעברית.',
};

export default function CoursesPage() {
  const courses = allCourses();

  return (
    <>
      <SiteHeader current="courses" />
      <main className="wrap page">
        <header className="page-head">
          <p className="eyebrow">
            <span className="pip" aria-hidden="true" />
            המדף · {lessonLabel(courses.reduce((s, c) => s + c.lesson_count, 0))}
          </p>
          <h1>קורסים</h1>
          <p className="lede">
            הקורסים הם המדף, לא המוצר. הם קיימים כדי לתת רקע לפני שמפעילים מעבדה — ולכן הם קצרים
            וממוקדים.
          </p>
        </header>

        <div className="cards">
          {courses.map((c) => {
            const first = courseLessons(c.slug)[0];
            return (
              <article className="course-card" key={c.slug}>
                <div className="course-top">
                  <span className="tag">{c.category || 'כללי'}</span>
                  <span className="chip chip-ok">ניסיון</span>
                </div>
                <h2>
                  <Link href={`/courses/${c.slug}`}>{c.title}</Link>
                </h2>
                <p>{c.subtitle || c.description}</p>
                <dl className="course-meta">
                  <div>
                    <dt>שיעורים</dt>
                    <dd>{c.lesson_count}</dd>
                  </div>
                  <div>
                    <dt>אורך</dt>
                    <dd>{duration(c.minutes)}</dd>
                  </div>
                  <div>
                    <dt>רמה</dt>
                    <dd>{c.level}</dd>
                  </div>
                </dl>
                <div className="course-foot">
                  {first && (
                    <Link className="btn sm" href={`/courses/${c.slug}/${first.slug}`}>
                      שיעור ראשון בחינם
                    </Link>
                  )}
                  <Link className="ghost" href={`/courses/${c.slug}`}>
                    כל השיעורים ›
                  </Link>
                </div>
              </article>
            );
          })}
          {courses.length % 2 === 1 && <div className="course-card filler" aria-hidden="true" />}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
