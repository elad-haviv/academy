import { countLabel } from '@/lib/format';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Progress } from '@/components/Progress';
import { requireUser } from '@/lib/auth';
import { LedgerRow } from '@/components/LedgerRow';
import { enrolledCourses, listCourses, userCompletionsCount } from '@/lib/queries';

export const metadata: Metadata = { title: 'הלימודים שלי' };

export default function DashboardPage() {
  const user = requireUser('/dashboard');
  const enrolled = enrolledCourses(user.id);
  const completed = userCompletionsCount(user.id);
  const enrolledSlugs = new Set(enrolled.map((course) => course.slug));
  const suggestions = listCourses({ kind: 'course' })
    .filter((course) => !enrolledSlugs.has(course.slug))
    .slice(0, 3);

  return (
    <>
      <div className="page-head">
        <div className="wrap">
          <h1>שלום, {user.name.split(' ')[0]}</h1>
          <p>
            {enrolled.length
              ? `${countLabel(enrolled.length, 'קורס פעיל', 'קורסים פעילים')} ו־${countLabel(completed, 'שיעור שסימנת', 'שיעורים שסימנת')}. ממשיכים מהמקום שעצרת.`
              : 'עוד לא התחלת קורס. בחרו אחד מהקטלוג — ההתקדמות תישמר כאן.'}
          </p>
        </div>
      </div>

      <div className="wrap" style={{ paddingBottom: 72 }}>
        {enrolled.length ? (
          <div className="ledger" style={{ marginTop: 12 }}>
            {enrolled.map((course) => (
              <div className="ledger-row" key={course.slug}>
                <div className="idx mono">›</div>
                <div>
                  <Link href={`/courses/${course.slug}`} className="title">
                    {course.title}
                  </Link>
                  <div className="desc">{course.subtitle}</div>
                  <div style={{ marginTop: 10, maxWidth: 320 }}>
                    <Progress percent={course.progress.percent} completed={course.progress.completed} total={course.progress.total} />
                  </div>
                </div>
                <div className="level">
                  <b>{course.progress.percent}% הושלמו</b>
                  <span>{course.level === 'Beginner' ? 'מתחילים' : course.level === 'Intermediate' ? 'בינוני' : 'מתקדם'}</span>
                </div>
                <div className="cta">
                  <Link href={`/learn/${course.slug}`} className="btn small">
                    {course.progress.completed ? 'המשך' : 'התחל'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty" style={{ marginTop: 30 }}>
            <h3>המדף עוד ריק</h3>
            <p style={{ marginBottom: 18 }}>בחרו קורס ראשון. אין צורך להחליט על מסלול שלם — השיעור הראשון מספיק כדי להתחיל.</p>
            <Link href="/courses" className="btn small">
              לקטלוג הקורסים
            </Link>
          </div>
        )}

        {suggestions.length ? (
          <section className="section" style={{ paddingBottom: 0 }}>
            <div className="section-head">
              <div>
                <h2>אולי יעניין אותך</h2>
                <p>קורסים שלא התחלת, מסודרים לפי סדר הלימוד המומלץ.</p>
              </div>
              <Link href="/courses" className="more">
                כל הקורסים
              </Link>
            </div>
            <div className="ledger">
              {suggestions.map((course, index) => (
                <LedgerRow key={course.slug} course={course} index={index} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
