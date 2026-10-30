import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CourseFilterBar } from '@/components/CourseFilterBar';
import { LedgerRow } from '@/components/LedgerRow';
import { formatMinutes, pad2 } from '@/lib/format';
import { listCourses, listTutorials } from '@/lib/queries';
import { CATEGORIES, category as findCategory } from '@/lib/taxonomy';

export function generateMetadata({ params }: { params: { category: string } }): Metadata {
  const current = findCategory(params.category);
  if (!current) return { title: 'נושא' };
  return {
    title: current.label,
    description: `${current.blurb} קורסים, מדריכים ומעבדות בעברית בנושא ${current.label}.`,
    alternates: { canonical: `/categories/${current.slug}` },
  };
}

export default function CategoryPage({
  params,
  searchParams,
}: {
  params: { category: string };
  searchParams: { q?: string; level?: string; tag?: string; sort?: string; track?: string; access?: string };
}) {
  const current = findCategory(params.category);
  if (!current) notFound();

  const q = searchParams.q ?? '';
  const level = searchParams.level ?? '';
  const tag = searchParams.tag ?? '';
  const sort = searchParams.sort ?? '';
  const track = searchParams.track ?? '';
  const access = searchParams.access ?? '';

  const courses = listCourses({ kind: 'course', category: current.slug, q, level, tag, sort, track, access });
  const labs = listCourses({ kind: 'lab', category: current.slug, track });
  const tutorials = listTutorials({ category: current.slug, q, level, tag, access, track });

  return (
    <>
      <div className="page-head">
        <div className="wrap">
          <div className="kicker mono" style={{ fontSize: '0.76rem', color: 'var(--ink-faint)' }}>
            נושא
          </div>
          <h1>{current.label}</h1>
          <p>{current.blurb}</p>
          <p className="mono" style={{ fontSize: '0.8rem', color: 'var(--ink-faint)', marginTop: 10 }}>
            {courses.length} קורסים · {tutorials.length} מדריכים ·{' '}
            {formatMinutes(courses.reduce((sum, course) => sum + course.minutes, 0))}
          </p>
        </div>
      </div>

      <div className="wrap" style={{ paddingBottom: 72 }}>
        <CourseFilterBar
          action={`/categories/${current.slug}`}
          values={{ q, level, track, access, sort, tag }}
          count={courses.length}
          fixed={['category']}
        />

        {courses.length ? (
          <div className="ledger">
            {courses.map((course, index) => (
              <LedgerRow key={course.slug} course={course} index={index} />
            ))}
          </div>
        ) : (
          <div className="empty" style={{ marginTop: 24 }}>
            <h3>אין עדיין קורסים בנושא הזה</h3>
            <p>הנושא פתוח, אבל הקורסים בו עוד בבנייה. אפשר לחפש בקטלוג המלא.</p>
            <Link href="/courses" className="btn ghost small">
              לכל הקורסים
            </Link>
          </div>
        )}

        {labs.length ? (
          <section className="section" style={{ paddingInline: 0 }}>
            <h2>מעבדות בנושא</h2>
            <div className="cards" style={{ marginTop: 18 }}>
              {labs.map((lab) => (
                <article className="card" key={lab.slug}>
                  <h3>{lab.title}</h3>
                  <p>{lab.subtitle}</p>
                  <div className="card-foot">
                    <span className="stat">{lab.status === 'in-development' ? 'בבנייה' : 'פתוחה'}</span>
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
            <h2>מדריכים בנושא</h2>
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
          <h2>נושאים אחרים</h2>
          <div className="track-links">
            {CATEGORIES.filter((item) => item.slug !== current.slug).map((other) => (
              <Link key={other.slug} href={`/categories/${other.slug}`}>
                {other.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
