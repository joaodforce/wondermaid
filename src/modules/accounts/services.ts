import { randomInt } from 'node:crypto';
import { and, asc, eq, gt } from 'drizzle-orm';
import { db } from '@/db';
import { getRedis } from '@/lib/redis';
import { accountClaims, players } from '@/db/schema';
import { fetchPlayerData } from '@/modules/enka/client';
import { parsePlayerProfile } from '@/modules/enka/mapper';

const CLAIM_MINUTES = 60;
// Each Verify asks Enka for fresh data, so space attempts out to stay within its rate limits
const VERIFY_COOLDOWN_SECONDS = 15;

export type ClaimErrorCode = 'ALREADY_OWNED' | 'NO_CLAIM' | 'CODE_NOT_FOUND' | 'TOO_SOON';

export class ClaimError extends Error {
  constructor(
    public readonly code: ClaimErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ClaimError';
  }
}

export interface PendingClaim {
  uid: string;
  code: string;
  expiresAt: string;
}

export interface LinkedAccount {
  uid: string;
  nickname: string;
  verifiedAt: string | null;
}

// "WM-" makes the code easy to spot in a bio and unlikely to be there by accident
const newCode = () => `WM-${randomInt(0, 1_000_000).toString().padStart(6, '0')}`;

/** Starts (or resumes) a claim. An unexpired code is reused so a bio that already has it keeps working. */
export async function startClaim(userId: string, uid: string): Promise<PendingClaim> {
  const [owned] = await db
    .select({ owner: players.ownerUserId })
    .from(players)
    .where(eq(players.uid, uid))
    .limit(1);
  if (owned?.owner === userId) throw new ClaimError('ALREADY_OWNED', 'This UID is already linked to your account.');

  const [existing] = await db
    .select()
    .from(accountClaims)
    .where(and(eq(accountClaims.userId, userId), eq(accountClaims.uid, uid), gt(accountClaims.expiresAt, new Date())))
    .limit(1);
  if (existing) return { uid, code: existing.code, expiresAt: existing.expiresAt.toISOString() };

  const claim = { userId, uid, code: newCode(), expiresAt: new Date(Date.now() + CLAIM_MINUTES * 60_000) };
  await db
    .insert(accountClaims)
    .values(claim)
    .onConflictDoUpdate({
      target: [accountClaims.userId, accountClaims.uid],
      set: { code: claim.code, expiresAt: claim.expiresAt, createdAt: new Date() },
    });
  return { uid, code: claim.code, expiresAt: claim.expiresAt.toISOString() };
}

/**
 * Looks for the claim code in the UID's in-game bio. On a match the UID is linked to the user, taking it
 * over from any previous owner: whoever can edit the bio owns the game account. Throws `ClaimError` or `EnkaError`.
 */
export async function verifyClaim(userId: string, uid: string): Promise<void> {
  const [claim] = await db
    .select()
    .from(accountClaims)
    .where(and(eq(accountClaims.userId, userId), eq(accountClaims.uid, uid), gt(accountClaims.expiresAt, new Date())))
    .limit(1);
  if (!claim) throw new ClaimError('NO_CLAIM', 'This claim has expired. Start again to get a new code.');

  const allowed = await getRedis()
    ?.set(`claims:verify:${userId}:${uid}`, 1, { nx: true, ex: VERIFY_COOLDOWN_SECONDS })
    .catch(() => 'OK');
  if (allowed === null) throw new ClaimError('TOO_SOON', 'Give it a few seconds before verifying again.');

  const data = await fetchPlayerData(uid, { fresh: true });
  const bio = data.playerInfo?.signature ?? '';
  if (!bio.toUpperCase().includes(claim.code)) {
    throw new ClaimError(
      'CODE_NOT_FOUND',
      `Your bio doesn't contain ${claim.code} yet. Enka can take a few minutes to see a new bio, so try again shortly.`,
    );
  }

  const profile = parsePlayerProfile(data, uid);
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .insert(players)
      .values({ uid, ...profile, ownerUserId: userId, verifiedAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: players.uid,
        set: { ...profile, ownerUserId: userId, verifiedAt: now, updatedAt: now },
      });
    await tx.delete(accountClaims).where(eq(accountClaims.uid, uid));
  });
}

export async function unlinkAccount(userId: string, uid: string): Promise<void> {
  await db
    .update(players)
    .set({ ownerUserId: null, verifiedAt: null })
    .where(and(eq(players.uid, uid), eq(players.ownerUserId, userId)));
}

export async function cancelClaim(userId: string, uid: string): Promise<void> {
  await db.delete(accountClaims).where(and(eq(accountClaims.userId, userId), eq(accountClaims.uid, uid)));
}

export async function getAccountOverview(userId: string): Promise<{ linked: LinkedAccount[]; pending: PendingClaim[] }> {
  const [linked, pending] = await Promise.all([
    db
      .select({ uid: players.uid, nickname: players.nickname, verifiedAt: players.verifiedAt })
      .from(players)
      .where(eq(players.ownerUserId, userId))
      .orderBy(asc(players.verifiedAt)),
    db
      .select({ uid: accountClaims.uid, code: accountClaims.code, expiresAt: accountClaims.expiresAt })
      .from(accountClaims)
      .where(and(eq(accountClaims.userId, userId), gt(accountClaims.expiresAt, new Date())))
      .orderBy(asc(accountClaims.createdAt)),
  ]);
  return {
    linked: linked.map((row) => ({ ...row, verifiedAt: row.verifiedAt?.toISOString() ?? null })),
    pending: pending.map((row) => ({ ...row, expiresAt: row.expiresAt.toISOString() })),
  };
}

/** Whether the user has verified ownership of the UID */
export async function ownsUid(userId: string, uid: string): Promise<boolean> {
  const [row] = await db
    .select({ uid: players.uid })
    .from(players)
    .where(and(eq(players.uid, uid), eq(players.ownerUserId, userId)))
    .limit(1);
  return Boolean(row);
}
