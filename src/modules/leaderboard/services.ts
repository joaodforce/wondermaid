import { and, asc, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import { db } from '@/db';
import { leaderboardRanks, noelleBuilds, players, scenarios } from '@/db/schema';
import { calculateNoelleDamage } from '@/modules/calculator/noelle';
import type { NoelleBuild } from '@/modules/calculator/types';
import { fetchPlayerData } from '@/modules/enka/client';
import { findNoelle, parseNoelleBuild, parsePlayerProfile } from '@/modules/enka/mapper';
import { listActiveScenarios, toScenario, toScenarioSummary } from './scenarios';
import type { LeaderboardEntry, LeaderboardResponse, ScenarioResult } from './types';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type LeaderboardErrorCode = 'SCENARIO_NOT_FOUND';

export class LeaderboardError extends Error {
  constructor(
    public readonly code: LeaderboardErrorCode,
    message: string = code,
  ) {
    super(message);
    this.name = 'LeaderboardError';
  }
}

const artifactSetIds = (build: NoelleBuild) =>
  Object.entries(build.artifactSets)
    .filter(([, count]) => count >= 2)
    .map(([setId]) => Number(setId));

// `keepUpdatedAt` leaves the timestamp (and so the tie-break order) alone when only the math changed
async function upsertRanks(
  executor: Tx | typeof db,
  rows: (typeof leaderboardRanks.$inferInsert)[],
  { keepUpdatedAt = false } = {},
) {
  if (!rows.length) return;
  await executor
    .insert(leaderboardRanks)
    .values(rows)
    .onConflictDoUpdate({
      target: [leaderboardRanks.uid, leaderboardRanks.scenarioId],
      set: {
        buildId: sql`excluded.build_id`,
        finalDamage: sql`excluded.final_damage`,
        breakdownJson: sql`excluded.breakdown_json`,
        ...(!keepUpdatedAt && { updatedAt: sql`excluded.updated_at` }),
      },
    });
}

/** Position of a player on each scenario's board. */
async function getPlayerRanks(uid: string, scenarioIds: string[]) {
  if (!scenarioIds.length) return [];
  const ranked = db
    .select({
      uid: leaderboardRanks.uid,
      scenarioId: leaderboardRanks.scenarioId,
      rank: sql<number>`rank() over (partition by ${leaderboardRanks.scenarioId} order by ${leaderboardRanks.finalDamage} desc)`
        .mapWith(Number)
        .as('rank'),
      total: sql<number>`count(*) over (partition by ${leaderboardRanks.scenarioId})`.mapWith(Number).as('total'),
    })
    .from(leaderboardRanks)
    .where(inArray(leaderboardRanks.scenarioId, scenarioIds))
    .as('ranked');
  return db.select().from(ranked).where(eq(ranked.uid, uid));
}

/**
 * Fetches a player's showcase from Enka, stores Noelle's build and recalculates their rank on every
 * active scenario. Throws `EnkaError` when the showcase can't be used.
 */
export async function updatePlayerFromEnka(uid: string): Promise<{ nickname: string; results: ScenarioResult[] }> {
  const data = await fetchPlayerData(uid);
  const build = parseNoelleBuild(findNoelle(data));
  const profile = parsePlayerProfile(data, uid);

  const activeScenarios = await listActiveScenarios();
  const calculated = activeScenarios.map((scenario) => ({
    scenario,
    breakdown: calculateNoelleDamage(build, toScenario(scenario)),
  }));

  await db.transaction(async (tx) => {
    const now = new Date();
    await tx
      .insert(players)
      .values({ uid, ...profile, updatedAt: now })
      .onConflictDoUpdate({ target: players.uid, set: { ...profile, updatedAt: now } });

    const [{ buildId }] = await tx
      .insert(noelleBuilds)
      .values({
        uid,
        weaponId: build.weapon.id,
        weaponRefinement: build.weapon.refinement,
        constellation: build.constellation,
        artifactSetIds: artifactSetIds(build),
        statsJson: build,
        calculatedAt: now,
      })
      .returning({ buildId: noelleBuilds.id });

    await upsertRanks(
      tx,
      calculated.map(({ scenario, breakdown }) => ({
        uid,
        scenarioId: scenario.id,
        buildId,
        finalDamage: breakdown.finalDamage,
        breakdownJson: breakdown,
        updatedAt: now,
      })),
    );

    // Older snapshots are no longer referenced by any active scenario; this also drops ranks on inactive ones
    await tx.delete(noelleBuilds).where(and(eq(noelleBuilds.uid, uid), ne(noelleBuilds.id, buildId)));
  });

  const ranks = await getPlayerRanks(
    uid,
    activeScenarios.map((scenario) => scenario.id),
  );
  const results = calculated.map(({ scenario, breakdown }) => {
    const position = ranks.find((rank) => rank.scenarioId === scenario.id);
    return {
      scenarioId: scenario.id,
      name: scenario.name,
      finalDamage: breakdown.finalDamage,
      rank: position?.rank ?? 0,
      total: position?.total ?? 0,
    };
  });

  return { nickname: profile.nickname, results };
}

export async function getLeaderboard(scenarioId: string, limit = 100): Promise<LeaderboardResponse> {
  const [scenario] = await db.select().from(scenarios).where(eq(scenarios.id, scenarioId)).limit(1);
  if (!scenario || !scenario.isActive) throw new LeaderboardError('SCENARIO_NOT_FOUND', 'Scenario not found');

  const rows = await db
    .select({
      uid: players.uid,
      nickname: players.nickname,
      constellation: noelleBuilds.constellation,
      weaponId: noelleBuilds.weaponId,
      weaponRefinement: noelleBuilds.weaponRefinement,
      artifactSets: sql<Record<number, number> | null>`${noelleBuilds.statsJson} -> 'artifactSets'`,
      breakdown: leaderboardRanks.breakdownJson,
      finalDamage: leaderboardRanks.finalDamage,
      updatedAt: leaderboardRanks.updatedAt,
    })
    .from(leaderboardRanks)
    .innerJoin(players, eq(leaderboardRanks.uid, players.uid))
    .innerJoin(noelleBuilds, eq(leaderboardRanks.buildId, noelleBuilds.id))
    .where(eq(leaderboardRanks.scenarioId, scenarioId))
    // Ties go to whoever reached the score first
    .orderBy(desc(leaderboardRanks.finalDamage), asc(leaderboardRanks.updatedAt))
    .limit(limit);

  const entries: LeaderboardEntry[] = rows.map(({ breakdown, artifactSets, updatedAt, ...row }, index) => ({
    ...row,
    rank: index + 1,
    artifactSets: artifactSets ?? {},
    totalDef: breakdown?.totalDef ?? null,
    critRate: breakdown?.critRate ?? null,
    critDmg: breakdown?.critDmg ?? null,
    updatedAt: updatedAt.toISOString(),
  }));

  return { scenario: toScenarioSummary(scenario), entries };
}

/**
 * Recomputes every rank from the stored builds, e.g. after changing a scenario or the calculator.
 * Builds stored before `stats_json` held a parsed `NoelleBuild` are skipped until the player updates.
 */
export async function recalculateAllRanks(): Promise<{ updated: number; skipped: number }> {
  const activeScenarios = await listActiveScenarios();
  const builds = await db
    .select({ id: noelleBuilds.id, uid: noelleBuilds.uid, build: noelleBuilds.statsJson })
    .from(noelleBuilds);

  let updated = 0;
  let skipped = 0;
  for (const { id, uid, build } of builds) {
    if (!build?.stats || !build.weapon) {
      skipped++;
      continue;
    }
    await upsertRanks(
      db,
      activeScenarios.map((scenario) => {
        const breakdown = calculateNoelleDamage(build, toScenario(scenario));
        return { uid, scenarioId: scenario.id, buildId: id, finalDamage: breakdown.finalDamage, breakdownJson: breakdown };
      }),
      { keepUpdatedAt: true },
    );
    updated++;
  }
  return { updated, skipped };
}
