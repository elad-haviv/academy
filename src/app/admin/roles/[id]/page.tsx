import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/Sections';
import { requireCapability } from '@/lib/guard';
import { CAPABILITIES, listRoles } from '@/lib/rbac';
import { setRoleCapabilitiesAction } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function AdminRole({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireCapability('roles.manage', '/admin/roles');
  const { id } = await params;
  const { saved } = await searchParams;
  const role = listRoles().find((r) => r.id === Number(id));
  if (!role) notFound();
  const held = new Set(role.capabilities);

  const groups: Record<string, typeof CAPABILITIES> = {};
  for (const cap of CAPABILITIES) (groups[cap.grp] ??= []).push(cap);

  const GROUP_LABEL: Record<string, string> = {
    content: 'תוכן',
    labs: 'מעבדות',
    people: 'אנשים',
    system: 'מערכת',
  };

  return (
    <>
      <SiteHeader current="" />
      <main className="wrap page admin">
        <nav className="crumbs">
          <Link href="/admin">ניהול</Link>
          <span aria-hidden="true">›</span>
          <Link href="/admin/roles">תפקידים</Link>
          <span aria-hidden="true">›</span>
          <span>{role.name}</span>
        </nav>

        <header className="page-head">
          <p className="eyebrow"><span className="pip" aria-hidden="true" />{role.is_system ? 'תפקיד מערכת' : 'תפקיד מותאם'}</p>
          <h1>{role.name}</h1>
          <p className="lede">{role.description || 'ללא תיאור.'}</p>
          {saved && <p className="form-ok">נשמר.</p>}
        </header>

        <form action={setRoleCapabilitiesAction} className="admin-form">
          <input type="hidden" name="role_id" value={role.id} />
          {Object.entries(groups).map(([grp, caps]) => (
            <fieldset key={grp} className="cap-group">
              <legend>{GROUP_LABEL[grp] ?? grp}</legend>
              <div className="check-grid">
                {caps.map((c) => (
                  <label key={c.key} className="check">
                    <input type="checkbox" name="capability" value={c.key} defaultChecked={held.has(c.key)} />
                    <span>
                      <b>{c.label}</b>
                      <em dir="ltr">{c.key}</em>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <button className="btn lg" type="submit">שמירת הרשאות</button>
        </form>
      </main>
      <SiteFooter />
    </>
  );
}
