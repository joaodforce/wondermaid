'use server';

import { z } from 'zod';
import { getCurrentUser } from '@/modules/auth/session';
import { EnkaError } from '@/modules/enka/types';
import { uidSchema } from '@/modules/leaderboard/validation';
import { submitTeam, TeamError } from '@/modules/team/services';

const submitSchema = z.object({ uid: uidSchema, teammateIds: z.array(z.number().int().positive()).length(3) });

export type SubmitTeamResult = { ok: true; rank: number; finalDamage: number } | { ok: false; error: string };

export async function submitTeamAction(uid: string, teammateIds: number[]): Promise<SubmitTeamResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Log in first.' };
  const parsed = submitSchema.safeParse({ uid, teammateIds });
  if (!parsed.success) return { ok: false, error: 'Pick three teammates.' };

  try {
    return { ok: true, ...(await submitTeam(user.id, parsed.data.uid, parsed.data.teammateIds)) };
  } catch (error) {
    if (error instanceof TeamError || error instanceof EnkaError) return { ok: false, error: error.message };
    console.error('[team] submit failed:', error);
    return { ok: false, error: 'Something went wrong. Try again.' };
  }
}
