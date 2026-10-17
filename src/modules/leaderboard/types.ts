import type { AttackType, DamageBreakdown, NoelleBuild } from '@/modules/calculator/types';
import type { TeamMember } from './team-members';

// Shapes shared by the API, the server action and the client components

export interface ScenarioSummary {
  id: string;
  name: string;
  description: string;
  attackType: AttackType;
  /** Weapon every build on this board is evaluated with */
  weapon: { id: number; refinement: number; icon: string | null };
  members: TeamMember[];
}

export interface LeaderboardEntry {
  rank: number;
  uid: string;
  nickname: string;
  constellation: number;
  weaponId: number;
  weaponRefinement: number;
  artifactSets: Record<number, number>;
  totalDef: number | null;
  critRate: number | null;
  critDmg: number | null;
  finalDamage: number;
  updatedAt: string;
}

export interface LeaderboardResponse {
  scenario: ScenarioSummary;
  entries: LeaderboardEntry[];
}

export interface ScenarioResult {
  scenarioId: string;
  name: string;
  finalDamage: number;
  rank: number;
  total: number;
}

export type UpdatePlayerResult =
  | { success: true; uid: string; nickname: string; results: ScenarioResult[] }
  | { success: false; error: string };

export interface PlayerScenarioResult extends ScenarioSummary {
  finalDamage: number;
  rank: number;
  total: number;
  breakdown: DamageBreakdown | null;
}

export interface PlayerBuildPage {
  uid: string;
  nickname: string;
  level: number | null;
  build: NoelleBuild;
  updatedAt: string;
  scenarios: PlayerScenarioResult[];
}
