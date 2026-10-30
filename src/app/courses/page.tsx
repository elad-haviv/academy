import Link from 'next/link';
import type { Metadata } from 'next';
import { CourseFilterBar } from '@/components/CourseFilterBar';
import { LedgerRow } from '@/components/LedgerRow';
import { allTags, listCourses } from '@/lib/queries';
import { CATEGORIES, TRACKS } from '@/lib/taxonomy';

export const metadata: Metadata = {
  title: 'קורסים',
  alternates: { canonical: '/courses' },
};

export default function CoursesPage({
  searchParams,
}: {
  searchParams: { q?: string; level?: string; tag?: string; sort?: string; category?: string; track?: string; access?: string };
}) {
  const q = searchParams.q ?? '';
  const level = searchParams.level ?? '';
  const tag = searchParams.tag ?? '';
  const sort = searchParams.sort ?? '';
  const category = searchParams.category ?? '';
  const track = searchParams.track ?? '';
  const access = searchParams.access ?? '';
  const courses = listCourses({ kind: 'course', q, level, tag, sort, category, track, access });
  const tags = allTags();

  return (
    <>
      <div className="page-head">
        <div className="wrap">
          <h1>קורסים</h1>
          <p>
            קורסים מלאים, מחולקים למודולים ולשיעורים קצרים. כל קורס נפתח לקריאה בלי הרשמה — החשבון רק שומר את ההתקדמות.
          </p>
        </div>
      </div>

      <div className="wrap" style={{ paddingBottom: 72 }}>
        <div className="chips" style={{ marginTop: 22 }}>
          <Link href="/courses" data-active={category ? 'false' : 'true'}>
            כל הנושאים
          </Link>
          {CATEGORIES.map((item) => (
            <Link
              key={item.slug}
              href={`/categories/${item.slug}`}
              data-active={category === item.slug ? 'true' : 'false'}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="chips chips-tracks" style={{ marginTop: 0 }}>
          <span className="chips-label">מסלולים:</span>
          {TRACKS.map((item) => (
            <Link key={item.slug} href={`/tracks/${item.slug}`} data-active={track === item.slug ? 'true' : 'false'}>
              {item.label}
            </Link>
          ))}
        </div>

        <CourseFilterBar action="/courses" values={{ q, level, category, track, access, sort, tag }} count={courses.length} />

        <div className="chips chips-tags">
          <Link href={category ? `/courses?category=${category}` : '/courses'} data-active={tag ? 'false' : 'true'}>
            הכל
          </Link>
          {tags.map((topic) => (
            <Link
              key={topic}
              href={`/courses?tag=${encodeURIComponent(topic)}`}
              data-active={tag === topic ? 'true' : 'false'}
            >
              {topic}
            </Link>
          ))}
        </div>

        {courses.length ? (
          <div className="ledger">
            {courses.map((course, index) => (
              <LedgerRow key={course.slug} course={course} index={index} />
            ))}
          </div>
        ) : (
          <div className="empty" style={{ marginTop: 24 }}>
            <h3>אין קורסים שמתאימים לחיפוש</h3>
            <p>אפשר לנקות את הסינון או לחפש מילה רחבה יותר.</p>
            <Link href="/courses" className="btn ghost small">
              ניקוי סינון
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
