import { asc, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { enkaProfiles, players, teamShowcases } from '@/db/schema';
import { calculateNoelleDamage, explainNoelleDamage, type DamageExplanation } from '@/modules/calculator/noelle';
import type { DamageBreakdown } from '@/modules/calculator/types';
import { ownsUid } from '@/modules/accounts/services';
import { fetchPlayerData } from '@/modules/enka/client';
import { parsePlayerProfile } from '@/modules/enka/mapper';
import { CHARACTER_NAMES, NOELLE_INFO, supportInfo } from './characters';
import { selectParty, teamScenario, type CharacterBuild, type TeamValidationError, type TeammateEffect } from './party';

export class TeamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TeamError';
  }
}

const VALIDATION_MESSAGES: Record<TeamValidationError, string> = {
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

function evaluate(noelle: Parameters<typeof calculateNoelleDamage>[0], party: CharacterBuild[]) {
  const [noelleBuild, ...teammates] = party;
  const { scenario, effects } = teamScenario(noelleBuild, teammates);
  return { scenario, effects, breakdown: calculateNoelleDamage(noelle, scenario) };
}

/** Builds the team from the owner's current showcase and ranks it. Throws `TeamError` or `EnkaError`. */
export async function submitTeam(userId: string, uid: string, teammateIds: number[]): Promise<{ rank: number; finalDamage: number }> {
  if (!(await ownsUid(userId, uid))) throw new TeamError('Verify this UID on your account page first.');
  const data = await fetchPlayerData(uid);
  const selection = selectParty(data.avatarInfoList ?? [], teammateIds);
  if ('error' in selection) throw new TeamError(VALIDATION_MESSAGES[selection.error]);

  const party = [selection.noelleBuild, ...selection.teammates];
  const { breakdown } = evaluate(selection.noelle, party);
  const profile = parsePlayerProfile(data, uid);
  const now = new Date();
  const row = {
    noelleJson: selection.noelle,
    partyJson: party,
    finalDamage: breakdown.finalDamage,
    breakdownJson: breakdown,
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
    .where(sql`${teamShowcases.finalDamage} > ${breakdown.finalDamage}`);
  return { rank, finalDamage: breakdown.finalDamage };
}

export interface TeamShowcaseEntry {
  rank: number;
  uid: string;
  nickname: string;
  party: CharacterBuild[];
  effects: TeammateEffect[];
  attackType: string;
  breakdown: DamageBreakdown;
  finalDamage: number;
  submittedAt: string;
}

export async function getTeamLeaderboard(limit = 100): Promise<TeamShowcaseEntry[]> {
  const rows = await db
    .select({
      uid: teamShowcases.uid,
      nickname: players.nickname,
      party: teamShowcases.partyJson,
      breakdown: teamShowcases.breakdownJson,
      finalDamage: teamShowcases.finalDamage,
      submittedAt: teamShowcases.submittedAt,
    })
    .from(teamShowcases)
    .innerJoin(players, eq(players.uid, teamShowcases.uid))
    .orderBy(desc(teamShowcases.finalDamage), asc(teamShowcases.submittedAt))
    .limit(limit);

  return rows.map((row, index) => {
    const [noelle, ...teammates] = row.party;
    const { scenario, effects } = teamScenario(noelle, teammates);
    return {
      ...row,
      rank: index + 1,
      effects,
      attackType: scenario.attackType,
      submittedAt: row.submittedAt.toISOString(),
    };
  });
}

/** A Team Showcase entry worked out step by step, for its breakdown page. */
export async function getTeamExplanation(
  uid: string,
): Promise<{ uid: string; nickname: string; party: CharacterBuild[]; effects: TeammateEffect[]; explanation: DamageExplanation; submittedAt: string } | null> {
  const [row] = await db
    .select({
      nickname: players.nickname,
      noelle: teamShowcases.noelleJson,
      party: teamShowcases.partyJson,
      submittedAt: teamShowcases.submittedAt,
    })
    .from(teamShowcases)
    .innerJoin(players, eq(players.uid, teamShowcases.uid))
    .where(eq(teamShowcases.uid, uid))
    .limit(1);
  if (!row) return null;

  const [noelle, ...teammates] = row.party;
  const { scenario, effects } = teamScenario(noelle, teammates);
  return {
    uid,
    nickname: row.nickname,
    party: row.party,
    effects,
    explanation: explainNoelleDamage(row.noelle, scenario),
    submittedAt: row.submittedAt.toISOString(),
  };
}

/** Recomputes every entry from its stored builds, e.g. after a calculator change. */
export async function recalculateTeamShowcases(): Promise<number> {
  const rows = await db
    .select({ uid: teamShowcases.uid, noelle: teamShowcases.noelleJson, party: teamShowcases.partyJson })
    .from(teamShowcases);
  for (const row of rows) {
    const { breakdown } = evaluate(row.noelle, row.party);
    await db
      .update(teamShowcases)
      .set({ finalDamage: breakdown.finalDamage, breakdownJson: breakdown })
      .where(eq(teamShowcases.uid, row.uid));
  }
  return rows.length;
}
