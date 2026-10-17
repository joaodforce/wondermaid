import { and, asc, desc, eq, isNotNull, sql } from 'drizzle-orm';
import { db } from '@/db';
import { enkaProfiles, players, teamShowcases } from '@/db/schema';
import { ownsUid } from '@/modules/accounts/services';
import { fetchPlayerData } from '@/modules/enka/client';
import { parsePlayerProfile } from '@/modules/enka/mapper';
import { calculateTeam } from '@/modules/go/team';
import type { TeamCalculation } from '@/modules/go/types';
import { CHARACTER_NAMES, NOELLE_INFO, supportInfo } from './characters';
import { selectParty, type CharacterBuild, type TeamValidationError } from './party';

export class TeamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TeamError';
  }
}

const VALIDATION_MESSAGES: Record<Exclude<TeamValidationError, 'UNSUPPORTED'>, string> = {
  WRONG_SIZE: 'Pick exactly three teammates.',
  DUPLICATE: 'Pick three different teammates.',
  NOT_ALLOWED: "One of those characters isn't allowed in Team Showcase.",
  NOT_IN_SHOWCASE: "One of those characters isn't in your showcase anymore. Refresh and pick again.",
  NO_NOELLE: 'Noelle needs to be in your in-game character showcase.',
};

export interface ShowcaseCharacter {
  id: number;
  name: string | null;
  icon: string | null;
  rarity: 4 | 5 | null;
  level: number;
  constellation: number;
  allowed: boolean;
}

/** The characters in a verified UID's showcase, marked with whether each may join a Noelle team. */
export async function getShowcaseCharacters(
  userId: string,
  uid: string,
  { fresh = false } = {},
): Promise<{ characters: ShowcaseCharacter[]; hasNoelle: boolean }> {
  if (!(await ownsUid(userId, uid))) throw new TeamError('Verify this UID on your account page first.');
  const data = await fetchPlayerData(uid, { fresh });
  const avatars = data.avatarInfoList ?? [];
  return {
    hasNoelle: avatars.some((a) => a.avatarId === NOELLE_INFO.id),
    characters: avatars
      .filter((a) => a.avatarId !== NOELLE_INFO.id)
      .map((a) => {
        const info = supportInfo(a.avatarId);
        return {
          id: a.avatarId,
          name: info?.name ?? CHARACTER_NAMES[a.avatarId] ?? null,
          icon: info?.icon ?? null,
          rarity: info?.rarity ?? null,
          level: Number(a.propMap?.['4001']?.val) || 1,
          constellation: a.talentIdList?.length ?? 0,
          allowed: Boolean(info),
        };
      }),
  };
}

/** Builds the team from the owner's current showcase and ranks it. Throws `TeamError` or `EnkaError`. */
export async function submitTeam(userId: string, uid: string, teammateIds: number[]): Promise<{ rank: number; finalDamage: number }> {
  if (!(await ownsUid(userId, uid))) throw new TeamError('Verify this UID on your account page first.');
  const data = await fetchPlayerData(uid);
  const selection = selectParty(data.avatarInfoList ?? [], teammateIds);
  if ('error' in selection) {
    throw new TeamError(
      selection.error === 'UNSUPPORTED'
        ? `${selection.name}'s character or weapon isn't supported by the calculator yet. Try again after the next update.`
        : VALIDATION_MESSAGES[selection.error],
    );
  }

  const calculation = calculateTeam(selection.good);
  const profile = parsePlayerProfile(data, uid);
  const now = new Date();
  const row = {
    partyJson: selection.builds,
    goodJson: selection.good,
    finalDamage: calculation.finalDamage,
    calculationJson: calculation,
    submittedBy: userId,
    submittedAt: now,
  };

  await db.transaction(async (tx) => {
    await tx.update(players).set({ ...profile, updatedAt: now }).where(eq(players.uid, uid));
    await tx
      .insert(enkaProfiles)
      .values({ uid, responseJson: data, fetchedAt: now })
      .onConflictDoUpdate({ target: enkaProfiles.uid, set: { responseJson: data, fetchedAt: now } });
    await tx.insert(teamShowcases).values({ uid, ...row }).onConflictDoUpdate({ target: teamShowcases.uid, set: row });
  });

  const [{ rank }] = await db
    .select({ rank: sql<number>`count(*) + 1`.mapWith(Number) })
    .from(teamShowcases)
    .where(and(isNotNull(teamShowcases.calculationJson), sql`${teamShowcases.finalDamage} > ${calculation.finalDamage}`));
  return { rank, finalDamage: calculation.finalDamage };
}

