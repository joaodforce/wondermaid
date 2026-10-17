import { createHash, randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { db } from '@/db';
import { sessions, users } from '@/db/schema';

export const SESSION_COOKIE_NAME = 'wm_session';

const SESSION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
// Sessions used within the last half of their life are extended, so active users stay signed in
const RENEW_WITHIN_MS = (SESSION_DAYS / 2) * DAY_MS;

export interface SessionUser {
  id: string;
  username: string;
}

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

async function writeCookie(token: string, expiresAt: Date) {
  (await cookies()).set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

// Cookies can only be written from Server Actions and Route Handlers; during a page render the write is skipped
async function tryWriteCookie(token: string, expiresAt: Date) {
  try {
    await writeCookie(token, expiresAt);
  } catch {}
}

/** Starts a session and sets its cookie. Call from a Server Action. */
export async function startSession(userId: string): Promise<void> {
  const token = randomBytes(20).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY_MS);
  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt });
  await writeCookie(token, expiresAt);
}

/** Ends the current session and clears its cookie. Call from a Server Action. */
export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
  jar.delete(SESSION_COOKIE_NAME);
}

/** The signed-in user, or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const id = hashToken(token);
  const [row] = await db
    .select({ userId: users.id, username: users.username, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, id))
    .limit(1);
  if (!row) return null;

  const now = Date.now();
  if (row.expiresAt.getTime() <= now) {
    await db.delete(sessions).where(eq(sessions.id, id));
    return null;
  }
  if (row.expiresAt.getTime() - now < RENEW_WITHIN_MS) {
    const expiresAt = new Date(now + SESSION_DAYS * DAY_MS);
    await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, id));
    await tryWriteCookie(token, expiresAt);
  }
  return { id: row.userId, username: row.username };
});
