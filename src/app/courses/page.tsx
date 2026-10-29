import Link from 'next/link';
import type { Metadata } from 'next';
import { LedgerRow } from '@/components/LedgerRow';
import { allTags, listCourses } from '@/lib/queries';

export const metadata: Metadata = { title: 'קורסים' };

const LEVELS = [
  { value: '', label: 'כל הרמות' },
  { value: 'Beginner', label: 'מתחילים' },
  { value: 'Intermediate', label: 'בינוני' },
  { value: 'Advanced', label: 'מתקדם' },
];

const SORTS = [
  { value: '', label: 'סדר לימוד' },
  { value: 'short', label: 'הקצרים קודם' },
  { value: 'long', label: 'הארוכים קודם' },
  { value: 'title', label: 'לפי שם' },
];

export default function CoursesPage({
  searchParams,
}: {
  searchParams: { q?: string; level?: string; tag?: string; sort?: string };
}) {
  const q = searchParams.q ?? '';
  const level = searchParams.level ?? '';
  const tag = searchParams.tag ?? '';
  const sort = searchParams.sort ?? '';
  const courses = listCourses({ kind: 'course', q, level, tag, sort });
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
        <form className="filters" method="get" role="search">
          <label className="sr-only" htmlFor="q">
            חיפוש קורס
          </label>
          <input id="q" type="search" name="q" defaultValue={q} placeholder="חיפוש: docker, typescript, חשמל…" />
          <label className="sr-only" htmlFor="level">
            רמה
          </label>
          <select id="level" name="level" defaultValue={level}>
            {LEVELS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="sort">
            מיון
          </label>
          <select id="sort" name="sort" defaultValue={sort}>
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {tag ? <input type="hidden" name="tag" value={tag} /> : null}
          <button type="submit" className="btn small">
            סינון
          </button>
          <span className="count">{courses.length} קורסים</span>
        </form>

        <div className="chips">
          <Link href="/courses" data-active={tag ? 'false' : 'true'}>
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
