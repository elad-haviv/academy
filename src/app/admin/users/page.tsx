import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/Sections';
import { requireCapability } from '@/lib/guard';
import { db } from '@/lib/db';
import { listRoles } from '@/lib/rbac';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'משתמשים' };

type Row = { id: number; email: string; name: string; created_at: string; role_names: string | null };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireCapability('users.read', '/admin/users');
  const { q } = await searchParams;
  const search = (q ?? '').trim();

  const rows = db()
    .prepare(
      `SELECT u.id, u.email, u.name, u.created_at,
              (SELECT group_concat(r.name, ' · ') FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id) AS role_names
         FROM users u
        WHERE (? = '' OR u.email LIKE ? OR u.name LIKE ?)
        ORDER BY u.created_at DESC LIMIT 100`,
    )
    .all(search, `%${search}%`, `%${search}%`) as unknown as Row[];

  return (
    <>
      <SiteHeader current="" />
      <main className="wrap page admin">
        <header className="page-head">
          <p className="eyebrow">
            <span className="pip" aria-hidden="true" />
            ניהול · {rows.length} משתמשים
          </p>
          <h1>משתמשים</h1>
          <form className="admin-search" action="/admin/users">
            <input type="search" name="q" defaultValue={search} placeholder="חיפוש לפי אימייל או שם" />
            <button className="btn" type="submit">חיפוש</button>
          </form>
        </header>

        <table className="admin-table">
          <thead>
            <tr>
              <th>שם</th>
              <th>אימייל</th>
              <th>תפקידים</th>
              <th>נרשם</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link href={`/admin/users/${r.id}`}>{r.name}</Link>
                </td>
                <td dir="ltr">{r.email}</td>
                <td>{r.role_names ?? '—'}</td>
                <td>{new Date(r.created_at).toLocaleDateString('he-IL')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="note">לא נמצאו משתמשים.</p>}
        <p className="note">תפקידים במערכת: {listRoles().map((r) => r.name).join(' · ')}.</p>
      </main>
      <SiteFooter />
    </>
  );
}
