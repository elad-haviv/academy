import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/Sections';
import { courseLessons, getCourse, completedLessons } from '@/lib/content';
import { currentUser } from '@/lib/auth';
import { canAccess } from '@/lib/access';
import { duration } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = getCourse(slug);
  return {
    title: course?.title ?? 'קורס',
    description: course?.subtitle ?? course?.description ?? undefined,
  };
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) notFound();

  const lessons = courseLessons(slug);
  const user = await currentUser();
  const full = canAccess(user, `course:${slug}`);
  const done = user ? completedLessons(user.id, slug) : [];
  const first = lessons[0];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.subtitle || course.description,
    inLanguage: 'he',
    provider: { '@type': 'Organization', name: 'Haviv Academy', url: 'https://academy.haviv.pro' },
    numberOfCredits: 0,
    timeRequired: `PT${course.minutes}M`,
  };

  return (
    <>
      <SiteHeader current="courses" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="wrap page">
        <nav className="crumbs">
          <Link href="/courses">קורסים</Link>
          <span aria-hidden="true">›</span>
          <span>{course.title}</span>
        </nav>

        <header className="course-head">
          <div>
            <p className="eyebrow">
              <span className="pip" aria-hidden="true" />
              {course.category || 'כללי'} · {course.level}
            </p>
            <h1>{course.title}</h1>
            <p className="lede">{course.subtitle || course.description}</p>
            <div className="cta-row">
              {first && (
                <Link className="btn lg" href={`/courses/${slug}/${first.slug}`}>
                  {done.length > 0 ? 'המשך מהמקום שבו הפסקת' : 'התחלת הקורס'}
                </Link>
              )}
              <Link className="ghost lg" href="/pricing">
                מה כלול במנוי ›
              </Link>
            </div>
          </div>
          <aside className="course-aside">
            <dl>
              <div>
                <dt>שיעורים</dt>
                <dd>{lessons.length}</dd>
              </div>
              <div>
                <dt>אורך</dt>
                <dd>{duration(course.minutes)}</dd>
              </div>
              <div>
                <dt>התקדמות</dt>
                <dd>
                  {done.length}/{lessons.length}
                </dd>
              </div>
              <div>
                <dt>גישה</dt>
                <dd>{full ? 'מלאה' : 'שיעור ראשון'}</dd>
              </div>
            </dl>
          </aside>
        </header>

        <section className="lesson-list">
          <h2>שיעורים</h2>
          {lessons.map((l, i) => {
            const unlocked = full || l.is_preview === 1;
            return (
              <Link className="lesson-row" key={l.slug} href={`/courses/${slug}/${l.slug}`}>
                <span className="n">{String(i + 1).padStart(2, '0')}</span>
                <span className="l-title">{l.title}</span>
                <span className={done.includes(l.slug) ? 'l-state done' : 'l-state'}>
                  {done.includes(l.slug) ? 'הושלם' : unlocked ? 'פתוח' : 'במנוי'}
                </span>
                <span className="r-meta">{duration(l.minutes)}</span>
              </Link>
            );
          })}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
