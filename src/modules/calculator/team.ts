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

// Inspiring Flag DEF bonus at talent level 10 / 13 (C3 raises his skill by 3)
const GOROU_FLAT_DEF = { base: 371.1, c3: 438.1 };
// Typical average Fanfare across a rotation; C1 raises the cap to 400 and C2 speeds up gain
const FURINA_DEFAULT_FANFARE = [200, 340, 400];
// DMG bonus per Fanfare point at burst level 10 / 13 (C3 raises her burst by 3)
const FURINA_DMG_PER_FANFARE = { base: 0.0025, c3: 0.0031 };
// Average of Yelan's 1% -> 50% ramp over her 15s burst
const YELAN_AVERAGE_DMG_BONUS = 0.27;
const CRANES_ECHOING_CALL_PLUNGE_BONUS = [0.28, 0.41, 0.54, 0.67, 0.8];

export function applyTeamBuffs(buffs: Buffs, team: TeamConfig, attackType: AttackType): void {
  if (team.geoResonance) {
    buffs.dmgBonus += 0.15;
    buffs.resShred += 0.2;
  }

  if (team.gorou) {
    const { constellation } = team.gorou;
    buffs.flatDef += constellation >= 3 ? GOROU_FLAT_DEF.c3 : GOROU_FLAT_DEF.base;
    buffs.dmgBonus += 0.15; // Crunch: Geo DMG +15% with 3 Geo members
    buffs.defPercent += 0.25; // A1 after his burst
    if (constellation >= 6) buffs.critDmg += 0.4;
  }

  if (team.furina) {
    const { constellation } = team.furina;
    const fanfare = team.furina.fanfare ?? FURINA_DEFAULT_FANFARE[Math.min(constellation, 2)];
    buffs.dmgBonus += fanfare * (constellation >= 3 ? FURINA_DMG_PER_FANFARE.c3 : FURINA_DMG_PER_FANFARE.base);
  }

  if (team.yelan) buffs.dmgBonus += YELAN_AVERAGE_DMG_BONUS;
  if (team.zhongli) buffs.resShred += 0.2;

  // Xianyun only buffs plunging attacks made while Starwicker is active
  if (team.xianyun && attackType === 'Plunge') {
    const { constellation, atk, craneRefinement } = team.xianyun;
    buffs.flatDmg += constellation >= 2 ? Math.min(atk * 4, 18000) : Math.min(atk * 2, 9000);
    buffs.critRate += 0.04; // A1 with a single opponent hit
    if (craneRefinement) buffs.dmgBonus += CRANES_ECHOING_CALL_PLUNGE_BONUS[craneRefinement - 1] ?? 0;
  }

  if (team.columbina) {
    buffs.reactionBonus += 0.4;
    if (team.columbina.constellation >= 2) buffs.flatDef += 400;
  }

  if (team.linnea) buffs.resShred += 0.35;
}
