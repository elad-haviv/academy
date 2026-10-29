import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { enrollAction, reviewAction } from '@/app/actions';
import { Progress } from '@/components/Progress';
import { currentUser } from '@/lib/auth';
import { formatMinutes } from '@/lib/format';
import { courseProgress, getCourse, isEnrolled, reviewsFor } from '@/lib/queries';
import { renderMarkdown } from '@/lib/markdown';

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const course = getCourse(params.slug);
  return { title: course ? course.title : 'קורס' };
}

const LEVEL_HE: Record<string, string> = {
  Beginner: 'מתחילים',
  Intermediate: 'בינוני',
  Advanced: 'מתקדם',
};

export default function CoursePage({ params }: { params: { slug: string } }) {
  const course = getCourse(params.slug);
  if (!course || course.kind !== 'course') notFound();

  const user = currentUser();
  const enrolled = user ? isEnrolled(user.id, course.slug) : false;
  const progress = user ? courseProgress(user.id, course.slug) : null;
  const { reviews, average } = reviewsFor(course.slug);
  const paragraphHtml = renderMarkdown(course.description);

  return (
    <>
      <div className="course-head">
        <div className="wrap">
          <div className="kicker">
            <span>{course.level ? LEVEL_HE[course.level] : 'קורס'}</span>
            <span>{course.lessonCount} שיעורים</span>
            <span>{formatMinutes(course.minutes)}</span>
            {average ? <span>דירוג {average.toFixed(1)} / 5</span> : null}
          </div>
          <h1>{course.title}</h1>
          <p className="sub">{course.subtitle}</p>
        </div>
      </div>

      <div className="wrap course-grid">
        <div className="course-body">
          <div className="prose" dangerouslySetInnerHTML={{ __html: paragraphHtml }} />

          <div className="syllabus">
            <h2 style={{ fontSize: '1.4rem', marginBottom: 6 }}>מערך השיעורים</h2>
            {course.modules.map((module) => (
              <div className="module" key={module.idx}>
                <div className="module-head">
                  <h3>{module.title}</h3>
                  <span className="num">מודול {module.idx + 1}</span>
                </div>
                {module.summary ? <p>{module.summary}</p> : null}
                <ul className="lesson-list">
                  {module.lessons.map((lesson, lessonIndex) => (
                    <li key={lesson.slug}>
                      <Link href={`/learn/${course.slug}/${lesson.slug}`}>
                        <span className="no">{lessonIndex + 1}.</span>
                        <span>{lesson.title}</span>
                        <span className="min">{lesson.minutes} דק׳</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="reviews" id="reviews">
            <h2 style={{ fontSize: '1.4rem' }}>דירוגים וחוות דעת</h2>
            {reviews.length ? (
              <>
                <p style={{ color: 'var(--ink-soft)', fontSize: '0.94rem' }}>
                  ממוצע {average.toFixed(1)} מתוך 5 · {reviews.length} חוות דעת
                </p>
                {reviews.map((review, index) => (
                  <div className="review" key={`${review.author}-${index}`}>
                    <div className="stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                    {review.body ? <p>{review.body}</p> : null}
                    <div className="who">{review.author}</div>
                  </div>
                ))}
              </>
            ) : (
              <p style={{ color: 'var(--ink-soft)' }}>עוד אין חוות דעת על הקורס הזה. אפשר להיות הראשונים.</p>
            )}

            {user ? (
              <form action={reviewAction} className="review-form">
                <input type="hidden" name="course" value={course.slug} />
                <label htmlFor="rating" style={{ fontSize: '0.9rem', color: 'var(--ink-soft)' }}>
                  הדירוג שלך
                </label>
                <select id="rating" name="rating" defaultValue="5">
                  <option value="5">5 — מעולה</option>
                  <option value="4">4 — טוב</option>
                  <option value="3">3 — סביר</option>
                  <option value="2">2 — חלש</option>
                  <option value="1">1 — לא מתאים לי</option>
                </select>
                <label htmlFor="body" style={{ fontSize: '0.9rem', color: 'var(--ink-soft)' }}>
                  מה עזר ומה לא (לא חובה)
                </label>
                <textarea id="body" name="body" maxLength={1200} />
                <button type="submit" className="btn small">
                  שליחת חוות דעת
                </button>
              </form>
            ) : (
              <p style={{ fontSize: '0.92rem', color: 'var(--ink-soft)' }}>
                <Link href={`/login?next=${encodeURIComponent(`/courses/${course.slug}`)}`} style={{ color: 'var(--blueprint)' }}>
                  התחברו
                </Link>{' '}
                כדי לדרג את הקורס.
              </p>
            )}
          </div>
        </div>

        <aside className="side-panel">
          <h3>מה בקורס</h3>
          <dl>
            <dt>רמה</dt>
            <dd>{LEVEL_HE[course.level] ?? course.level}</dd>
            <dt>שיעורים</dt>
            <dd>{course.lessonCount}</dd>
            <dt>משך</dt>
            <dd>{formatMinutes(course.minutes)}</dd>
            <dt>שפה</dt>
            <dd>עברית</dd>
            <dt>גישה</dt>
            <dd>חופשית</dd>
          </dl>

          {user && progress ? (
            <>
              <Progress percent={progress.percent} completed={progress.completed} total={progress.total} />
              <Link href={`/learn/${course.slug}`} className="btn" style={{ marginTop: 12 }}>
                {progress.completed ? 'המשך מהמקום שעצרת' : 'להתחיל ללמוד'}
              </Link>
            </>
          ) : (
            <Link href={`/learn/${course.slug}`} className="btn">
              להתחיל ללמוד
            </Link>
          )}

          {user && !enrolled ? (
            <form action={enrollAction}>
              <input type="hidden" name="course" value={course.slug} />
              <input type="hidden" name="next" value={`/dashboard`} />
              <button type="submit" className="btn ghost" style={{ width: '100%', marginTop: 8 }}>
                הוספה ללימודים שלי
              </button>
            </form>
          ) : null}

          <div className="tags" style={{ marginTop: 18 }}>
            {course.tags.map((tag) => (
              <Link className="tag" key={tag} href={`/courses?tag=${encodeURIComponent(tag)}`}>
                {tag}
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
