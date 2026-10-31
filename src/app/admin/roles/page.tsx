import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/Sections';
import { requireCapability } from '@/lib/guard';
import { CAPABILITIES, listRoles } from '@/lib/rbac';
import { createRoleAction } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'תפקידים והרשאות' };

export default async function AdminRoles({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireCapability('roles.manage', '/admin/roles');
  const { saved, error } = await searchParams;
  const roles = listRoles();

  return (
    <>
      <SiteHeader current="" />
      <main className="wrap page admin">
        <header className="page-head">
          <p className="eyebrow">
            <span className="pip" aria-hidden="true" />
            {roles.length} תפקידים · {CAPABILITIES.length} הרשאות
          </p>
          <h1>תפקידים והרשאות</h1>
          <p className="lede">
            תפקיד הוא חבילה של הרשאות. אפשר ליצור כמה תפקידים שרוצים, ולחבר לכל משתמש כמה תפקידים.
          </p>
          {saved && <p className="form-ok">נשמר.</p>}
          {error === 'name' && <p className="form-error">צריך שם לתפקיד.</p>}
        </header>

        <table className="admin-table">
          <thead>
            <tr><th>תפקיד</th><th>תיאור</th><th>הרשאות</th><th /></tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id}>
                <td><b>{r.name}</b>{r.is_system ? <span className="chip chip-soon">מערכת</span> : null}</td>
                <td>{r.description || '—'}</td>
                <td>{r.capabilities.length}</td>
                <td><Link href={`/admin/roles/${r.id}`}>עריכה ›</Link></td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="dash-block">
          <div className="sec-head"><h2>תפקיד חדש</h2></div>
          <form action={createRoleAction} className="admin-form">
            <label>שם<input name="name" required placeholder="למשל: מתרגל מעבדות" /></label>
            <label>תיאור<input name="description" placeholder="מה התפקיד הזה אמור לעשות" /></label>
            <button className="btn" type="submit">יצירה</button>
          </form>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
