import Link from 'next/link';
import { formatMinutes, pad2 } from '@/lib/format';
import type { CourseSummary } from '@/lib/queries';

export function LedgerRow({ course, index }: { course: CourseSummary; index: number }) {
  return (
    <div className="ledger-row">
      <div className="idx">{pad2(index + 1)}</div>
      <div>
        <Link href={`/courses/${course.slug}`} className="title">
          {course.title}
        </Link>
        <div className="desc">{course.subtitle}</div>
        <div className="tags">
          {course.tags.slice(0, 3).map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
          {course.status === 'in-development' ? <span className="tag hot">בבנייה</span> : null}
        </div>
      </div>
      <div className="level">
        <b>{course.level === 'Beginner' ? 'מתחילים' : course.level === 'Intermediate' ? 'בינוני' : 'מתקדם'}</b>
        <span>
          {course.lessonCount} שיעורים · {formatMinutes(course.minutes)}
        </span>
      </div>
      <div className="cta">
        <Link href={`/courses/${course.slug}`} className="btn ghost small">
          לפרטים
        </Link>
      </div>
    </div>
  );
}
