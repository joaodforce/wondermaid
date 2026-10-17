export const ATTACK_TYPES = ['Na4', 'Ca', 'Plunge'] as const;
export type AttackType = (typeof ATTACK_TYPES)[number];

/**
 * Noelle's character-sheet stats as Enka reports them (fightPropMap). These already include her level,
 * ascension DEF%, weapon base ATK and substat, static weapon passives (e.g. Redhorn's DEF%), artifact
 * main/substats and 2-piece stat bonuses. Percentages are fractions (0.5 = 50%).
 */
export interface NoelleStats {
  hp: number;
  baseAtk: number;
  atk: number;
  atkPercent: number;
  baseDef: number;
  def: number;
  defPercent: number;
  critRate: number;
  critDmg: number;
  energyRecharge: number;
  elementalMastery: number;
  geoDmgBonus: number;
}

/** A stat as Enka names it (FIGHT_PROP_*); percentage stats are in percent units (46.6 = 46.6%) */
export interface StatLine {
  type: string;
  value: number;
}

export interface WeaponInfo {
  id: number;
  level: number;
  /** 1-5 */
  refinement: number;
  baseAtk: number;
  subStat: StatLine | null;
  /** Enka icon name, e.g. UI_EquipIcon_Claymore_Itadorimaru */
  icon?: string;
  rarity?: number;
}

export const ARTIFACT_SLOTS = ['flower', 'plume', 'sands', 'goblet', 'circlet'] as const;
export type ArtifactSlot = (typeof ARTIFACT_SLOTS)[number];

export interface ArtifactPiece {
  slot: ArtifactSlot;
  setId: number;
  /** 0-20 */
  level: number;
  rarity: number;
  icon: string;
  mainStat: StatLine;
  subStats: StatLine[];
}

export interface TalentLevel {
  level: number;
  /** Levels added by constellations */
  bonus: number;
}

export interface Talents {
  normal: TalentLevel;
  skill: TalentLevel;
  burst: TalentLevel;
}

/** Parsed Noelle build, stored as `noelle_builds.stats_json` so ranks can be recalculated later. */
export interface NoelleBuild {
  level: number;
  constellation: number;
  stats: NoelleStats;
  weapon: WeaponInfo;
  /** Equipped piece count per artifact set ID */
  artifactSets: Record<number, number>;
  fourPieceSetId: number | null;
  // Display-only details; builds stored before they were added don't have them
  artifacts?: ArtifactPiece[];
  talents?: Talents;
}

/**
 * Team buffs for a scenario. Values describe the teammates; the calculator turns them into buffs
 * (see `team.ts`). Stored as `scenarios.team_config_json`.
 */
export interface TeamConfig {
  /** Shielded +15% DMG and -20% Geo RES */
  geoResonance?: boolean;
  /** Assumes 3 Geo party members (Crunch state) */
  gorou?: { constellation: number };
  /** `fanfare` defaults to a typical average for her constellation */
  furina?: { constellation: number; fanfare?: number };
  yelan?: boolean;
  zhongli?: boolean;
  /** `atk` is Xianyun's ATK, which drives her plunge flat DMG; `craneRefinement` is Crane's Echoing Call */
  xianyun?: { constellation: number; atk: number; craneRefinement?: number };
  columbina?: { constellation: number };
  linnea?: boolean;
  /** 1 = Nascent Gleam, 2 = Ascendant Gleam (Night of the Sky's Unveiling) */
  moonsign?: number;
  /** Marechaussee Hunter stacks; defaults to 3 with Furina, 0 otherwise */
  marechausseeStacks?: number;
}

export interface Scenario {
  attackType: AttackType;
  team: TeamConfig;
}

export interface DamageBreakdown {
  totalAtk: number;
  totalDef: number;
  /** ATK + Noelle's burst DEF conversion */
  scalingAtk: number;
  critRate: number;
  critDmg: number;
  dmgBonus: number;
  flatDmg: number;
  enemyResMultiplier: number;
  enemyDefMultiplier: number;
  lunarCrystallizeDmg: number;
  finalDamage: number;
}
