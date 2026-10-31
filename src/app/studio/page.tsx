import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/Sections';
import { requireAnyCapability } from '@/lib/guard';
import { capabilitiesFor } from '@/lib/rbac';
import { db } from '@/lib/db';
import { STATUS_LABEL, type ContentStatus } from '@/lib/studio';
import { submitForReviewAction } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'סטודיו' };

type ContentRow = {
  slug: string;
  title: string;
  status: ContentStatus;
  updated_at: string | null;
  kind: 'tutorial' | 'course' | 'lab';
  detail: string;
};

export default async function Studio({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const user = await requireAnyCapability(['content.create', 'content.edit.any', 'labs.manage'], '/studio');
  const { submitted } = await searchParams;
  const caps = capabilitiesFor(user.id);
  const canCreate = caps.has('content.create');
  const canSubmit = caps.has('content.submit');
  const canLabs = caps.has('labs.manage');

  const tutorials = db()
    .prepare(
      `SELECT slug, title, status, updated_at FROM tutorials
        WHERE (? = 1 OR author_id = ?) ORDER BY COALESCE(updated_at, published) DESC LIMIT 50`,
    )
    .all(caps.has('content.edit.any') ? 1 : 0, user.id) as unknown as Omit<ContentRow, 'kind' | 'detail'>[];
  const courses = db()
    .prepare(
      `SELECT slug, title, status, updated_at,
              (SELECT count(*) FROM lessons l WHERE l.course_slug = c.slug) AS lessons
         FROM courses c WHERE (? = 1 OR author_id = ?) ORDER BY COALESCE(updated_at, '') DESC LIMIT 50`,
    )
    .all(caps.has('content.edit.any') ? 1 : 0, user.id) as unknown as (Omit<ContentRow, 'kind' | 'detail'> & { lessons: number })[];
  const labs = db()
    .prepare(
      `SELECT slug, title, status, validation_state, repo_ref, last_validated_ref, updated_at
         FROM labs WHERE (? = 1 OR author_id = ?) ORDER BY COALESCE(updated_at, '') DESC LIMIT 50`,
    )
    .all(caps.has('content.edit.any') ? 1 : 0, user.id) as unknown as {
      slug: string; title: string; status: string; validation_state: string;
      repo_ref: string | null; last_validated_ref: string | null; updated_at: string | null;
    }[];

  const statusChip = (status: string) => (
    <span className={status === 'published' ? 'chip chip-ok' : status === 'in-review' ? 'chip' : 'chip chip-soon'}>
      {STATUS_LABEL[status as ContentStatus] ?? status}
    </span>
  );

  return (
    <>
      <SiteHeader current="" />
      <main className="wrap page admin">
        <header className="page-head">
          <p className="eyebrow"><span className="pip" aria-hidden="true" />סטודיו · {user.name}</p>
          <h1>התוכן שלי</h1>
          <p className="lede">
            טיוטה, הגשה לבדיקה, ופרסום אחרי אישור. יוצר לא מפרסם לעצמו, ומעבדה לא עולה לאוויר לפני
            שאדם בשם מופיע כאחראי הנכונות.
          </p>
          {submitted && <p className="form-ok">נשלח לבדיקה. עורך תוכן יראה את זה בתור.</p>}
        </header>

        <section className="dash-block">
          <div className="sec-head">
            <h2>מדריכים ומאמרים</h2>
            {canCreate && <Link className="sec-link" href="/studio/tutorials/new">מדריך חדש ›</Link>}
          </div>
          {tutorials.length === 0 ? (
            <p className="note">עוד לא כתבתם מדריך.</p>
          ) : (
            <ul className="admin-list">
              {tutorials.map((t) => (
                <li key={t.slug}>
                  {statusChip(t.status)}
                  <Link href={`/studio/tutorials/${t.slug}`}>{t.title}</Link>
                  <span className="r-meta">{t.updated_at ? new Date(t.updated_at).toLocaleDateString('he-IL') : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dash-block">
          <div className="sec-head">
            <h2>קורסים</h2>
            {canCreate && <Link className="sec-link" href="/studio/courses/new">קורס חדש ›</Link>}
          </div>
          {courses.length === 0 ? (
            <p className="note">עוד לא בניתם קורס. קורס = סקציות, ובתוכן שיעורים.</p>
          ) : (
            <ul className="admin-list">
              {courses.map((c) => (
                <li key={c.slug}>
                  {statusChip(c.status)}
                  <Link href={`/studio/courses/${c.slug}`}>{c.title}</Link>
                  <span className="r-meta">{c.lessons} שיעורים</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dash-block">
          <div className="sec-head">
            <h2>מעבדות</h2>
            {canLabs && <Link className="sec-link" href="/studio/labs/new">מעבדה חדשה ›</Link>}
          </div>
          {labs.length === 0 ? (
            <p className="note">אין מעבדות שנרשמו דרך הסטודיו. מעבדות קיימות מנוהלות בריפו.</p>
          ) : (
            <ul className="admin-list">
              {labs.map((l) => (
                <li key={l.slug}>
                  {statusChip(l.status)}
                  <Link href={`/studio/labs/${l.slug}`}>{l.title}</Link>
                  <span className={l.validation_state === 'validated' ? 'chip chip-ok' : 'chip chip-soon'}>
                    {l.validation_state === 'validated' ? 'מאומתת' : l.validation_state === 'stale' ? 'טעונה אימות מחדש' : 'לא מאומתת'}
                  </span>
                  <span className="r-meta" dir="ltr">{l.repo_ref ?? '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {canSubmit && (
          <p className="note">הגשה לבדיקה נעשית מתוך עמוד הפריט, אחרי שמירה.</p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
