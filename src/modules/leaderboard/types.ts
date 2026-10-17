import type { DamageExplanation } from '@/modules/calculator/noelle';
import type { AttackType, DamageBreakdown, NoelleBuild, TeamConfig } from '@/modules/calculator/types';
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

/** Rows per page on the home page board */
export const LEADERBOARD_PAGE_SIZE = 25;

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
  /** 1-based, clamped to the pages that exist */
  page: number;
  pageSize: number;
  pageCount: number;
  /** Builds matching `search` (all of them when it's empty) */
  total: number;
  search: string;
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

export interface PlayerDamagePage {
  uid: string;
  nickname: string;
  updatedAt: string;
  scenario: ScenarioSummary;
  team: TeamConfig;
  build: NoelleBuild;
  explanation: DamageExplanation;
  rank: number;
  total: number;
}
