import { ARTIFACT_SET_IDS, WEAPON_IDS } from './data';
import { applyTeamBuffs, emptyBuffs, type Buffs } from './team';
import type { AttackType, DamageBreakdown, NoelleBuild, Scenario, TeamConfig } from './types';
import { withFixedWeapon } from './weapons';

// Builds are compared on equal footing: every Noelle is treated as C6 with burst level 13
// (Sweeping Time converts 85% DEF to ATK, plus 50% from C6) and the same attack talent levels.
export const MOTION_VALUES: Record<AttackType, number> = { Na4: 2.242, Ca: 1.003, Plunge: 3.682 };
const BURST_DEF_TO_ATK = 1.35;
const C2_CHARGED_DMG_BONUS = 0.15;

const ENEMY_LEVEL = 100;
const ENEMY_BASE_RES = 0.1;

// Level 90 reaction base value
const LUNAR_CRYSTALLIZE_BASE = 1446.85 * 0.96;
const COLUMBINA_C2_ELEVATION = 9.5;

const WHITEBLIND_STACK_BONUS = [0.06, 0.075, 0.09, 0.105, 0.12];
const SERPENT_SPINE_STACK_BONUS = [0.06, 0.07, 0.08, 0.09, 0.1];
const REDHORN_DEF_TO_DMG = [0.4, 0.5, 0.6, 0.7, 0.8];

const isNormalOrCharged = (attackType: AttackType) => attackType !== 'Plunge';

export function enemyResMultiplier(res: number): number {
  if (res < 0) return 1 - res / 2;
  if (res < 0.75) return 1 - res;
  return 1 / (4 * res + 1);
}

export function enemyDefMultiplier(characterLevel: number): number {
  return (characterLevel + 100) / (characterLevel + 100 + (ENEMY_LEVEL + 100));
}

function refinementIndex(refinement: number) {
  return Math.min(Math.max(Math.round(refinement), 1), 5) - 1;
}

function applyWeaponPassive(buffs: Buffs, build: NoelleBuild, attackType: AttackType) {
  const r = refinementIndex(build.weapon.refinement);
  switch (build.weapon.id) {
    case WEAPON_IDS.whiteblind:
      // 4 stacks, gained from Normal and Charged Attack hits
      if (isNormalOrCharged(attackType)) {
        buffs.atkPercent += 4 * WHITEBLIND_STACK_BONUS[r];
        buffs.defPercent += 4 * WHITEBLIND_STACK_BONUS[r];
      }
      break;
    case WEAPON_IDS.serpentSpine:
      buffs.dmgBonus += 5 * SERPENT_SPINE_STACK_BONUS[r];
      break;
    // Redhorn's DEF% is on the character sheet; its flat DMG needs final DEF (see calculateNoelleDamage)
  }
}

function applyArtifactSets(buffs: Buffs, build: NoelleBuild, team: TeamConfig, attackType: AttackType) {
  // 2-piece stat bonuses are already on the character sheet, except damage bonuses like this one
  if ((build.artifactSets[ARTIFACT_SET_IDS.marechausseeHunter] ?? 0) >= 2 && isNormalOrCharged(attackType)) {
    buffs.dmgBonus += 0.15;
  }

  switch (build.fourPieceSetId) {
    case ARTIFACT_SET_IDS.gladiatorsFinale:
      if (attackType === 'Na4') buffs.dmgBonus += 0.35;
      break;
    case ARTIFACT_SET_IDS.huskOfOpulentDreams:
      // 4 Curiosity stacks
      buffs.defPercent += 0.24;
      buffs.dmgBonus += 0.24;
      break;
    case ARTIFACT_SET_IDS.marechausseeHunter: {
      const stacks = team.marechausseeStacks ?? (team.furina ? 3 : 0);
      buffs.critRate += 0.12 * Math.min(stacks, 3);
      break;
    }
    case ARTIFACT_SET_IDS.nighttimeWhispers:
      buffs.dmgBonus += 0.2;
      break;
    case ARTIFACT_SET_IDS.nightOfTheSkysUnveiling:
      if (team.moonsign) {
        buffs.critRate += team.moonsign >= 2 ? 0.3 : 0.15;
        buffs.reactionBonus += 0.1;
      }
      break;
  }
}

function lunarCrystallizeDamage(build: NoelleBuild, team: TeamConfig, buffs: Buffs, multipliers: number): number {
  const baseMultiplier = (team.columbina ? 0.07 : 0) + (team.linnea ? 0.14 : 0);
  if (!baseMultiplier) return 0;

  const em = build.stats.elementalMastery;
  const emBonus = (6 * em) / (em + 2000);
  const elevation = (team.columbina?.constellation ?? 0) >= 2 ? COLUMBINA_C2_ELEVATION : 1;
  return LUNAR_CRYSTALLIZE_BASE * baseMultiplier * (1 + emBonus + buffs.reactionBonus) * multipliers * elevation;
}

/** Average (crit-weighted) damage of one hit of `scenario.attackType` against a level 100 enemy. */
export function calculateNoelleDamage(playerBuild: NoelleBuild, scenario: Scenario): DamageBreakdown {
  const build = scenario.weapon ? withFixedWeapon(playerBuild, scenario.weapon) : playerBuild;
  const { stats } = build;
  const { attackType, team } = scenario;

  const buffs = emptyBuffs();
  applyWeaponPassive(buffs, build, attackType);
  applyArtifactSets(buffs, build, team, attackType);
  applyTeamBuffs(buffs, team, attackType);
  if (attackType === 'Ca') buffs.dmgBonus += C2_CHARGED_DMG_BONUS;

  const totalAtk = stats.atk + stats.baseAtk * buffs.atkPercent + buffs.flatAtk;
  const totalDef = stats.def + stats.baseDef * buffs.defPercent + buffs.flatDef;
  const scalingAtk = totalAtk + totalDef * BURST_DEF_TO_ATK;

  let flatDmg = buffs.flatDmg;
  if (build.weapon.id === WEAPON_IDS.redhornStonethresher && isNormalOrCharged(attackType)) {
    flatDmg += totalDef * REDHORN_DEF_TO_DMG[refinementIndex(build.weapon.refinement)];
  }

  const critRate = stats.critRate + buffs.critRate;
  const critDmg = stats.critDmg + buffs.critDmg;
  const dmgBonus = stats.geoDmgBonus + buffs.dmgBonus;
  const critMultiplier = 1 + Math.min(Math.max(critRate, 0), 1) * critDmg;
  const resMultiplier = enemyResMultiplier(ENEMY_BASE_RES - buffs.resShred);
  const defMultiplier = enemyDefMultiplier(build.level);

  const hitDamage =
    (scalingAtk * MOTION_VALUES[attackType] + flatDmg) * (1 + dmgBonus) * critMultiplier * defMultiplier * resMultiplier;
  // Lunar reactions ignore enemy DEF
  const lunarCrystallizeDmg = lunarCrystallizeDamage(build, team, buffs, resMultiplier * critMultiplier);

  return {
    totalAtk,
    totalDef,
    scalingAtk,
    critRate,
    critDmg,
    dmgBonus,
    flatDmg,
    enemyResMultiplier: resMultiplier,
    enemyDefMultiplier: defMultiplier,
    lunarCrystallizeDmg,
    finalDamage: hitDamage + lunarCrystallizeDmg,
  };
}
