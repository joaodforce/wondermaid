'use server';

import { refresh } from 'next/cache';
import { ClaimError, cancelClaim, startClaim, unlinkAccount, verifyClaim } from '@/modules/accounts/services';
import { getCurrentUser } from '@/modules/auth/session';
import { EnkaError } from '@/modules/enka/types';
import { uidSchema } from '@/modules/leaderboard/validation';

export type AccountActionResult = { ok: true } | { ok: false; error: string };

async function withUser(uid: unknown, run: (userId: string, uid: string) => Promise<unknown>): Promise<AccountActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Log in first.' };
  const parsed = uidSchema.safeParse(uid);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  try {
    await run(user.id, parsed.data);
  } catch (error) {
    if (error instanceof ClaimError || error instanceof EnkaError) return { ok: false, error: error.message };
    console.error('[accounts] action failed:', error);
    return { ok: false, error: 'Something went wrong. Try again.' };
  }
  refresh();
  return { ok: true };
}

export async function startClaimAction(uid: string) {
  return withUser(uid, startClaim);
}

export async function verifyClaimAction(uid: string) {
  return withUser(uid, verifyClaim);
}

export async function cancelClaimAction(uid: string) {
  return withUser(uid, cancelClaim);
}

export async function unlinkAccountAction(uid: string) {
  return withUser(uid, unlinkAccount);
}
