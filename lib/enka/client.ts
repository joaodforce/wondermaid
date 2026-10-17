import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const ENKA_API_URL = 'https://enka.network/api/uid';
const NOELLE_CHAR_ID = 10000034;

// Define base interfaces for TypeScript type safety
export interface EnkaResponse {
  playerInfo: {
    nickname: string;
    profilePicture?: { avatarId: number };
  };
  avatarInfoList?: EnkaAvatar[];
}

export interface EnkaAvatar {
  avatarId: number;
  propMap: Record<string, any>;
  fightPropMap: Record<string, number>;
  equipList: any[];
  skillLevelMap: Record<string, number>;
}

export async function fetchPlayerData(uid: string): Promise<EnkaResponse | null> {
  const cacheKey = `enka_uid_${uid}`;
  
  // 1. Check Redis Cache
  const cachedData = await redis.get<EnkaResponse>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // 2. Fetch from Enka API
  try {
    const response = await fetch(`${ENKA_API_URL}/${uid}`, {
      headers: { 
        'User-Agent': 'NoelleMainsLeaderboard/1.0',
        'Accept': 'application/json'
      },
      // Next.js specific fetch caching bypass, we rely on Upstash
      cache: 'no-store' 
    });

    if (!response.ok) {
      if (response.status === 400) throw new Error('Invalid UID format');
      if (response.status === 404) throw new Error('Player not found or profile hidden');
      if (response.status === 429) throw new Error('Enka API rate limit exceeded');
      throw new Error(`Enka API Error: ${response.status}`);
    }

    const data: EnkaResponse = await response.json();

    // 3. Save to Cache (300 seconds = 5 minutes)
    await redis.set(cacheKey, data, { ex: 300 });

    return data;
  } catch (error) {
    console.error(`Failed to fetch Enka data for UID ${uid}:`, error);
    return null;
  }
}

export function extractNoelleData(data: EnkaResponse): EnkaAvatar | null {
  if (!data.avatarInfoList) return null;
  return data.avatarInfoList.find((avatar) => avatar.avatarId === NOELLE_CHAR_ID) || null;
}