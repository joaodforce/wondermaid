import type { AttackType } from '@/modules/calculator/types';

// Shapes shared by the API, the server action and the client components

export interface ScenarioSummary {
  id: string;
  name: string;
  description: string;
  attackType: AttackType;
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
