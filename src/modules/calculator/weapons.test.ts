import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { WEAPON_IDS } from './data';
import type { NoelleBuild } from './types';
import { withFixedWeapon } from './weapons';

const close = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 1e-6 * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);

// Noelle (base ATK 191, base DEF 799, 30% DEF ascension) with Serpent Spine R1 and artifacts adding
// 311 flat ATK, 20% ATK, 100% DEF, 40 flat DEF, 40% crit rate
const serpentSpine: NoelleBuild = {
  level: 90,
  constellation: 6,
  stats: {
    hp: 12071,
    baseAtk: 701,
    atkPercent: 0.2,
    atk: 701 * 1.2 + 311,
    baseDef: 799,
    defPercent: 1.3,
    def: 799 * 2.3 + 40,
    critRate: 0.05 + 0.276 + 0.4,
    critDmg: 0.5,
    energyRecharge: 1,
    elementalMastery: 0,
    geoDmgBonus: 0.466,
  },
  weapon: {
    id: WEAPON_IDS.serpentSpine,
    level: 90,
    refinement: 1,
    baseAtk: 510,
    subStat: { type: 'FIGHT_PROP_CRITICAL', value: 27.6 },
  },
  artifactSets: {},
  fourPieceSetId: null,
};

describe('withFixedWeapon', () => {
  it("swaps the player's weapon stats for the fixed weapon's", () => {
    const { stats, weapon } = withFixedWeapon(serpentSpine, { id: WEAPON_IDS.redhornStonethresher, refinement: 1 });
    close(stats.baseAtk, 191 + 542);
    close(stats.atk, (191 + 542) * 1.2 + 311);
    // Redhorn's 28% DEF passive is added, Serpent Spine's crit rate substat taken out
    close(stats.defPercent, 1.3 + 0.28);
    close(stats.def, 799 * (1 + 1.58) + 40);
    close(stats.critRate, 0.05 + 0.4);
    close(stats.critDmg, 0.5 + 0.882);
    assert.equal(weapon.id, WEAPON_IDS.redhornStonethresher);
    assert.equal(weapon.refinement, 1);
  });

  it('round-trips back to the original weapon', () => {
    const redhorn = withFixedWeapon(serpentSpine, { id: WEAPON_IDS.redhornStonethresher, refinement: 3 });
    const back = withFixedWeapon(redhorn, { id: WEAPON_IDS.serpentSpine, refinement: 1 });
    for (const [key, value] of Object.entries(serpentSpine.stats)) {
      close(back.stats[key as keyof typeof back.stats], value);
    }
  });

  it('removes static passives by refinement', () => {
    const ownRedhornR5 = withFixedWeapon(serpentSpine, { id: WEAPON_IDS.redhornStonethresher, refinement: 5 });
    const whiteblind = withFixedWeapon(ownRedhornR5, { id: WEAPON_IDS.whiteblind, refinement: 1 });
    close(whiteblind.stats.defPercent, 1.3 + 0.517);
  });
});
