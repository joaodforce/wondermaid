import { Redis } from '@upstash/redis';

let redis: Redis | null | undefined;

// Redis is optional so the app also runs without Upstash credentials: callers treat null as "no cache"
export function getRedis(): Redis | null {
  if (redis === undefined) {
    const { UPSTASH_REDIS_REST_URL: url, UPSTASH_REDIS_REST_TOKEN: token } = process.env;
    redis = url && token ? new Redis({ url, token }) : null;
    if (!redis) console.warn('[redis] Upstash Redis is not configured; caching and rate limits are disabled');
  }
  return redis;
}
