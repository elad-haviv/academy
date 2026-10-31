import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/Sections';
import { courseLessons, getCourse, getLesson, isComplete } from '@/lib/content';
import { currentUser } from '@/lib/auth';
import { canAccess, preview } from '@/lib/access';
import { renderMarkdown, previewMarkdown } from '@/lib/markdown';
import { duration } from '@/lib/format';
import { completeLessonAction } from '../../../actions';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; lesson: string }>;
}) {
  const { slug, lesson } = await params;
  const l = getLesson(slug, lesson);
  const c = getCourse(slug);
  return { title: l ? `${l.title} · ${c?.title ?? ''}` : 'שיעור' };
}

export default async function LessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; lesson: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { slug, lesson } = await params;
  const { done } = await searchParams;

  const course = getCourse(slug);
  const item = getLesson(slug, lesson);
  if (!course || !item) notFound();

  const lessons = courseLessons(slug);
  const index = lessons.findIndex((l) => l.slug === lesson);
  const prev = index > 0 ? lessons[index - 1] : null;
  const next = index < lessons.length - 1 ? lessons[index + 1] : null;

  const user = await currentUser();
  const unlocked = canAccess(user, `course:${slug}`) || item.is_preview === 1;
  const completed = user ? isComplete(user.id, slug, lesson) : false;

  // A gated lesson returns 200 with a real preview — never a 402, never blurred text.
  const gate = unlocked ? null : preview(item.body);

  return (
    <>
      <SiteHeader current="courses" />
      <main className="wrap lesson-page">
        <nav className="crumbs">
          <Link href="/courses">קורסים</Link>
          <span aria-hidden="true">›</span>
          <Link href={`/courses/${slug}`}>{course.title}</Link>
          <span aria-hidden="true">›</span>
          <span>{item.title}</span>
        </nav>

        <div className="lesson-grid">
          <aside className="lesson-rail">
            <p className="rail-title">בקורס הזה</p>
            <ol>
              {lessons.map((l, i) => (
                <li key={l.slug} className={l.slug === lesson ? 'on' : undefined}>
                  <Link href={`/courses/${slug}/${l.slug}`}>
                    <span className="n">{String(i + 1).padStart(2, '0')}</span>
                    <span>{l.title}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </aside>

          <article className="lesson-body">
            <p className="lesson-meta">
              שיעור {index + 1} מתוך {lessons.length} · {duration(item.minutes)}
              {completed && <span className="l-state done">הושלם</span>}
            </p>
            <h1>{item.title}</h1>

            {done === '1' && <p className="notice">השיעור סומן כהושלם. ממשיכים לבא.</p>}

            {unlocked ? (
              <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(item.body) }} />
            ) : (
              <>
                <div className="prose prose-preview">
                  <div dangerouslySetInnerHTML={{ __html: previewMarkdown(item.body) }} />
                </div>
                <div className="paywall">
                  <b>עד כאן החינם</b>
                  <p>
                    השיעור המלא, כל השיעורים ושתי המעבדות פתוחים בניסיון של 7 ימים — ואחריו ₪349 לשנה
                    או ₪39 לחודש.
                  </p>
                  <div className="cta-row">
                    <Link className="btn lg" href="/register?plan=annual">
                      התחילו ניסיון
                    </Link>
                    <Link className="ghost lg" href="/pricing">
                      השוואת מסלולים ›
                    </Link>
                  </div>
                </div>
              </>
            )}

            <footer className="lesson-foot">
              {prev && (
                <Link className="ghost" href={`/courses/${slug}/${prev.slug}`}>
                  ‹ {prev.title}
                </Link>
              )}
              {unlocked && user && !completed && (
                <form action={completeLessonAction}>
                  <input type="hidden" name="course" value={slug} />
                  <input type="hidden" name="lesson" value={lesson} />
                  <button className="btn" type="submit">
                    סימון כהושלם
                  </button>
                </form>
              )}
              {!user && unlocked && (
                <Link className="btn" href={`/login?next=/courses/${slug}/${lesson}`}>
                  כניסה כדי לשמור התקדמות
                </Link>
              )}
              {next && (
                <Link className="btn ghosted" href={`/courses/${slug}/${next.slug}`}>
                  {next.title} ›
                </Link>
              )}
            </footer>
          </article>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
