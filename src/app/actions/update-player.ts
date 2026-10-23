'use server';

import { hitIpRateLimit } from '@/lib/rate-limit';
import { EnkaError } from '@/modules/enka/types';
import { updatePlayerFromEnka } from '@/modules/leaderboard/services';
import type { UpdatePlayerResult } from '@/modules/leaderboard/types';
import { uidSchema } from '@/modules/leaderboard/validation';

// Updates per visitor IP each minute, so one visitor can't use us to flood Enka with new UIDs
const UPDATES_PER_MINUTE = 10;

// Public by design: anyone can submit any UID, and Enka responses are cached so repeats are cheap
export async function processPlayerUpdate(uid: string): Promise<UpdatePlayerResult> {
  const parsed = uidSchema.safeParse(uid);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  if (!(await hitIpRateLimit('player-update', UPDATES_PER_MINUTE, 60))) {
    return { success: false, error: 'Too many updates from your network. Wait a minute and try again.' };
  }

  try {
    const { nickname, results } = await updatePlayerFromEnka(parsed.data);
    return { success: true, uid: parsed.data, nickname, results };
  } catch (error) {
    if (error instanceof EnkaError) return { success: false, error: error.message };
    console.error(`[leaderboard] update for UID ${parsed.data} failed:`, error);
    return { success: false, error: 'Something went wrong while saving your build. Try again later.' };
  }
}
