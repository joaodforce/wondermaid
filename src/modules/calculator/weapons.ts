import { WEAPON_IDS } from './data';
import type { NoelleBuild, NoelleStats, StatLine, WeaponInfo } from './types';

export interface FixedWeapon {
  id: number;
  refinement: number;
}

// Level 90 stats of the weapons a scenario can assign; percentages in percent units like Enka's
const LEVEL_90_WEAPONS: Record<number, { baseAtk: number; subStat: StatLine; icon: string; rarity: number }> = {
  [WEAPON_IDS.redhornStonethresher]: {
    baseAtk: 542,
    subStat: { type: 'FIGHT_PROP_CRITICAL_HURT', value: 88.2 },
    icon: 'UI_EquipIcon_Claymore_Itadorimaru',
    rarity: 5,
  },
  [WEAPON_IDS.whiteblind]: {
    baseAtk: 510,
    subStat: { type: 'FIGHT_PROP_DEFENSE_PERCENT', value: 51.7 },
    icon: 'UI_EquipIcon_Claymore_Exotic',
    rarity: 4,
  },
  [WEAPON_IDS.serpentSpine]: {
    baseAtk: 510,
    subStat: { type: 'FIGHT_PROP_CRITICAL', value: 27.6 },
    icon: 'UI_EquipIcon_Claymore_Kione',
    rarity: 4,
  },
};

export const isFixedWeaponSupported = (id: number) => id in LEVEL_90_WEAPONS;
export const fixedWeaponIcon = (id: number) => LEVEL_90_WEAPONS[id]?.icon;

// Static claymore passives that show up on the character sheet (weapons.json RefineProps), per refinement
const STATIC_PASSIVES: Record<number, { stat: 'atkPercent' | 'defPercent'; values: number[] }> = {
  12426: { stat: 'atkPercent', values: [0.12, 0.15, 0.18, 0.21, 0.24] },
  12502: { stat: 'atkPercent', values: [0.2, 0.25, 0.3, 0.35, 0.4] },
  12503: { stat: 'atkPercent', values: [0.16, 0.2, 0.24, 0.28, 0.32] },
  [WEAPON_IDS.redhornStonethresher]: { stat: 'defPercent', values: [0.28, 0.35, 0.42, 0.49, 0.56] },
  12512: { stat: 'atkPercent', values: [0.2, 0.25, 0.3, 0.35, 0.4] },
};

// Weapon substats that change a stat the calculator reads
const SUBSTAT_KEYS: Record<string, keyof NoelleStats> = {
  FIGHT_PROP_ATTACK_PERCENT: 'atkPercent',
  FIGHT_PROP_DEFENSE_PERCENT: 'defPercent',
  FIGHT_PROP_CRITICAL: 'critRate',
  FIGHT_PROP_CRITICAL_HURT: 'critDmg',
  FIGHT_PROP_CHARGE_EFFICIENCY: 'energyRecharge',
  FIGHT_PROP_ELEMENT_MASTERY: 'elementalMastery',
};

/** Signed change a weapon's substat and static passive make to the character sheet */
function weaponDelta(weapon: Pick<WeaponInfo, 'id' | 'refinement' | 'subStat'>, sign: 1 | -1) {
  const delta: Partial<Record<keyof NoelleStats, number>> = {};
  const add = (key: keyof NoelleStats, value: number) => (delta[key] = (delta[key] ?? 0) + sign * value);

  const subKey = weapon.subStat && SUBSTAT_KEYS[weapon.subStat.type];
  if (weapon.subStat && subKey) {
    add(subKey, subKey === 'elementalMastery' ? weapon.subStat.value : weapon.subStat.value / 100);
  }
  const passive = STATIC_PASSIVES[weapon.id];
  if (passive) add(passive.stat, passive.values[Math.min(Math.max(weapon.refinement, 1), 5) - 1]);
  return delta;
}

/**
 * The build as if Noelle held `fixed` at level 90 instead of her own weapon, so builds are ranked on
 * artifacts alone. Enka only reports sheet totals, so the own weapon's base ATK, substat and static
 * passive are taken out of them and the fixed weapon's are put in.
 */
export function withFixedWeapon(build: NoelleBuild, fixed: FixedWeapon): NoelleBuild {
  const stats = LEVEL_90_WEAPONS[fixed.id];
  if (!stats) throw new Error(`No level 90 stats for weapon ${fixed.id}`);

  const { stats: sheet, weapon: own } = build;
  const flatAtk = sheet.atk - sheet.baseAtk * (1 + sheet.atkPercent);
  const flatDef = sheet.def - sheet.baseDef * (1 + sheet.defPercent);

  const next: NoelleStats = { ...sheet };
  for (const delta of [weaponDelta(own, -1), weaponDelta({ ...fixed, subStat: stats.subStat }, 1)]) {
    for (const [key, value] of Object.entries(delta) as [keyof NoelleStats, number][]) next[key] += value;
  }
  next.baseAtk = sheet.baseAtk - own.baseAtk + stats.baseAtk;
  next.atk = next.baseAtk * (1 + next.atkPercent) + flatAtk;
  next.def = next.baseDef * (1 + next.defPercent) + flatDef;

  return {
    ...build,
    stats: next,
    weapon: {
      id: fixed.id,
      level: 90,
      refinement: fixed.refinement,
      baseAtk: stats.baseAtk,
      subStat: stats.subStat,
      icon: stats.icon,
      rarity: stats.rarity,
    },
  };
}
