import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/Sections';
import { requireAnyCapability } from '@/lib/guard';
import { capabilitiesFor } from '@/lib/rbac';
import { RichEditor } from '@/components/RichEditor';
import { STATUS_LABEL, type ContentStatus } from '@/lib/studio';
import { db } from '@/lib/db';
import { saveCourseAction, saveLessonAction, saveSectionsAction, submitForReviewAction } from '../../actions';

export const dynamic = 'force-dynamic';

type CourseRow = { slug: string; title: string; subtitle: string; description: string; level: string; category: string; status: string };
type SectionRow = { idx: number; title: string };
type LessonRow = { slug: string; title: string; module_idx: number; body: string; is_preview: number; minutes: number };

export default async function CourseEditor({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string; lesson?: string }>;
}) {
  const user = await requireAnyCapability(['content.create', 'content.edit.any'], '/studio');
  const { slug } = await params;
  const { saved, lesson } = await searchParams;
  const isNew = slug === 'new';
  const d = db();
  const course = isNew
    ? null
    : (d
        .prepare('SELECT slug, title, subtitle, description, level, category, status FROM courses WHERE slug = ?')
        .get(slug) as CourseRow | undefined);
  if (!isNew && !course) {
    return (
      <main className="wrap page">
        <h1>הקורס לא נמצא</h1>
        <p className="lede"><Link href="/studio">חזרה לסטודיו ›</Link></p>
      </main>
    );
  }
  const caps = capabilitiesFor(user.id);
  const sections = course
    ? (d.prepare('SELECT idx, title FROM course_modules WHERE course_slug = ? ORDER BY idx').all(slug) as unknown as SectionRow[])
    : [];
  const lessons = course
    ? (d
        .prepare('SELECT slug, title, module_idx, body, is_preview, minutes FROM lessons WHERE course_slug = ? ORDER BY idx')
        .all(slug) as unknown as LessonRow[])
    : [];
  const editing = lesson ? lessons.find((l) => l.slug === lesson) : undefined;

  return (
    <>
      <SiteHeader current="" />
      <main className="wrap page admin">
        <nav className="crumbs">
          <Link href="/studio">סטודיו</Link>
          <span aria-hidden="true">›</span>
          <span>{course?.title ?? 'קורס חדש'}</span>
        </nav>

        <header className="page-head">
          <p className="eyebrow">
            <span className="pip" aria-hidden="true" />
            {course ? STATUS_LABEL[course.status as ContentStatus] ?? course.status : 'טיוטה חדשה'}
          </p>
          <h1>{course?.title ?? 'קורס חדש'}</h1>
          <p className="lede">קורס = סקציות, וכל סקציה מכילה שיעורים. הסדר כאן הוא הסדר באתר.</p>
          {saved && <p className="form-ok">נשמר.</p>}
        </header>

        <section className="dash-block">
          <div className="sec-head"><h2>פרטי הקורס</h2></div>
          <form action={saveCourseAction} className="admin-form">
            <input type="hidden" name="slug" value={isNew ? '' : slug} />
            <label>כותרת<input name="title" required defaultValue={course?.title ?? ''} /></label>
            <label>כותרת משנה<input name="subtitle" defaultValue={course?.subtitle ?? ''} /></label>
            <label>תיאור<input name="description" defaultValue={course?.description ?? ''} /></label>
            <div className="row-form">
              <label>קטגוריה<input name="category" defaultValue={course?.category ?? ''} /></label>
              <label>
                רמה
                <select name="level" defaultValue={course?.level ?? 'Beginner'}>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </label>
            </div>
            <button className="btn" type="submit">שמירת פרטים</button>
          </form>
        </section>

        {course && (
          <>
            <section className="dash-block">
              <div className="sec-head"><h2>סקציות</h2></div>
              <form action={saveSectionsAction} className="admin-form">
                <input type="hidden" name="slug" value={slug} />
                <label>
                  סקציה בכל שורה
                  <textarea name="sections" rows={Math.max(3, sections.length + 1)} defaultValue={sections.map((s) => s.title).join('\n')} placeholder={'יסודות\nתקלות נפוצות\nתרגול במעבדה'} />
                </label>
                <button className="btn" type="submit">שמירת סקציות</button>
              </form>
            </section>

            <section className="dash-block">
              <div className="sec-head">
                <h2>שיעורים</h2>
                <Link className="sec-link" href={`/studio/courses/${slug}`}>שיעור חדש ›</Link>
              </div>
              {lessons.length === 0 ? (
                <p className="note">אין שיעורים עדיין.</p>
              ) : (
                <ul className="admin-list">
                  {lessons.map((l) => (
                    <li key={l.slug}>
                      <span className="r-meta">{sections.find((s) => s.idx === l.module_idx)?.title ?? '—'}</span>
                      <Link href={`/studio/courses/${slug}?lesson=${l.slug}`}>{l.title}</Link>
                      {l.is_preview === 1 && <span className="chip chip-ok">תצוגה חינם</span>}
                      <span className="r-meta">{l.minutes} דק׳</span>
                    </li>
                  ))}
                </ul>
              )}

              <form action={saveLessonAction} className="admin-form">
                <input type="hidden" name="course" value={slug} />
                <input type="hidden" name="lesson_slug" value={editing?.slug ?? ''} />
                <div className="sec-head"><h2>{editing ? `עריכת: ${editing.title}` : 'שיעור חדש'}</h2></div>
                <label>כותרת<input name="title" required defaultValue={editing?.title ?? ''} /></label>
                <label>
                  סקציה
                  <select name="module_idx" defaultValue={String(editing?.module_idx ?? 0)}>
                    {sections.map((s) => (
                      <option key={s.idx} value={s.idx}>{s.title}</option>
                    ))}
                  </select>
                </label>
                <label className="check inline">
                  <input type="checkbox" name="is_preview" defaultChecked={editing?.is_preview === 1} />
                  <span><b>פתוח בחינם</b> (שיעור תצוגה)</span>
                </label>
                <RichEditor name="body" defaultValue={editing?.body ?? ''} label="גוף השיעור" />
                <button className="btn" type="submit">שמירת שיעור</button>
              </form>
            </section>

            {caps.has('content.submit') && course.status !== 'in-review' && (
              <form action={submitForReviewAction} className="admin-form submit-row">
                <input type="hidden" name="type" value="course" />
                <input type="hidden" name="slug" value={slug} />
                <button className="btn ghosted" type="submit">שליחה לבדיקה</button>
              </form>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
