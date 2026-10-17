import { getRedis } from '@/lib/redis';

const WINDOW_SECONDS = 15 * 60;
const MAX_FAILURES = 10;

const key = (username: string) => `auth:login-failures:${username}`;

// Failed logins per username in a 15 minute window. Without Redis the limit is off (local development).
export async function isLoginLocked(username: string): Promise<boolean> {
  try {
    const failures = await getRedis()?.get<number>(key(username));
    return (failures ?? 0) >= MAX_FAILURES;
  } catch (error) {
    console.error('[auth] rate limit read failed:', error);
    return false;
  }
}

export async function recordLoginFailure(username: string): Promise<void> {
  try {
    const redis = getRedis();
    if (!redis) return;
    const failures = await redis.incr(key(username));
    if (failures === 1) await redis.expire(key(username), WINDOW_SECONDS);
  } catch (error) {
    console.error('[auth] rate limit write failed:', error);
  }
}

export async function clearLoginFailures(username: string): Promise<void> {
  try {
    await getRedis()?.del(key(username));
  } catch {}
}
