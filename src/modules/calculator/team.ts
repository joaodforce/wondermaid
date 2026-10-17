import type { AttackType, TeamConfig } from './types';

/** Conditional buffs on top of the character sheet. Percentages are fractions. */
export interface Buffs {
  atkPercent: number;
  flatAtk: number;
  defPercent: number;
  flatDef: number;
  critRate: number;
  critDmg: number;
  dmgBonus: number;
  flatDmg: number;
  resShred: number;
  /** Lunar reaction DMG bonus */
  reactionBonus: number;
}

export type BuffStat = keyof Buffs;

/** Where a buff comes from: the player's gear, the simulated team, or Noelle's own (standardized C6) kit */
export type BuffOrigin = 'weapon' | 'artifacts' | 'team' | 'noelle';

export interface BuffEntry {
  stat: BuffStat;
  value: number;
  origin: BuffOrigin;
  source: string;
  note?: string;
}

export const emptyBuffs = (): Buffs => ({
  atkPercent: 0,
  flatAtk: 0,
  defPercent: 0,
  flatDef: 0,
  critRate: 0,
  critDmg: 0,
  dmgBonus: 0,
  flatDmg: 0,
  resShred: 0,
  reactionBonus: 0,
});

/** Sums buffs and remembers each one's source, so the damage page can show exactly what was applied. */
export class BuffLedger {
  readonly totals = emptyBuffs();
  readonly entries: BuffEntry[] = [];

  add(stat: BuffStat, value: number, origin: BuffOrigin, source: string, note?: string) {
    if (!value) return;
    this.totals[stat] += value;
    this.entries.push({ stat, value, origin, source, note });
  }
}

// Inspiring Flag DEF bonus at talent level 10 / 13 (C3 raises his skill by 3)
const GOROU_FLAT_DEF = { base: 371.1, c3: 438.1 };
// Typical average Fanfare across a rotation; C1 raises the cap to 400 and C2 speeds up gain
const FURINA_DEFAULT_FANFARE = [200, 340, 400];
// DMG bonus per Fanfare point at burst level 10 / 13 (C3 raises her burst by 3)
const FURINA_DMG_PER_FANFARE = { base: 0.0025, c3: 0.0031 };
// Average of Yelan's 1% -> 50% ramp over her 15s burst
const YELAN_AVERAGE_DMG_BONUS = 0.27;
const CRANES_ECHOING_CALL_PLUNGE_BONUS = [0.28, 0.41, 0.54, 0.67, 0.8];

export function applyTeamBuffs(buffs: BuffLedger, team: TeamConfig, attackType: AttackType): void {
  const add = (stat: BuffStat, value: number, source: string, note?: string) => buffs.add(stat, value, 'team', source, note);

  if (team.geoResonance) {
    add('dmgBonus', 0.15, 'Geo Resonance', 'Shielded characters deal 15% more DMG');
    add('resShred', 0.2, 'Geo Resonance', 'Geo RES -20% after a Geo hit');
  }

  if (team.gorou) {
    const { constellation } = team.gorou;
    const source = `Gorou C${constellation}`;
    add('flatDef', constellation >= 3 ? GOROU_FLAT_DEF.c3 : GOROU_FLAT_DEF.base, source,
      `Inspiring Flag at skill level ${constellation >= 3 ? 13 : 10}`);
    add('dmgBonus', 0.15, source, 'Crunch: Geo DMG +15% with 3 Geo members');
    add('defPercent', 0.25, source, 'A1: DEF +25% after his burst');
    if (constellation >= 6) add('critDmg', 0.4, source, 'C6: Geo CRIT DMG +40% with 3 Geo members');
  }

  if (team.furina) {
    const { constellation } = team.furina;
    const fanfare = team.furina.fanfare ?? FURINA_DEFAULT_FANFARE[Math.min(constellation, 2)];
    const perPoint = constellation >= 3 ? FURINA_DMG_PER_FANFARE.c3 : FURINA_DMG_PER_FANFARE.base;
    add('dmgBonus', fanfare * perPoint, `Furina C${constellation}`,
      `${fanfare} Fanfare × ${(perPoint * 100).toFixed(2)}% (burst level ${constellation >= 3 ? 13 : 10})`);
  }

  if (team.yelan) add('dmgBonus', YELAN_AVERAGE_DMG_BONUS, 'Yelan', "Average of her 1% → 50% ramp over a 15s burst");
  if (team.zhongli) add('resShred', 0.2, 'Zhongli', 'Jade Shield: all RES -20%');

  // Xianyun only buffs plunging attacks made while Starwicker is active
  if (team.xianyun && attackType === 'Plunge') {
    const { constellation, atk, craneRefinement } = team.xianyun;
    const source = `Xianyun C${constellation}`;
    const [ratio, cap] = constellation >= 2 ? [4, 18000] : [2, 9000];
    add('flatDmg', Math.min(atk * ratio, cap), source,
      `A4: ${ratio * 100}% of her ${atk} ATK as plunge DMG, max ${cap.toLocaleString('en-US')}`);
    add('critRate', 0.04, source, 'A1: plunge CRIT Rate +4% with one opponent hit');
    if (craneRefinement) {
      add('dmgBonus', CRANES_ECHOING_CALL_PLUNGE_BONUS[craneRefinement - 1] ?? 0, `Crane's Echoing Call R${craneRefinement}`,
        'Plunging Attack DMG bonus');
    }
  }

  if (team.columbina) {
    const source = `Columbina C${team.columbina.constellation}`;
    add('reactionBonus', 0.4, source, 'Lunar reaction DMG +40%');
    if (team.columbina.constellation >= 2) add('flatDef', 400, source, 'C2: DEF +400');
  }

  if (team.linnea) add('resShred', 0.35, 'Linnea', 'RES -35%');
}
