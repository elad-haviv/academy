import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CourseFilterBar } from '@/components/CourseFilterBar';
import { LedgerRow } from '@/components/LedgerRow';
import { formatMinutes, pad2 } from '@/lib/format';
import { listCourses, listTutorials } from '@/lib/queries';
import { TRACKS, track as findTrack } from '@/lib/taxonomy';

type TrackParams = { params: { track: string }; searchParams: Record<string, string | undefined> };

export function generateMetadata({ params }: { params: { track: string } }): Metadata {
  const current = findTrack(params.track);
  if (!current) return { title: 'מסלול' };
  return {
    title: `מסלול ${current.label}`,
    description: `${current.blurb} קורסים, מדריכים ומעבדות בעברית לאנשים בתפקיד ${current.label}.`,
    alternates: { canonical: `/tracks/${current.slug}` },
  };
}

export default function TrackPage({ params, searchParams }: TrackParams) {
  const current = findTrack(params.track);
  if (!current) notFound();

  const q = searchParams.q ?? '';
  const level = searchParams.level ?? '';
  const tag = searchParams.tag ?? '';
  const access = searchParams.access ?? '';
  const sort = searchParams.sort ?? '';

  const courses = listCourses({ kind: 'course', track: current.slug, q, level, tag, access, sort });
  const labs = listCourses({ kind: 'lab', track: current.slug });
  const tutorials = listTutorials({ track: current.slug, q, level, tag, access });
  const lessonTotal = courses.reduce((sum, course) => sum + course.lessonCount, 0);

  return (
    <>
      <div className="page-head">
        <div className="wrap">
          <div className="kicker mono" style={{ fontSize: '0.76rem', color: 'var(--ink-faint)' }}>
            מסלול
          </div>
          <h1>{current.label}</h1>
          <p>{current.blurb}</p>
          <p className="mono" style={{ fontSize: '0.8rem', color: 'var(--ink-faint)', marginTop: 10 }}>
            {courses.length} קורסים · {lessonTotal} שיעורים · {formatMinutes(courses.reduce((sum, c) => sum + c.minutes, 0))}
          </p>
        </div>
      </div>

      <div className="wrap" style={{ paddingBottom: 72 }}>
        <CourseFilterBar
          action={`/tracks/${current.slug}`}
          values={{ q, level, access, sort, tag }}
          count={courses.length}
          fixed={['track']}
        />

        {courses.length ? (
          <div className="ledger">
            {courses.map((course, index) => (
              <LedgerRow key={course.slug} course={course} index={index} />
            ))}
          </div>
        ) : labs.length || tutorials.length ? (
          <p className="track-note">
            אין עדיין קורסים שלמים במסלול הזה — המעבדות והמדריכים שכן קיימים נמצאים למטה.
          </p>
        ) : (
          <div className="empty" style={{ marginTop: 24 }}>
            <h3>אין עדיין תוכן במסלול הזה</h3>
            <p>התוכן הבא שנבנה מיועד בדיוק לכאן. בינתיים אפשר לעבור על כל הקטלוג.</p>
            <Link href="/courses" className="btn ghost small">
              לכל הקורסים
            </Link>
          </div>
        )}

        {labs.length ? (
          <section className="section" style={{ paddingInline: 0 }}>
            <h2>מעבדות למסלול {current.label}</h2>
            <div className="cards" style={{ marginTop: 18 }}>
              {labs.map((lab) => (
                <article className="card" key={lab.slug}>
                  <h3>{lab.title}</h3>
                  <p>{lab.subtitle}</p>
                  <div className="card-foot">
                    <span className="stat">{lab.status === 'in-development' ? 'בבנייה' : 'פתוח'}</span>
                    <Link href={`/labs/${lab.slug}`} className="btn ghost small">
                      לפרטים
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {tutorials.length ? (
          <section className="section" style={{ paddingInline: 0 }}>
            <h2>מדריכים למסלול {current.label}</h2>
            <div className="ledger" style={{ marginTop: 18 }}>
              {tutorials.map((tutorial, index) => (
                <div className="ledger-row" key={tutorial.slug}>
                  <div className="idx">{pad2(index + 1)}</div>
                  <div>
                    <Link href={`/tutorials/${tutorial.slug}`} className="title">
                      {tutorial.title}
                    </Link>
                    <div className="desc">{tutorial.excerpt}</div>
                  </div>
                  <div className="level">
                    <b>{tutorial.minutes} דק׳ קריאה</b>
                  </div>
                  <div className="cta">
                    <Link href={`/tutorials/${tutorial.slug}`} className="btn ghost small">
                      לקריאה
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="section" style={{ paddingInline: 0 }}>
          <h2>מסלולים אחרים</h2>
          <div className="track-links">
            {TRACKS.filter((item) => item.slug !== current.slug).map((other) => (
              <Link key={other.slug} href={`/tracks/${other.slug}`}>
                {other.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
