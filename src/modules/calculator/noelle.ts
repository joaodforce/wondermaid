import { ARTIFACT_SET_IDS, WEAPON_IDS, artifactSetName, weaponName } from './data';
import { applyTeamBuffs, BuffLedger, type BuffEntry, type Buffs } from './team';
import type { AttackType, DamageBreakdown, NoelleBuild, NoelleStats, Scenario, TeamConfig, WeaponInfo } from './types';
import { withFixedWeapon } from './weapons';

// Builds are compared on equal footing: every Noelle is treated as C6 with burst level 13
// (Sweeping Time converts 85% DEF to ATK, plus 50% from C6) and the same attack talent levels.
export const MOTION_VALUES: Record<AttackType, number> = { Na4: 2.242, Ca: 1.003, Plunge: 3.682 };
export const BURST_DEF_TO_ATK = 1.35;
const C2_CHARGED_DMG_BONUS = 0.15;

export const ENEMY_LEVEL = 100;
export const ENEMY_BASE_RES = 0.1;

// Level 90 reaction base value
export const LUNAR_CRYSTALLIZE_BASE = 1446.85 * 0.96;
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

function applyWeaponPassive(buffs: BuffLedger, build: NoelleBuild, attackType: AttackType) {
  const r = refinementIndex(build.weapon.refinement);
  const source = `${weaponName(build.weapon.id)} R${r + 1}`;
  switch (build.weapon.id) {
    case WEAPON_IDS.whiteblind:
      // 4 stacks, gained from Normal and Charged Attack hits
      if (isNormalOrCharged(attackType)) {
        buffs.add('atkPercent', 4 * WHITEBLIND_STACK_BONUS[r], 'weapon', source, '4 stacks from Normal/Charged hits');
        buffs.add('defPercent', 4 * WHITEBLIND_STACK_BONUS[r], 'weapon', source, '4 stacks from Normal/Charged hits');
      }
      break;
    case WEAPON_IDS.serpentSpine:
      buffs.add('dmgBonus', 5 * SERPENT_SPINE_STACK_BONUS[r], 'weapon', source, '5 stacks from time on field');
      break;
    // Redhorn's DEF% is on the character sheet; its flat DMG needs final DEF (see explainNoelleDamage)
  }
}

function applyArtifactSets(buffs: BuffLedger, build: NoelleBuild, team: TeamConfig, attackType: AttackType) {
  const add = (stat: keyof Buffs, value: number, setId: number, pieces: 2 | 4, note: string) =>
    buffs.add(stat, value, 'artifacts', `${artifactSetName(setId)} (${pieces})`, note);

  // 2-piece stat bonuses are already on the character sheet, except damage bonuses like this one
  if ((build.artifactSets[ARTIFACT_SET_IDS.marechausseeHunter] ?? 0) >= 2 && isNormalOrCharged(attackType)) {
    add('dmgBonus', 0.15, ARTIFACT_SET_IDS.marechausseeHunter, 2, 'Normal and Charged Attack DMG +15%');
  }

  const setId = build.fourPieceSetId;
  switch (setId) {
    case ARTIFACT_SET_IDS.gladiatorsFinale:
      if (attackType === 'Na4') add('dmgBonus', 0.35, setId, 4, 'Normal Attack DMG +35% with a claymore');
      break;
    case ARTIFACT_SET_IDS.huskOfOpulentDreams:
      add('defPercent', 0.24, setId, 4, '4 Curiosity stacks: DEF +24%');
      add('dmgBonus', 0.24, setId, 4, '4 Curiosity stacks: Geo DMG +24%');
      break;
    case ARTIFACT_SET_IDS.marechausseeHunter: {
      const stacks = Math.min(team.marechausseeStacks ?? (team.furina ? 3 : 0), 3);
      add('critRate', 0.12 * stacks, setId, 4, `${stacks} stacks from HP changes (needs Furina or a set value)`);
      break;
    }
    case ARTIFACT_SET_IDS.nighttimeWhispers:
      add('dmgBonus', 0.2, setId, 4, 'Geo DMG +20% after using her skill');
      break;
    case ARTIFACT_SET_IDS.nightOfTheSkysUnveiling:
      if (team.moonsign) {
        const gleam = team.moonsign >= 2 ? 'Ascendant Gleam' : 'Nascent Gleam';
        add('critRate', team.moonsign >= 2 ? 0.3 : 0.15, setId, 4, `Gleaming Moon at ${gleam}`);
        add('reactionBonus', 0.1, setId, 4, 'Lunar reaction DMG +10%');
      }
      break;
  }
}

export interface LunarCrystallizeExplanation {
  sources: { source: string; multiplier: number }[];
  baseMultiplier: number;
  elementalMastery: number;
  emBonus: number;
  reactionBonus: number;
  elevation: number;
  damage: number;
}

/** Every input, intermediate value and buff behind one scenario's damage number. */
export interface DamageExplanation {
  attackType: AttackType;
  motionValue: number;
  characterLevel: number;
  /** The player's character sheet from Enka, with their own weapon */
  playerSheet: NoelleStats;
  playerWeapon: WeaponInfo;
  /** The sheet the formulas use, after swapping in the scenario's fixed weapon */
  sheet: NoelleStats;
  weapon: WeaponInfo;
  weaponSwapped: boolean;
  buffs: Buffs;
  entries: BuffEntry[];
  totalAtk: number;
  totalDef: number;
  scalingAtk: number;
  flatDmg: number;
  baseDamage: number;
  dmgBonus: number;
  critRate: number;
  critDmg: number;
  critMultiplier: number;
  enemyRes: number;
  enemyResMultiplier: number;
  enemyDefMultiplier: number;
  hitDamage: number;
  lunarCrystallize: LunarCrystallizeExplanation | null;
  finalDamage: number;
}

