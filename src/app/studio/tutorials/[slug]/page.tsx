import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/Sections';
import { requireAnyCapability } from '@/lib/guard';
import { capabilitiesFor } from '@/lib/rbac';
import { RichEditor } from '@/components/RichEditor';
import { STATUS_LABEL, getTutorialRow, type ContentStatus } from '@/lib/studio';
import { db } from '@/lib/db';
import { saveTutorialAction, submitForReviewAction } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function TutorialEditor({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireAnyCapability(['content.create', 'content.edit.any'], '/studio');
  const { slug } = await params;
  const { saved } = await searchParams;
  const isNew = slug === 'new';
  const row = isNew ? null : getTutorialRow(slug);
  if (!isNew && !row) {
    return (
      <main className="wrap page">
        <h1>המדריך לא נמצא</h1>
        <p className="lede"><Link href="/studio">חזרה לסטודיו ›</Link></p>
      </main>
    );
  }
  const caps = capabilitiesFor(user.id);
  const lastNote = row
    ? (db()
        .prepare(
          `SELECT note, status FROM reviews_queue WHERE subject_type = 'tutorial' AND subject_id = ? ORDER BY id DESC LIMIT 1`,
        )
        .get(slug) as { note: string; status: string } | undefined)
    : undefined;

  return (
    <>
      <SiteHeader current="" />
      <main className="wrap page admin">
        <nav className="crumbs">
          <Link href="/studio">סטודיו</Link>
          <span aria-hidden="true">›</span>
          <span>{row?.title ?? 'מדריך חדש'}</span>
        </nav>

        <header className="page-head">
          <p className="eyebrow">
            <span className="pip" aria-hidden="true" />
            {row ? STATUS_LABEL[row.status as ContentStatus] ?? row.status : 'טיוטה חדשה'}
            {lastNote?.status === 'changes' && lastNote.note ? ` · הערת עורך: ${lastNote.note}` : ''}
          </p>
          <h1>{row?.title ?? 'מדריך חדש'}</h1>
          <p className="lede">כתיבה חופשית עם עיצוב. מה שנשמר נכנס למסד הנתונים, לא לריפו.</p>
          {saved && <p className="form-ok">נשמר.</p>}
        </header>

        <form action={saveTutorialAction} className="admin-form">
          <input type="hidden" name="slug" value={isNew ? '' : slug} />
          <label>
            כותרת
            <input name="title" required defaultValue={row?.title ?? ''} placeholder="למשל: לנתק מעגל בלי לשרוף את השנאי" />
          </label>
          <label>
            תקציר
            <input name="excerpt" defaultValue={row?.excerpt ?? ''} placeholder="משפט אחד שמסביר מה יוצא מזה" />
          </label>
          <div className="row-form">
            <label>קטגוריה<input name="category" defaultValue={row?.category ?? ''} placeholder="תאורת מסלולים" /></label>
            <label>
              רמה
              <select name="level" defaultValue={row?.level ?? 'Beginner'}>
                <option value="Beginner">מתחילים</option>
                <option value="Intermediate">בינוני</option>
                <option value="Advanced">מתקדם</option>
              </select>
            </label>
            <label>תגיות<input name="tags" defaultValue={row?.tags ?? ''} placeholder="מופרדות בפסיק" /></label>
          </div>
          <RichEditor name="body" defaultValue={row?.body ?? ''} label="גוף המדריך" />
          <button className="btn lg" type="submit">שמירה</button>
        </form>

        {row && caps.has('content.submit') && row.status !== 'in-review' && (
          <form action={submitForReviewAction} className="admin-form submit-row">
            <input type="hidden" name="type" value="tutorial" />
            <input type="hidden" name="slug" value={slug} />
            <button className="btn ghosted" type="submit">שליחה לבדיקה</button>
            {row.status === 'published' && <span className="note">פרסום מחדש ידרוש אישור עורך.</span>}
          </form>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
