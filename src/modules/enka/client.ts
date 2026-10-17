import { getRedis } from '@/lib/redis';
import { EnkaError, type EnkaErrorCode, type EnkaResponse } from './types';

// Overridable to point PRE or local runs at a mock showcase server
const ENKA_API_URL = process.env.ENKA_API_URL || 'https://enka.network/api/uid';
const USER_AGENT = 'NoelleMainsLeaderboard/1.0';
// Enka asks clients to cache showcase data instead of re-requesting it; this also absorbs repeat submissions
const CACHE_TTL_SECONDS = 300;
const REQUEST_TIMEOUT_MS = 10_000;

const STATUS_ERRORS: Record<number, [EnkaErrorCode, string]> = {
  400: ['INVALID_UID', 'That UID is not valid.'],
  404: ['PLAYER_NOT_FOUND', 'No player was found with that UID.'],
  424: ['MAINTENANCE', 'Enka.Network is unavailable during game maintenance. Try again later.'],
  429: ['RATE_LIMITED', 'Enka.Network is rate limiting requests. Try again in a minute.'],
};

const cacheKey = (uid: string) => `enka:uid:${uid}`;

async function readCache(uid: string): Promise<EnkaResponse | null> {
  try {
    return (await getRedis()?.get<EnkaResponse>(cacheKey(uid))) ?? null;
  } catch (error) {
    console.error('[enka] cache read failed:', error);
    return null;
  }
}

async function writeCache(uid: string, data: EnkaResponse) {
  try {
    await getRedis()?.set(cacheKey(uid), data, { ex: CACHE_TTL_SECONDS });
  } catch (error) {
    console.error('[enka] cache write failed:', error);
  }
}

/** Showcase data for a UID, served from Redis for 5 minutes after each Enka request. Throws `EnkaError`. */
// `fresh` skips our cache (Enka may still serve its own copy until its `ttl` runs out), e.g. to see a just-edited bio
export async function fetchPlayerData(uid: string, { fresh = false } = {}): Promise<EnkaResponse> {
  const cached = fresh ? null : await readCache(uid);
  if (cached) return cached;

  let data: EnkaResponse;
  try {
    const response = await fetch(`${ENKA_API_URL}/${uid}`, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      const [code, message] = STATUS_ERRORS[response.status] ?? [
        'UNAVAILABLE',
        `Enka.Network returned an error (${response.status}). Try again later.`,
      ];
      throw new EnkaError(code, message);
    }
    data = await response.json();
  } catch (error) {
    if (error instanceof EnkaError) throw error;
    console.error(`[enka] request for UID ${uid} failed:`, error);
    throw new EnkaError('UNAVAILABLE', 'Could not reach Enka.Network. Try again later.');
  }

  await writeCache(uid, data);
  return data;
}
