import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { clearLoginFailures, isLoginLocked, recordLoginFailure } from './rate-limit';

const BCRYPT_ROUNDS = 12;
// Compared against when the username doesn't exist, so response times don't reveal which usernames are taken
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('wondermaid-dummy-password', BCRYPT_ROUNDS);

export type AuthErrorCode = 'USERNAME_TAKEN' | 'INVALID_CREDENTIALS' | 'TOO_MANY_ATTEMPTS';

export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  USERNAME_TAKEN: 'That username is already taken',
  INVALID_CREDENTIALS: 'Wrong username or password',
  TOO_MANY_ATTEMPTS: 'Too many failed attempts. Try again in 15 minutes.',
};

export class AuthError extends Error {
  constructor(public readonly code: AuthErrorCode) {
    super(AUTH_ERROR_MESSAGES[code]);
    this.name = 'AuthError';
  }
}

export async function registerUser(username: string, password: string): Promise<{ id: string }> {
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const [user] = await db
    .insert(users)
    .values({ username, passwordHash })
    .onConflictDoNothing({ target: users.username })
    .returning({ id: users.id });
  if (!user) throw new AuthError('USERNAME_TAKEN');
  return user;
}

export async function loginUser(username: string, password: string): Promise<{ id: string }> {
  if (await isLoginLocked(username)) throw new AuthError('TOO_MANY_ATTEMPTS');

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
  if (!user || !valid) {
    await recordLoginFailure(username);
    throw new AuthError('INVALID_CREDENTIALS');
  }
  await clearLoginFailures(username);
  return { id: user.id };
}
