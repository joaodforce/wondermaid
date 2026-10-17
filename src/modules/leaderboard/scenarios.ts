import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { scenarios } from '@/db/schema';
import type { AttackType, Scenario } from '@/modules/calculator/types';
import { fixedWeaponIcon, isFixedWeaponSupported } from '@/modules/calculator/weapons';
import { teamMembers } from './team-members';
import type { ScenarioSummary } from './types';

type ScenarioRow = typeof scenarios.$inferSelect;
type NewScenario = typeof scenarios.$inferInsert;

export const DEFAULT_SCENARIO_ID = 'lunar-crystallize';

// Seeded on first use, in order of relevance; edit or deactivate them in the database (then recalculate ranks).
// Every scenario defaults to Redhorn Stonethresher R1 (scenarios.weapon_id / weapon_refinement).
export const DEFAULT_SCENARIOS: NewScenario[] = [
  {
    id: 'lunar-crystallize',
    name: 'Lunar Crystallize',
    description: 'N4 with C0 Columbina and Linnea (Ascendant Gleam)',
    attackType: 'Na4',
    teamConfigJson: { columbina: { constellation: 0 }, linnea: true, moonsign: 2 },
    sortOrder: 0,
  },
  {
    id: 'furina-hyper',
    name: 'Furina Hypercarry',
    description: 'N4 with C0 Furina and Yelan',
    attackType: 'Na4',
    teamConfigJson: { furina: { constellation: 0 }, yelan: true },
    sortOrder: 1,
  },
  {
    id: 'plunge-xianyun',
    name: 'Xianyun Plunge',
    description: 'Plunge with C0 Xianyun (2,180 ATK) and C0 Furina',
    attackType: 'Plunge',
    teamConfigJson: { xianyun: { constellation: 0, atk: 2180 }, furina: { constellation: 0 } },
    sortOrder: 2,
  },
  {
    id: 'mono-geo-c6-gorou',
    name: 'Mono Geo',
    description: 'N4 with C6 Gorou, Zhongli and Geo Resonance',
    attackType: 'Na4',
    teamConfigJson: { geoResonance: true, gorou: { constellation: 6 }, zhongli: true },
    sortOrder: 3,
  },
];

let seeded: Promise<void> | null = null;

/** Inserts any missing default scenario once per process; existing rows are left untouched. */
export function ensureDefaultScenarios(): Promise<void> {
  seeded ??= db
    .insert(scenarios)
    .values(DEFAULT_SCENARIOS)
    .onConflictDoNothing()
    .then(() => undefined)
    .catch((error) => {
      seeded = null;
      throw error;
    });
  return seeded;
}

export async function listActiveScenarios(): Promise<ScenarioRow[]> {
  await ensureDefaultScenarios();
  return db
    .select()
    .from(scenarios)
    .where(eq(scenarios.isActive, true))
    .orderBy(asc(scenarios.sortOrder), asc(scenarios.name));
}

export const toScenario = (row: ScenarioRow): Scenario => ({
  attackType: row.attackType as AttackType,
  team: row.teamConfigJson,
  // A weapon without level 90 data falls back to each player's own weapon
  weapon: isFixedWeaponSupported(row.weaponId) ? { id: row.weaponId, refinement: row.weaponRefinement } : undefined,
});

export const toScenarioSummary = (row: ScenarioRow): ScenarioSummary => ({
  id: row.id,
  name: row.name,
  description: row.description,
  attackType: row.attackType as AttackType,
  weapon: { id: row.weaponId, refinement: row.weaponRefinement, icon: fixedWeaponIcon(row.weaponId) ?? null },
  members: teamMembers(row.teamConfigJson),
});
