import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { completeLessonAction } from '@/app/actions';
import { PaywallCard } from '@/components/PaywallCard';
import { Progress } from '@/components/Progress';
import { isPremiumLesson, paywallEnabled, requireLesson, resolveViewer } from '@/lib/access';
import { formatMinutes } from '@/lib/format';
import { courseProgress, completedLessons, getCourse, lessonRefs } from '@/lib/queries';
import { renderMarkdown } from '@/lib/markdown';

export function generateMetadata({ params }: { params: { slug: string; lessonSlug: string } }): Metadata {
  const course = getCourse(params.slug);
  const lesson = course?.modules.flatMap((module) => module.lessons).find((item) => item.slug === params.lessonSlug);
  return { title: lesson ? lesson.title : 'שיעור' };
}

export default function LessonPage({ params }: { params: { slug: string; lessonSlug: string } }) {
  const course = getCourse(params.slug);
  if (!course) notFound();

  const viewer = resolveViewer();
  const { lesson, gate } = requireLesson(viewer, params.slug, params.lessonSlug);
  const gated = !gate.allowed;

  const refs = lessonRefs(course.slug);
  const position = refs.findIndex((ref) => ref.slug === lesson.slug);
  const prev = position > 0 ? refs[position - 1] : null;
  const next = position >= 0 && position < refs.length - 1 ? refs[position + 1] : null;
  const upcoming = refs.slice(position + 1, position + 3);

  const user = viewer.user;
  const done = user ? completedLessons(user.id, course.slug) : new Set<string>();
  const progress = user ? courseProgress(user.id, course.slug) : null;
  const isDone = done.has(lesson.slug);

  // The premium body never reaches the client: only the preview slice is rendered.
  const html = renderMarkdown(gated ? gate.previewMd : lesson.body);
  const showLocks = paywallEnabled() && !viewer.isMember;

  return (
    <div className="learn">
      <aside className="learn-aside">
        <div className="course-title">
          <Link href={`/courses/${course.slug}`}>{course.title}</Link>
        </div>
        <div className="course-meta">
          {refs.length} שיעורים · {formatMinutes(course.minutes)}
        </div>
        {progress ? <Progress percent={progress.percent} completed={progress.completed} total={progress.total} /> : null}
        {course.modules.map((module) => (
          <div key={module.idx}>
            <div className="module-label">
              מודול {module.idx + 1} · {module.title}
            </div>
            <ul>
              {module.lessons.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/learn/${course.slug}/${item.slug}`}
                    data-current={item.slug === lesson.slug ? 'true' : 'false'}
                  >
                    <span className={done.has(item.slug) ? 'tick' : 'tick empty'} aria-hidden="true">
                      {done.has(item.slug) ? '✓' : '·'}
                    </span>
                    <span>{item.title}</span>
                    {showLocks && isPremiumLesson(item) ? (
                      <span className="lock" aria-label="שיעור למנויים">
                        🔒
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>

      <div className="learn-main">
        <div className="crumb">
          מודול {lesson.moduleIdx + 1} · {lesson.moduleTitle} — שיעור {position + 1} מתוך {refs.length}
        </div>
        <h1>{lesson.title}</h1>
        <p className="lede">
          {lesson.minutes} דקות קריאה
          {gated ? ' · תצוגה מקדימה' : ''}
        </p>

        {!user && !gated ? (
          <div className="notice" style={{ maxWidth: 'var(--reading)' }}>
            <Link href={`/login?next=${encodeURIComponent(`/learn/${course.slug}/${lesson.slug}`)}`} style={{ color: 'var(--blueprint)' }}>
              התחברו
            </Link>{' '}
            כדי שההתקדמות בקורס תישמר בחשבון.
          </div>
        ) : null}

        <article className="prose" dangerouslySetInnerHTML={{ __html: html }} />

        {gated ? (
          <>
            <PaywallCard outcome={gate.outcome} next={`/learn/${course.slug}/${lesson.slug}`} />

            {upcoming.length ? (
              <div className="paywall-next">
                <div className="caption">בהמשך הקורס</div>
                <ul>
                  {upcoming.map((item) => (
                    <li key={item.slug}>
                      <span className="num">{item.minutes} דק׳</span>
                      {item.title}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : null}

        {!gated ? (
          <div className="lesson-foot">
            {user ? (
              <form action={completeLessonAction}>
                <input type="hidden" name="course" value={course.slug} />
                <input type="hidden" name="lesson" value={lesson.slug} />
                <input type="hidden" name="next" value={`/learn/${course.slug}/${lesson.slug}`} />
                <button type="submit" className={isDone ? 'btn done' : 'btn'}>
                  {isDone ? '✓ השיעור הושלם — ביטול סימון' : 'סימון השיעור כהושלם'}
                </button>
              </form>
            ) : null}

            <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
              {prev ? (
                <Link className="navlink" href={`/learn/${course.slug}/${prev.slug}`}>
                  <span>הקודם</span>
                  {prev.title}
                </Link>
              ) : null}
              {next ? (
                <Link className="navlink" href={`/learn/${course.slug}/${next.slug}`}>
                  <span>הבא</span>
                  {next.title}
                </Link>
              ) : (
                <Link className="navlink" href={`/courses/${course.slug}`}>
                  <span>סוף הקורס</span>
                  חזרה לעמוד הקורס
                </Link>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
