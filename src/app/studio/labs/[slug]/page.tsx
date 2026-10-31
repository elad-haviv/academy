import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/Sections';
import { requireAnyCapability } from '@/lib/guard';
import { capabilitiesFor } from '@/lib/rbac';
import { STATUS_LABEL, type ContentStatus } from '@/lib/studio';
import { db } from '@/lib/db';
import { saveLabAction, submitForReviewAction } from '../../actions';

export const dynamic = 'force-dynamic';

type LabRow = {
  slug: string; title: string; subtitle: string; vertical: string; status: string;
  repo_url: string | null; repo_ref: string | null; embed_url: string | null;
  validation_state: string; last_validated_ref: string | null;
  correctness_owner: string | null; validated_on: string | null;
  outcomes: string; failure_modes: string;
};

function parse(value: string | null | undefined): string[] {
  try {
    const p = JSON.parse(value ?? '[]');
    return Array.isArray(p) ? p.map(String) : [];
  } catch {
    return [];
  }
}

export default async function LabEditor({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireAnyCapability(['labs.manage'], '/studio');
  const { slug } = await params;
  const { saved } = await searchParams;
  const isNew = slug === 'new';
  const lab = isNew
    ? null
    : (db().prepare('SELECT * FROM labs WHERE slug = ?').get(slug) as LabRow | undefined);
  if (!isNew && !lab) {
    return (
      <main className="wrap page">
        <h1>המעבדה לא נמצאה</h1>
        <p className="lede"><Link href="/studio">חזרה לסטודיו ›</Link></p>
      </main>
    );
  }
  const caps = capabilitiesFor(user.id);
  const stale = lab && lab.last_validated_ref && lab.repo_ref !== lab.last_validated_ref;

  return (
    <>
      <SiteHeader current="" />
      <main className="wrap page admin">
        <nav className="crumbs">
          <Link href="/studio">סטודיו</Link>
          <span aria-hidden="true">›</span>
          <span>{lab?.title ?? 'מעבדה חדשה'}</span>
        </nav>

        <header className="page-head">
          <p className="eyebrow">
            <span className="pip" aria-hidden="true" />
            {lab ? STATUS_LABEL[lab.status as ContentStatus] ?? lab.status : 'רישום חדש'}
            {lab ? ` · ${lab.validation_state === 'validated' ? 'מאומתת' : lab.validation_state === 'stale' ? 'טעונה אימות מחדש' : 'לא מאומתת'}` : ''}
          </p>
          <h1>{lab?.title ?? 'מעבדה חדשה'}</h1>
          <p className="lede">
            מעבדה היא תוכנה אינטראקטיבית: מצביעים על הריפו והענף שמהם נבנית, ועל כתובת ההטמעה.
            שינוי ב־ref מבטל את האימות הקודם עד לבדיקה חוזרת.
          </p>
          {saved && <p className="form-ok">נשמר.</p>}
          {stale && (
            <p className="form-error">
              ה-ref הנוכחי ({lab?.repo_ref}) שונה מזה שאומת ({lab?.last_validated_ref}). המעבדה מוסתרת
              מהאתר עד שעורך תוכן יאמת אותה מחדש.
            </p>
          )}
          {lab?.validation_state === 'validated' && (
            <p className="note">מאומתת על ידי {lab.correctness_owner} · {lab.validated_on}</p>
          )}
        </header>

        <form action={saveLabAction} className="admin-form">
          <input type="hidden" name="slug" value={isNew ? '' : slug} />
          <label>כותרת<input name="title" required defaultValue={lab?.title ?? ''} /></label>
          <label>כותרת משנה<input name="subtitle" defaultValue={lab?.subtitle ?? ''} /></label>
          <div className="row-form">
            <label>
              תחום
              <select name="vertical" defaultValue={lab?.vertical ?? 'agl'}>
                <option value="agl">תאורת מסלולים</option>
                <option value="gensets">גנרטורים</option>
                <option value="other">אחר</option>
              </select>
            </label>
            <label>ענף / ref<input name="repo_ref" defaultValue={lab?.repo_ref ?? 'main'} dir="ltr" /></label>
          </div>
          <label>
            ריפו Git
            <input name="repo_url" defaultValue={lab?.repo_url ?? ''} dir="ltr" placeholder="https://github.com/elad-haviv/..." />
          </label>
          <label>
            כתובת הטמעה (iframe)
            <input name="embed_url" defaultValue={lab?.embed_url ?? ''} dir="ltr" placeholder="https://..." />
          </label>
          <label>
            מה לומדים (שורה לכל פריט)
            <textarea name="outcomes" rows={4} defaultValue={parse(lab?.outcomes).join('\n')} />
          </label>
          <label>
            מה נשבר ומלמד (שורה לכל פריט)
            <textarea name="failure_modes" rows={4} defaultValue={parse(lab?.failure_modes).join('\n')} />
          </label>
          <button className="btn lg" type="submit">שמירה</button>
        </form>

        {lab && caps.has('content.submit') && (
          <form action={submitForReviewAction} className="admin-form submit-row">
            <input type="hidden" name="type" value="lab" />
            <input type="hidden" name="slug" value={slug} />
            <button className="btn ghosted" type="submit">שליחה לאימות</button>
          </form>
        )}
        {lab && caps.has('content.review') && (
          <p className="note">
            <Link href="/admin/review">לתור הבדיקה ›</Link> — אישור קובע אתכם כאחראי הנכונות על ה-ref הנוכחי.
          </p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
