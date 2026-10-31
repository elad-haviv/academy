import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/Sections';
import { requireAnyCapability } from '@/lib/guard';
import { pendingReviews } from '@/lib/studio';
import { capabilitiesFor, listRoles, rolesFor } from '@/lib/rbac';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'ניהול' };

export default async function AdminHome() {
  const user = await requireAnyCapability(
    ['users.read', 'users.manage', 'roles.manage', 'content.review', 'audit.read'],
    '/admin',
  );
  const caps = capabilitiesFor(user.id);
  const queue = pendingReviews();
  const stats = {
    users: (db().prepare('SELECT count(*) AS n FROM users').get() as { n: number }).n,
    published: (
      db()
        .prepare("SELECT (SELECT count(*) FROM tutorials WHERE status='published') + (SELECT count(*) FROM courses WHERE status='published') AS n")
        .get() as { n: number }
    ).n,
    labs: (db().prepare('SELECT count(*) AS n FROM labs').get() as { n: number }).n,
  };

  return (
    <>
      <SiteHeader current="" />
      <main className="wrap page admin">
        <header className="page-head">
          <p className="eyebrow">
            <span className="pip" aria-hidden="true" />
            ניהול · {rolesFor(user.id).map((r) => r.name).join(' · ') || 'ללא תפקיד'}
          </p>
          <h1>ניהול</h1>
          <p className="lede">
            משתמשים, תפקידים והרשאות, תור בדיקת תוכן ויומן פעולות. כל נתון כאן נשמר במסד הנתונים,
            לא בקוד.
          </p>
        </header>

        <dl className="admin-stats">
          <div>
            <dt>משתמשים</dt>
            <dd>{stats.users}</dd>
          </div>
          <div>
            <dt>תוכן מפורסם</dt>
            <dd>{stats.published}</dd>
          </div>
          <div>
            <dt>מעבדות במערכת</dt>
            <dd>{stats.labs}</dd>
          </div>
          <div>
            <dt>בתור הבדיקה</dt>
            <dd>{queue.length}</dd>
          </div>
        </dl>

        <nav className="admin-nav">
          {caps.has('users.read') || caps.has('users.manage') ? <Link href="/admin/users">משתמשים</Link> : null}
          {caps.has('roles.manage') ? <Link href="/admin/roles">תפקידים והרשאות</Link> : null}
          {caps.has('content.review') ? <Link href="/admin/review">בדיקת תוכן ({queue.length})</Link> : null}
          {caps.has('audit.read') ? <Link href="/admin/audit">יומן פעולות</Link> : null}
        </nav>

        <section className="dash-block">
          <div className="sec-head">
            <h2>ממתין לבדיקה</h2>
            {caps.has('content.review') ? (
              <Link className="sec-link" href="/admin/review">
                לתור המלא ›
              </Link>
            ) : null}
          </div>
          {queue.length === 0 ? (
            <p className="note">אין פריטים שממתינים לבדיקה.</p>
          ) : (
            <ul className="admin-list">
              {queue.slice(0, 5).map((q) => (
                <li key={q.id}>
                  <span className="tag">{q.subject_type === 'lab' ? 'מעבדה' : q.subject_type === 'course' ? 'קורס' : 'מדריך'}</span>
                  <b>{q.title ?? q.subject_id}</b>
                  <span className="r-meta">{q.author_name ?? '—'}</span>
                  <span className="r-meta">{new Date(q.created_at).toLocaleDateString('he-IL')}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="note">
          תפקידים זמינים: {listRoles().map((r) => r.name).join(' · ')}
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
