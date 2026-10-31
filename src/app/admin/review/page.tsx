import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/Sections';
import { requireCapability } from '@/lib/guard';
import { pendingReviews } from '@/lib/studio';
import { db } from '@/lib/db';
import { reviewDecisionAction } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'בדיקת תוכן' };

const TYPE_LABEL: Record<string, string> = { tutorial: 'מדריך', course: 'קורס', lab: 'מעבדה' };

type LabGate = { slug: string; repo_ref: string | null; repo_url: string | null; validation_state: string; last_validated_ref: string | null };

export default async function AdminReview({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireCapability('content.review', '/admin/review');
  const { saved } = await searchParams;
  const queue = pendingReviews();

  const labRows = db()
    .prepare('SELECT slug, repo_ref, repo_url, validation_state, last_validated_ref FROM labs')
    .all() as unknown as LabGate[];
  const labMap = new Map(labRows.map((l) => [l.slug, l]));

  return (
    <>
      <SiteHeader current="" />
      <main className="wrap page admin">
        <header className="page-head">
          <p className="eyebrow"><span className="pip" aria-hidden="true" />תור בדיקה · {queue.length}</p>
          <h1>בדיקת תוכן</h1>
          <p className="lede">
            אישור מפרסם את הפריט. במעבדה, האישור גם קובע אתכם כאחראי הנכונות ומסמן את ה־ref הנוכחי
            כמאומת — שינוי ב־ref אחר כך מחייב בדיקה מחדש.
          </p>
          {saved && <p className="form-ok">ההחלטה נשמרה.</p>}
        </header>

        {queue.length === 0 ? (
          <p className="note">התור ריק. כשמישהו יגיש תוכן, הוא יופיע כאן.</p>
        ) : (
          <ul className="review-list">
            {queue.map((q) => {
              const lab = q.subject_type === 'lab' ? labMap.get(q.subject_id) : undefined;
              return (
                <li key={q.id} className="review-item">
                  <div className="review-head">
                    <span className="tag">{TYPE_LABEL[q.subject_type] ?? q.subject_type}</span>
                    <b>{q.title ?? q.subject_id}</b>
                    <span className="r-meta">מאת {q.author_name ?? '—'}</span>
                    <span className="r-meta">{new Date(q.created_at).toLocaleDateString('he-IL')}</span>
                  </div>
                  {lab && (
                    <p className="note" dir="ltr">
                      repo: {lab.repo_url ?? '—'} @ {lab.repo_ref ?? '—'} · state: {lab.validation_state}
                    </p>
                  )}
                  <form action={reviewDecisionAction} className="review-form">
                    <input type="hidden" name="queue_id" value={q.id} />
                    <textarea name="note" rows={2} placeholder="הערה למחבר (חובה כשמחזירים לתיקון)" />
                    <div className="cta-row">
                      <button className="btn" type="submit" name="decision" value="approve">אישור ופרסום</button>
                      <button className="btn ghosted" type="submit" name="decision" value="changes">החזרה לתיקון</button>
                    </div>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
