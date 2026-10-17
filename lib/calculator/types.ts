export type AttackType = "Na4" | "Ca" | "Plunge";

export interface WeaponConfig {
  weaponName: "Whiteblind" | "SerpantSpine" | "Redhorn" | string;
  baseAtk: number;
  subStatType?: "FIGHT_PROP_DEFENSE_PERCENT" | "FIGHT_PROP_CRITICAL" | "FIGHT_PROP_CRITICAL_HURT" | string;
  subStatValue?: number;
}

export interface TeamConfig {
  geoResonance?: boolean;
  gorouC0?: boolean;
  gorouC5?: boolean;
  gorouC6?: boolean;
  furinaC0?: boolean;
  furinaC1?: boolean;
  furinaC2?: boolean;
  furinaC3?: boolean;
  xilonenC0?: boolean;
  xilonenC2?: boolean;
  xilonenC2R1?: boolean;
  yelan?: boolean;
  xianyunC0?: boolean;
  xianyunC0R1?: boolean;
  xianyunC2R1?: boolean;
  illugaC2?: boolean;
  illugaC6?: boolean;
  columbinaC0?: boolean;
  columbinaC2?: boolean;
  ainoC1?: boolean;
  ainoC6?: boolean;
  albedo?: boolean;
  durin?: boolean;
  zhongli?: boolean;
  kachinaC0?: boolean;
  kachinaC4?: boolean;
  ineffa?: boolean;
  yunJinC6?: boolean;
  linnea?: boolean;
  linneaC2?: boolean;
  nodKraiCount?: number;
}

export interface CalculationResult {
  totalATK: number;
  totalDEF: number;
  effectiveATK: string;
  totalCritRate: string;
  totalCritDMG: string;
  totalER: string;
  totalGeoDMG: string;
  totalDamageBonus: string;
  combinedDamageBonus: string;
  finalDamage: number;
}