import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ARTIFACT_SET_IDS, WEAPON_IDS } from './data';
import { calculateNoelleDamage, enemyDefMultiplier, enemyResMultiplier } from './noelle';
import type { NoelleBuild } from './types';

const build: NoelleBuild = {
  level: 90,
  constellation: 6,
  stats: {
    hp: 14000,
    baseAtk: 733,
    atk: 900,
    atkPercent: 0,
    baseDef: 799,
    def: 3000,
    defPercent: 2.6,
    critRate: 0.6,
    critDmg: 1.5,
    energyRecharge: 1.2,
    elementalMastery: 0,
    geoDmgBonus: 0.466,
  },
  weapon: { id: WEAPON_IDS.redhornStonethresher, level: 90, refinement: 1, baseAtk: 542, subStat: null },
  artifactSets: { [ARTIFACT_SET_IDS.huskOfOpulentDreams]: 4 },
  fourPieceSetId: ARTIFACT_SET_IDS.huskOfOpulentDreams,
};

const close = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 1e-6 * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);

describe('enemy multipliers', () => {
  it('uses a level 100 enemy', () => close(enemyDefMultiplier(90), 190 / 390));

  it('handles negative and high resistance', () => {
    close(enemyResMultiplier(0.1), 0.9);
    close(enemyResMultiplier(-0.1), 1.05);
    close(enemyResMultiplier(0.8), 1 / 4.2);
  });
});

describe('calculateNoelleDamage', () => {
  it('computes Mono Geo N4 with Redhorn and Husk', () => {
    const result = calculateNoelleDamage(build, {
      attackType: 'Na4',
      team: { geoResonance: true, gorou: { constellation: 6 } },
    });

    // Husk 4 stacks (+24%) and Gorou A1 (+25%) on base DEF, plus Gorou's flat DEF at skill level 13
    const def = 3000 + 799 * (0.24 + 0.25) + 438.1;
    close(result.totalDef, def);
    const base = (900 + def * 1.35) * 2.242 + def * 0.4; // Redhorn R1 flat DMG
    const dmgBonus = 1 + 0.466 + 0.24 + 0.15 + 0.15; // goblet, Husk, Geo resonance, Gorou Crunch
    const crit = 1 + 0.6 * (1.5 + 0.4); // Gorou C6
    const expected = base * dmgBonus * crit * (190 / 390) * (1 - (0.1 - 0.2) / 2);
    close(result.finalDamage, expected);
    assert.equal(result.lunarCrystallizeDmg, 0);
  });

  it('scales weapon passives with refinement', () => {
    const r1 = calculateNoelleDamage(build, { attackType: 'Na4', team: {} });
    const r5 = calculateNoelleDamage({ ...build, weapon: { ...build.weapon, refinement: 5 } }, { attackType: 'Na4', team: {} });
    close(r5.flatDmg - r1.flatDmg, r1.totalDef * 0.4);
  });

  it('does not add Redhorn flat DMG or Whiteblind stacks to plunges', () => {
    assert.equal(calculateNoelleDamage(build, { attackType: 'Plunge', team: {} }).flatDmg, 0);

    const whiteblind = { ...build, weapon: { ...build.weapon, id: WEAPON_IDS.whiteblind } };
    const normal = calculateNoelleDamage(whiteblind, { attackType: 'Na4', team: {} });
    const plunge = calculateNoelleDamage(whiteblind, { attackType: 'Plunge', team: {} });
    close(normal.totalAtk - plunge.totalAtk, 733 * 0.24);
    close(normal.totalDef - plunge.totalDef, 799 * 0.24);
  });

  it('only applies Xianyun buffs to plunging attacks', () => {
    const team = { xianyun: { constellation: 0, atk: 2180 } };
    assert.equal(calculateNoelleDamage(build, { attackType: 'Na4', team }).critRate, 0.6);
    const plunge = calculateNoelleDamage(build, { attackType: 'Plunge', team });
    close(plunge.flatDmg, 4360);
    close(plunge.critRate, 0.64);
  });

  it('gives Marechaussee Hunter crit rate only when HP fluctuates', () => {
    const hunter: NoelleBuild = {
      ...build,
      artifactSets: { [ARTIFACT_SET_IDS.marechausseeHunter]: 4 },
      fourPieceSetId: ARTIFACT_SET_IDS.marechausseeHunter,
    };
    close(calculateNoelleDamage(hunter, { attackType: 'Na4', team: {} }).critRate, 0.6);
    close(calculateNoelleDamage(hunter, { attackType: 'Na4', team: { furina: { constellation: 0 } } }).critRate, 0.96);
    // 2-piece Normal/Charged bonus, not for plunges
    const na = calculateNoelleDamage(hunter, { attackType: 'Na4', team: {} });
    const plunge = calculateNoelleDamage(hunter, { attackType: 'Plunge', team: {} });
    close(na.dmgBonus - plunge.dmgBonus, 0.15);
  });

  it('applies Furina Fanfare by constellation', () => {
    close(calculateNoelleDamage(build, { attackType: 'Na4', team: { furina: { constellation: 0 } } }).dmgBonus, 0.466 + 0.24 + 0.5);
    close(calculateNoelleDamage(build, { attackType: 'Na4', team: { furina: { constellation: 3 } } }).dmgBonus, 0.466 + 0.24 + 1.24);
  });

  it('caps crit rate at 100%', () => {
    const crit = { ...build, stats: { ...build.stats, critRate: 1.2 } };
    const capped = calculateNoelleDamage(crit, { attackType: 'Na4', team: {} });
    const full = calculateNoelleDamage({ ...build, stats: { ...build.stats, critRate: 1 } }, { attackType: 'Na4', team: {} });
    close(capped.finalDamage, full.finalDamage);
  });

  it('adds Lunar Crystallize damage', () => {
    const result = calculateNoelleDamage(build, { attackType: 'Na4', team: { columbina: { constellation: 0 }, linnea: true } });
    const res = enemyResMultiplier(0.1 - 0.35);
    close(result.lunarCrystallizeDmg, 1446.85 * 0.96 * 0.21 * (1 + 0.4) * res * (1 + 0.6 * 1.5));
  });
});
