/** Noelle's 4th normal attack, or a high plunge when Xianyun is in the party */
export type TeamAttack = 'Na4' | 'Plunge';

/** An effect the calculation assumes is active, e.g. Gorou's burst or a 4-piece set bonus */
export interface ActiveConditional {
  /** Party slot of the character it belongs to (0 is Noelle) */
  member: number;
  /** The character, weapon or artifact set it comes from */
  sheet: string;
  name: string;
  /** 'bool' and 'list' effects are simply on; 'num' ones carry a stack count or amount */
  type: string;
  value: number;
}

/** Noelle's final stats for the ranked hit */
export interface TeamStats {
  atk: number;
  def: number;
  critRate: number;
  critDmg: number;
  dmgBonus: number;
}

export interface TeamCalculation {
  attack: TeamAttack;
  /** Average (crit-weighted) damage of one hit */
  finalDamage: number;
  stats: TeamStats;
  conditionals: ActiveConditional[];
  /** Noelle's damage with each teammate (in party order, Noelle excluded) taken out of the party */
  damageWithout: number[];
}

/** How much more Noelle deals with the party member in `slot` than without them, as a fraction */
export const addedDamage = (calculation: TeamCalculation, slot: number) =>
  calculation.finalDamage / calculation.damageWithout[slot - 1] - 1;

