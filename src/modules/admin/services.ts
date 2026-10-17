import { getCurrentUser, type SessionUser } from '@/modules/auth/session';

// The only account that can open the admin tools. Usernames are unique and stored lowercase.
export const SUPER_ADMIN_USERNAME = 'joaodforce';

export const isSuperAdmin = (user: SessionUser | null): user is SessionUser => user?.username === SUPER_ADMIN_USERNAME;

/** The signed-in super admin, or null for everyone else. */
export async function getSuperAdmin(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  return isSuperAdmin(user) ? user : null;
}