export interface TeamShowcaseEntry {
  rank: number;
  uid: string;
  nickname: string;
  party: CharacterBuild[];
  calculation: TeamCalculation;
  finalDamage: number;
  submittedAt: string;
}

const entryColumns = {
  uid: teamShowcases.uid,
  nickname: players.nickname,
  party: teamShowcases.partyJson,
  calculation: teamShowcases.calculationJson,
  finalDamage: teamShowcases.finalDamage,
  submittedAt: teamShowcases.submittedAt,
};

export async function getTeamLeaderboard(limit = 100): Promise<TeamShowcaseEntry[]> {
  const rows = await db
    .select(entryColumns)
    .from(teamShowcases)
    .innerJoin(players, eq(players.uid, teamShowcases.uid))
    .where(isNotNull(teamShowcases.calculationJson))
    .orderBy(desc(teamShowcases.finalDamage), asc(teamShowcases.submittedAt))
    .limit(limit);

  return rows.map((row, index) => ({
    ...row,
    calculation: row.calculation!,
    rank: index + 1,
    submittedAt: row.submittedAt.toISOString(),
  }));
}

/** One Team Showcase entry with its full calculation, for its breakdown page. */
export async function getTeamShowcase(uid: string): Promise<TeamShowcaseEntry | null> {
  const [row] = await db
    .select(entryColumns)
    .from(teamShowcases)
    .innerJoin(players, eq(players.uid, teamShowcases.uid))
    .where(and(eq(teamShowcases.uid, uid), isNotNull(teamShowcases.calculationJson)))
    .limit(1);
  if (!row) return null;

  const [{ rank }] = await db
    .select({ rank: sql<number>`count(*) + 1`.mapWith(Number) })
    .from(teamShowcases)
    .where(and(isNotNull(teamShowcases.calculationJson), sql`${teamShowcases.finalDamage} > ${row.finalDamage}`));
  return { ...row, calculation: row.calculation!, rank, submittedAt: row.submittedAt.toISOString() };
}

/**
 * Recomputes every entry from its stored builds, e.g. after a calculator change. Entries from before
 * the Genshin Optimizer engine get their builds rebuilt from the Enka profile stored when they were submitted.
 */
export async function recalculateTeamShowcases(): Promise<{ updated: number; skipped: number }> {
  const rows = await db
    .select({
      uid: teamShowcases.uid,
      party: teamShowcases.partyJson,
      good: teamShowcases.goodJson,
      profile: enkaProfiles.responseJson,
    })
    .from(teamShowcases)
    .leftJoin(enkaProfiles, eq(enkaProfiles.uid, teamShowcases.uid));

  let updated = 0;
  for (const row of rows) {
    let good = row.good;
    if (!good) {
      const selection = selectParty(row.profile?.avatarInfoList ?? [], row.party.slice(1).map((member) => member.id));
      if ('error' in selection) {
        console.warn(`[team] can't rebuild Team Showcase ${row.uid} (${selection.error}); it stays hidden until resubmitted`);
        continue;
      }
      good = selection.good;
    }
    const calculation = calculateTeam(good);
    await db
      .update(teamShowcases)
      .set({ goodJson: good, finalDamage: calculation.finalDamage, calculationJson: calculation })
      .where(eq(teamShowcases.uid, row.uid));
    updated++;
  }
  return { updated, skipped: rows.length - updated };
}
