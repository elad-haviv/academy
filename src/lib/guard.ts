import 'server-only';
import { redirect } from 'next/navigation';
import { currentUser, type User } from './auth';
import { can, capabilitiesFor } from './rbac';

/** Server-side guards. Every admin/studio page and action starts with one. */

export async function requireUser(next = '/dashboard'): Promise<User> {
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireCapability(capability: string, next = '/'): Promise<User> {
  const user = await requireUser(next);
  if (!can(user, capability)) redirect('/403');
  return user;
}

export async function requireAnyCapability(capabilities: string[], next = '/'): Promise<User> {
  const user = await requireUser(next);
  const held = capabilitiesFor(user.id);
  if (!capabilities.some((c) => held.has(c))) redirect('/403');
  return user;
}

/** For actions: throw instead of redirecting, so a POST cannot silently pass. */
export function assertCapability(user: User, capability: string) {
  if (!can(user, capability)) throw new Error(`forbidden: ${capability}`);
}
