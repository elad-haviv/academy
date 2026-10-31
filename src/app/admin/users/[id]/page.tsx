import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/Sections';
import { requireCapability } from '@/lib/guard';
import { db } from '@/lib/db';
import {
  CAPABILITIES,
  capabilitiesFor,
  listRoles,
  rolesFor,
} from '@/lib/rbac';
import {
  grantEntitlementAction,
  revokeEntitlementAction,
  setUserCapabilityAction,
  setUserRolesAction,
} from '../../actions';

export const dynamic = 'force-dynamic';

type UserRow = { id: number; email: string; name: string; created_at: string; email_verified_at: string | null };

export default async function AdminUser({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const me = await requireCapability('users.read', '/admin/users');
  const { id } = await params;
  const { saved } = await searchParams;
  const userId = Number(id);
  const user = db()
    .prepare('SELECT id, email, name, created_at, email_verified_at FROM users WHERE id = ?')
    .get(userId) as UserRow | undefined;
  if (!user) notFound();

  const roles = listRoles();
  const held = new Set(rolesFor(userId).map((r) => r.id));
  const effective = capabilitiesFor(userId);
  const overrides = db()
    .prepare('SELECT capability, allow FROM user_capabilities WHERE user_id = ?')
    .all(userId) as unknown as { capability: string; allow: number }[];
  const overrideMap = new Map(overrides.map((o) => [o.capability, o.allow]));
  const grants = db()
    .prepare(
      `SELECT id, subject, source, starts_at, ends_at FROM entitlements
        WHERE user_id = ? AND revoked_at IS NULL ORDER BY starts_at DESC`,
    )
    .all(userId) as unknown as { id: number; subject: string; source: string; starts_at: string; ends_at: string | null }[];

  const canManage = effective.has('users.manage');

  return (
    <>
      <SiteHeader current="" />
      <main className="wrap page admin">
        <nav className="crumbs">
          <Link href="/admin">ניהול</Link>
          <span aria-hidden="true">›</span>
          <Link href="/admin/users">משתמשים</Link>
          <span aria-hidden="true">›</span>
          <span>{user.name}</span>
        </nav>

        <header className="page-head">
          <p className="eyebrow">
            <span className="pip" aria-hidden="true" />
            {user.email_verified_at ? 'אימייל מאומת' : 'אימייל לא אומת'}
          </p>
          <h1>{user.name}</h1>
          <p className="lede" dir="ltr">{user.email}</p>
          {saved && <p className="form-ok">נשמר.</p>}
        </header>

        <section className="dash-block">
          <div className="sec-head"><h2>תפקידים</h2></div>
          <form action={setUserRolesAction} className="admin-form">
            <input type="hidden" name="user_id" value={user.id} />
            <div className="check-grid">
              {roles.map((r) => (
                <label key={r.id} className="check">
                  <input type="checkbox" name="role" value={r.id} defaultChecked={held.has(r.id)} disabled={!canManage} />
                  <span>
                    <b>{r.name}</b>
                    <em>{r.description}</em>
                  </span>
                </label>
              ))}
            </div>
            {canManage && <button className="btn" type="submit">שמירת תפקידים</button>}
          </form>
        </section>

        <section className="dash-block">
          <div className="sec-head"><h2>הרשאות בפועל</h2></div>
          <p className="note">ברירת המחדל מגיעה מהתפקידים. אפשר לחרוג פר-משתמש: לאשר או לשלול הרשאה בודדת.</p>
          <table className="admin-table">
            <thead>
              <tr><th>הרשאה</th><th>מקור</th><th>בפועל</th><th>חריגה</th></tr>
            </thead>
            <tbody>
              {CAPABILITIES.map((c) => {
                const ov = overrideMap.get(c.key);
                return (
                  <tr key={c.key}>
                    <td>{c.label}</td>
                    <td dir="ltr"><code>{c.key}</code></td>
                    <td>{effective.has(c.key) ? 'כן' : 'לא'}</td>
                    <td>
                      <form action={setUserCapabilityAction} className="inline-form">
                        <input type="hidden" name="user_id" value={user.id} />
                        <input type="hidden" name="capability" value={c.key} />
                        <select name="mode" defaultValue={ov === 1 ? 'allow' : ov === 0 ? 'deny' : 'default'} disabled={!canManage}>
                          <option value="default">לפי התפקיד</option>
                          <option value="allow">לאשר</option>
                          <option value="deny">לשלול</option>
                        </select>
                        {canManage && <button className="btn sm ghosted" type="submit">עדכון</button>}
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="dash-block">
          <div className="sec-head"><h2>גישה לתוכן</h2></div>
          <ul className="admin-list">
            {grants.map((g) => (
              <li key={g.id}>
                <b dir="ltr">{g.subject === 'all' ? 'הכול' : g.subject}</b>
                <span className="r-meta">{g.source}</span>
                <span className="r-meta">
                  {new Date(g.starts_at).toLocaleDateString('he-IL')} — {g.ends_at ? new Date(g.ends_at).toLocaleDateString('he-IL') : 'ללא הגבלה'}
                </span>
                {canManage && (
                  <form action={revokeEntitlementAction} className="inline-form">
                    <input type="hidden" name="entitlement_id" value={g.id} />
                    <input type="hidden" name="user_id" value={user.id} />
                    <button className="btn sm ghosted" type="submit">שלילה</button>
                  </form>
                )}
              </li>
            ))}
            {grants.length === 0 && <li className="note">אין הרשאות תוכן פעילות.</li>}
          </ul>
          {canManage && (
            <form action={grantEntitlementAction} className="admin-form row-form">
              <input type="hidden" name="user_id" value={user.id} />
              <label>
                מה לפתוח
                <input name="subject" defaultValue="all" dir="ltr" />
              </label>
              <label>
                ימים (0 = ללא הגבלה)
                <input name="days" type="number" min={0} defaultValue={0} />
              </label>
              <button className="btn" type="submit">מתן גישה</button>
            </form>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
