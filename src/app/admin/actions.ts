'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { assertCapability } from '@/lib/guard';
import { CAPABILITY_KEYS } from '@/lib/rbac';
import { reviewDecision as review } from '@/lib/studio';

function audit(actorId: number, action: string, subject: string, detail = '') {
  db()
    .prepare(
      `INSERT INTO audit_log (actor_user_id, action, subject, detail, ip, created_at)
       VALUES (?, ?, ?, ?, '', ?)`,
    )
    .run(actorId, action, subject, detail, new Date().toISOString());
}

async function actor(capability: string) {
  const user = await currentUser();
  if (!user) redirect('/login');
  assertCapability(user!, capability);
  return user!;
}

/* ---------------- people ---------------- */

export async function setUserRolesAction(formData: FormData) {
  const me = await actor('users.manage');
  const userId = Number(formData.get('user_id'));
  const roleIds = formData.getAll('role').map(Number).filter(Boolean);

  const d = db();
  d.prepare('DELETE FROM user_roles WHERE user_id = ?').run(userId);
  const now = new Date().toISOString();
  for (const roleId of roleIds) {
    d.prepare(
      'INSERT INTO user_roles (user_id, role_id, granted_by, created_at) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING',
    ).run(userId, roleId, me.id, now);
  }
  audit(me.id, 'user.roles', String(userId), roleIds.join(','));
  revalidatePath(`/admin/users/${userId}`);
  redirect(`/admin/users/${userId}?saved=roles`);
}

export async function setUserCapabilityAction(formData: FormData) {
  const me = await actor('users.manage');
  const userId = Number(formData.get('user_id'));
  const capability = String(formData.get('capability'));
  const mode = String(formData.get('mode')); // default | allow | deny
  if (!CAPABILITY_KEYS.has(capability)) throw new Error('unknown capability');

  const d = db();
  if (mode === 'default') {
    d.prepare('DELETE FROM user_capabilities WHERE user_id = ? AND capability = ?').run(userId, capability);
  } else {
    d.prepare(
      `INSERT INTO user_capabilities (user_id, capability, allow, granted_by, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id, capability) DO UPDATE SET allow = excluded.allow, granted_by = excluded.granted_by`,
    ).run(userId, capability, mode === 'allow' ? 1 : 0, me.id, new Date().toISOString());
  }
  audit(me.id, 'user.capability', `${userId}:${capability}`, mode);
  revalidatePath(`/admin/users/${userId}`);
  redirect(`/admin/users/${userId}?saved=permissions`);
}

export async function grantEntitlementAction(formData: FormData) {
  const me = await actor('users.manage');
  const userId = Number(formData.get('user_id'));
  const subject = String(formData.get('subject') ?? '').trim() || 'all';
  const days = Number(formData.get('days') ?? 0);
  const now = new Date();
  const ends = days > 0 ? new Date(now.getTime() + days * 864e5).toISOString() : null;
  db()
    .prepare(
      `INSERT INTO entitlements (user_id, subject, source, starts_at, ends_at)
       VALUES (?, ?, 'admin', ?, ?)`,
    )
    .run(userId, subject, now.toISOString(), ends);
  audit(me.id, 'user.grant', `${userId}:${subject}`, days ? `${days}d` : 'forever');
  revalidatePath(`/admin/users/${userId}`);
  redirect(`/admin/users/${userId}?saved=access`);
}

export async function revokeEntitlementAction(formData: FormData) {
  const me = await actor('users.manage');
  const id = Number(formData.get('entitlement_id'));
  const userId = Number(formData.get('user_id'));
  db().prepare('UPDATE entitlements SET revoked_at = ? WHERE id = ?').run(new Date().toISOString(), id);
  audit(me.id, 'user.revoke', String(userId), String(id));
  revalidatePath(`/admin/users/${userId}`);
  redirect(`/admin/users/${userId}?saved=access`);
}

/* ---------------- roles ---------------- */

export async function createRoleAction(formData: FormData) {
  const me = await actor('roles.manage');
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\u05d0-\u05ea]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || `role-${Math.random().toString(36).slice(2, 6)}`;
  if (!name) redirect('/admin/roles?error=name');
  db()
    .prepare('INSERT INTO roles (slug, name, description, is_system, created_at) VALUES (?, ?, ?, 0, ?)')
    .run(slug, name, description, new Date().toISOString());
  audit(me.id, 'role.create', slug, name);
  revalidatePath('/admin/roles');
  redirect('/admin/roles?saved=1');
}

export async function setRoleCapabilitiesAction(formData: FormData) {
  const me = await actor('roles.manage');
  const roleId = Number(formData.get('role_id'));
  const caps = formData.getAll('capability').map(String).filter((c) => CAPABILITY_KEYS.has(c));
  const d = db();
  d.prepare('DELETE FROM role_capabilities WHERE role_id = ?').run(roleId);
  for (const cap of caps) {
    d.prepare('INSERT INTO role_capabilities (role_id, capability) VALUES (?, ?) ON CONFLICT DO NOTHING').run(roleId, cap);
  }
  audit(me.id, 'role.capabilities', String(roleId), caps.join(','));
  revalidatePath(`/admin/roles/${roleId}`);
  redirect(`/admin/roles/${roleId}?saved=1`);
}

/* ---------------- moderation ---------------- */

export async function reviewDecisionAction(formData: FormData) {
  const me = await actor('content.review');
  const queueId = Number(formData.get('queue_id'));
  const approve = String(formData.get('decision')) === 'approve';
  const note = String(formData.get('note') ?? '').trim();
  review({ queueId, approve, note, reviewerId: me.id, reviewerName: me.name });
  audit(me.id, approve ? 'content.approve' : 'content.changes', String(queueId), note);
  revalidatePath('/admin/review');
  revalidatePath('/admin');
  redirect('/admin/review?saved=1');
}