function lunarCrystallize(
  build: NoelleBuild,
  team: TeamConfig,
  buffs: Buffs,
  multipliers: number,
): LunarCrystallizeExplanation | null {
  const sources = [
    ...(team.columbina ? [{ source: `Columbina C${team.columbina.constellation}`, multiplier: 0.07 }] : []),
    ...(team.linnea ? [{ source: 'Linnea', multiplier: 0.14 }] : []),
  ];
  if (!sources.length) return null;

  const baseMultiplier = sources.reduce((sum, s) => sum + s.multiplier, 0);
  const em = build.stats.elementalMastery;
  const emBonus = (6 * em) / (em + 2000);
  const elevation = (team.columbina?.constellation ?? 0) >= 2 ? COLUMBINA_C2_ELEVATION : 1;
  return {
    sources,
    baseMultiplier,
    elementalMastery: em,
    emBonus,
    reactionBonus: buffs.reactionBonus,
    elevation,
    damage: LUNAR_CRYSTALLIZE_BASE * baseMultiplier * (1 + emBonus + buffs.reactionBonus) * multipliers * elevation,
  };
}

/** Works out one hit of `scenario.attackType` against a level 100 enemy, keeping every step. */
export function explainNoelleDamage(playerBuild: NoelleBuild, scenario: Scenario): DamageExplanation {
  const build = scenario.weapon ? withFixedWeapon(playerBuild, scenario.weapon) : playerBuild;
  const { stats } = build;
  const { attackType, team } = scenario;

  const ledger = new BuffLedger();
  applyWeaponPassive(ledger, build, attackType);
  applyArtifactSets(ledger, build, team, attackType);
  applyTeamBuffs(ledger, team, attackType);
  if (attackType === 'Ca') ledger.add('dmgBonus', C2_CHARGED_DMG_BONUS, 'noelle', 'Noelle C2', 'Charged Attack DMG +15%');

  const buffs = ledger.totals;
  const totalAtk = stats.atk + stats.baseAtk * buffs.atkPercent + buffs.flatAtk;
  const totalDef = stats.def + stats.baseDef * buffs.defPercent + buffs.flatDef;
  const scalingAtk = totalAtk + totalDef * BURST_DEF_TO_ATK;

  if (build.weapon.id === WEAPON_IDS.redhornStonethresher && isNormalOrCharged(attackType)) {
    const ratio = REDHORN_DEF_TO_DMG[refinementIndex(build.weapon.refinement)];
    ledger.add('flatDmg', totalDef * ratio, 'weapon', `${weaponName(build.weapon.id)} R${build.weapon.refinement}`,
      `Normal/Charged DMG +${ratio * 100}% of final DEF`);
  }

  const motionValue = MOTION_VALUES[attackType];
  const flatDmg = buffs.flatDmg;
  const baseDamage = scalingAtk * motionValue + flatDmg;
  const critRate = stats.critRate + buffs.critRate;
  const critDmg = stats.critDmg + buffs.critDmg;
  const dmgBonus = stats.geoDmgBonus + buffs.dmgBonus;
  const critMultiplier = 1 + Math.min(Math.max(critRate, 0), 1) * critDmg;
  const enemyRes = ENEMY_BASE_RES - buffs.resShred;
  const resMultiplier = enemyResMultiplier(enemyRes);
  const defMultiplier = enemyDefMultiplier(build.level);

  const hitDamage = baseDamage * (1 + dmgBonus) * critMultiplier * defMultiplier * resMultiplier;
  // Lunar reactions ignore enemy DEF
  const lunar = lunarCrystallize(build, team, buffs, resMultiplier * critMultiplier);

  return {
    attackType,
    motionValue,
    characterLevel: build.level,
    playerSheet: playerBuild.stats,
    playerWeapon: playerBuild.weapon,
    sheet: stats,
    weapon: build.weapon,
    weaponSwapped: build !== playerBuild,
    buffs,
    entries: ledger.entries,
    totalAtk,
    totalDef,
    scalingAtk,
    flatDmg,
    baseDamage,
    dmgBonus,
    critRate,
    critDmg,
    critMultiplier,
    enemyRes,
    enemyResMultiplier: resMultiplier,
    enemyDefMultiplier: defMultiplier,
    hitDamage,
    lunarCrystallize: lunar,
    finalDamage: hitDamage + (lunar?.damage ?? 0),
  };
}

/** Average (crit-weighted) damage of one hit of `scenario.attackType` against a level 100 enemy. */
export function calculateNoelleDamage(playerBuild: NoelleBuild, scenario: Scenario): DamageBreakdown {
  const explanation = explainNoelleDamage(playerBuild, scenario);
  return {
    totalAtk: explanation.totalAtk,
    totalDef: explanation.totalDef,
    scalingAtk: explanation.scalingAtk,
    critRate: explanation.critRate,
    critDmg: explanation.critDmg,
    dmgBonus: explanation.dmgBonus,
    flatDmg: explanation.flatDmg,
    enemyResMultiplier: explanation.enemyResMultiplier,
    enemyDefMultiplier: explanation.enemyDefMultiplier,
    lunarCrystallizeDmg: explanation.lunarCrystallize?.damage ?? 0,
    finalDamage: explanation.finalDamage,
  };
}
