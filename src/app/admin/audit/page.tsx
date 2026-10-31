import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/Sections';
import { requireCapability } from '@/lib/guard';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'יומן פעולות' };

type Row = { id: number; action: string; subject: string; detail: string; created_at: string; actor: string | null };

export default async function AdminAudit() {
  await requireCapability('audit.read', '/admin/audit');
  const rows = db()
    .prepare(
      `SELECT a.*, u.name AS actor FROM audit_log a
         LEFT JOIN users u ON u.id = a.actor_user_id
        ORDER BY a.id DESC LIMIT 200`,
    )
    .all() as unknown as Row[];

  return (
    <>
      <SiteHeader current="" />
      <main className="wrap page admin">
        <header className="page-head">
          <p className="eyebrow"><span className="pip" aria-hidden="true" />200 פעולות אחרונות</p>
          <h1>יומן פעולות</h1>
          <p className="lede">כל שינוי הרשאה, אישור תוכן וכניסה דרך SSO נרשם כאן.</p>
        </header>
        <table className="admin-table">
          <thead><tr><th>מתי</th><th>מי</th><th>פעולה</th><th>נושא</th><th>פרטים</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.created_at).toLocaleString('he-IL')}</td>
                <td>{r.actor ?? '—'}</td>
                <td dir="ltr"><code>{r.action}</code></td>
                <td dir="ltr">{r.subject}</td>
                <td dir="ltr">{r.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="note">היומן ריק.</p>}
      </main>
      <SiteFooter />
    </>
  );
}
