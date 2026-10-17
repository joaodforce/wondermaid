import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { scenarios } from '@/db/schema';
import type { AttackType, Scenario } from '@/modules/calculator/types';
import type { ScenarioSummary } from './types';

type ScenarioRow = typeof scenarios.$inferSelect;
type NewScenario = typeof scenarios.$inferInsert;

export const DEFAULT_SCENARIO_ID = 'mono-geo-c6-gorou';

// Seeded on first use; edit or deactivate them in the database (then recalculate ranks)
export const DEFAULT_SCENARIOS: NewScenario[] = [
  {
    id: DEFAULT_SCENARIO_ID,
    name: 'Mono Geo',
    description: 'N4 with C6 Gorou and Geo Resonance',
    attackType: 'Na4',
    teamConfigJson: { geoResonance: true, gorou: { constellation: 6 } },
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
    id: 'lunar-crystallize',
    name: 'Lunar Crystallize',
    description: 'N4 with C0 Columbina and Linnea (Ascendant Gleam)',
    attackType: 'Na4',
    teamConfigJson: { columbina: { constellation: 0 }, linnea: true, moonsign: 2 },
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
});

export const toScenarioSummary = (row: ScenarioRow): ScenarioSummary => ({
  id: row.id,
  name: row.name,
  description: row.description,
  attackType: row.attackType as AttackType,
});
