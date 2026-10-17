'use server';

import { getSuperAdmin } from '@/modules/admin/services';
import { EnkaError, type EnkaErrorCode } from '@/modules/enka/types';
import { updatePlayerFromEnka } from '@/modules/leaderboard/services';
import { uidSchema } from '@/modules/leaderboard/validation';

export type ImportUidResult =
  | { ok: true; nickname: string; finalDamage: number }
  | { ok: false; error: string; code?: EnkaErrorCode };

/** Imports one UID into the leaderboard. Super admin only; the import screen calls it once per UID. */
export async function importUidAction(uid: string): Promise<ImportUidResult> {
  if (!(await getSuperAdmin())) return { ok: false, error: 'Not allowed.' };
  const parsed = uidSchema.safeParse(uid);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  try {
    const { nickname, results } = await updatePlayerFromEnka(parsed.data);
    return { ok: true, nickname, finalDamage: Math.max(0, ...results.map((r) => r.finalDamage)) };
  } catch (error) {
    if (error instanceof EnkaError) return { ok: false, error: error.message, code: error.code };
    console.error(`[admin] import of UID ${parsed.data} failed:`, error);
    return { ok: false, error: 'Unexpected error, see the server logs.' };
  }
}
