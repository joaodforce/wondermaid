import { headers } from 'next/headers';
import { getRedis } from './redis';

/**
 * Counts one hit for `id` in a fixed window and says whether it is still within `max`.
 * Without Redis (local development) or when Redis fails, everything is allowed.
 */
export async function hitRateLimit(bucket: string, id: string, max: number, windowSeconds: number): Promise<boolean> {
  try {
    const redis = getRedis();
    if (!redis) return true;
    const key = `ratelimit:${bucket}:${id}`;
    const hits = await redis.incr(key);
    if (hits === 1) await redis.expire(key, windowSeconds);
    return hits <= max;
  } catch (error) {
    console.error(`[rate-limit] ${bucket} check failed:`, error);
    return true;
  }
}

/**
 * The visitor's IP as the reverse proxy in front of the app reports it, or null when there is none.
 * Takes the last `X-Forwarded-For` entry: the one our own proxy appended, which the client can't forge.
 * Set `CLIENT_IP_HEADER` (e.g. `cf-connecting-ip`) when a proxy passes the IP in its own header instead.
 */
export async function clientIp(): Promise<string | null> {
  const list = await headers();
  const custom = process.env.CLIENT_IP_HEADER;
  const value = custom ? list.get(custom) : list.get('x-forwarded-for')?.split(',').at(-1);
  return value?.trim() || null;
}

/** Rate limit by visitor IP; allowed when the IP is unknown, since every visitor would otherwise share one bucket. */
export async function hitIpRateLimit(bucket: string, max: number, windowSeconds: number): Promise<boolean> {
  const ip = await clientIp();
  return ip ? hitRateLimit(bucket, ip, max, windowSeconds) : true;
}
