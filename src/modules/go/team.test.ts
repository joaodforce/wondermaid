import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { conditionals } from '@genshin-optimizer/gi/formula';
import type { EnkaAvatar } from '@/modules/enka/types';
import { NOELLE_INFO, SUPPORT_ALLOWLIST } from '@/modules/team/characters';
import { toGoodMember, type GoodMember } from './good';
import { CHARACTER_KEYS } from './keys';
import { CHARACTER_PRESETS } from './presets';
import { calculateTeam } from './team';

const member = (key: GoodMember['char']['key'], constellation: number, weapon: GoodMember['weapon']['key'], refinement = 1): GoodMember => ({
  char: { key, level: 90, ascension: 6, constellation, talent: { auto: 10, skill: 10, burst: 10 } },
  weapon: { key: weapon, level: 90, ascension: 6, refinement: refinement as 1, location: '', lock: false },
  artifacts: [],
});
const noelle = member('Noelle', 6, 'RedhornStonethresher');
const zhongli = member('Zhongli', 0, 'FavoniusLance');
const yunJin = member('YunJin', 6, 'FavoniusLance');
const gorou = (constellation: number) => member('Gorou', constellation, 'FavoniusWarbow');

describe('presets', () => {
  it('covers every allowed character with conditional names Genshin Optimizer knows', () => {
    for (const info of [NOELLE_INFO, ...SUPPORT_ALLOWLIST]) {
      const key = CHARACTER_KEYS[info.id];
      assert.ok(key, `${info.name} has no GO key`);
      const preset = CHARACTER_PRESETS[key];
      assert.ok(preset, `${info.name} has no preset`);
      // GO silently ignores unknown conditional names, so a typo would quietly drop a buff
      const known = new Set<string>(Object.keys((conditionals as Record<string, Record<string, unknown>>)[key] ?? {}));
      for (const name of Object.keys(preset)) assert.ok(known.has(name), `${key}.${name} is not a GO conditional`);
    }
  });
});

describe('toGoodMember', () => {
  it("converts an Enka character's levels, weapon and artifacts", () => {
    const avatar: EnkaAvatar = {
      avatarId: 10000055,
      talentIdList: [1, 2],
      propMap: { '4001': { type: 4001, val: '80' }, '1002': { type: 1002, val: '5' } },
      skillLevelMap: { '10551': 1, '10552': 9, '10555': 8 },
      equipList: [
        { itemId: 15402, weapon: { level: 90, promoteLevel: 6, affixMap: { x: 4 } }, flat: { itemType: 'ITEM_WEAPON', icon: 'x' } },
        {
          itemId: 1,
          flat: {
            itemType: 'ITEM_RELIQUARY',
            icon: 'UI_RelicIcon_15007_4',
            reliquaryMainstat: { mainPropId: 'FIGHT_PROP_DEFENSE_PERCENT', statValue: 58.3 },
            reliquarySubstats: [
              { appendPropId: 'FIGHT_PROP_CHARGE_EFFICIENCY', statValue: 11 },
              { appendPropId: 'FIGHT_PROP_DEFENSE', statValue: 37 },
            ],
          },
        },
      ],
    };
    const good = toGoodMember(avatar, [10551, 10552, 10555]);
    assert.deepEqual(good?.char, { key: 'Gorou', level: 80, ascension: 5, constellation: 2, talent: { auto: 1, skill: 9, burst: 8 } });
    assert.equal(good?.weapon.key, 'TheStringless');
    assert.equal(good?.weapon.refinement, 5);
    assert.deepEqual(good?.artifacts, [
      { set: 'NoblesseOblige', stats: [{ key: 'def_', value: 0.583 }, { key: 'enerRech_', value: 0.11 }, { key: 'def', value: 37 }] },
    ]);
  });
});

describe('calculateTeam', () => {
  it("adds Gorou's C6 Geo CRIT DMG with three or more Geo members", () => {
    const c0 = calculateTeam([noelle, gorou(0), zhongli, yunJin]);
    const c6 = calculateTeam([noelle, gorou(6), zhongli, yunJin]);
    assert.ok(Math.abs(c6.stats.critDmg - c0.stats.critDmg - 0.4) < 1e-9);
    assert.equal(c6.attack, 'Na4');
  });

  it('measures each teammate by taking them out of the party', () => {
    const result = calculateTeam([noelle, gorou(6), zhongli, yunJin]);
    assert.equal(result.damageWithout.length, 3);
    for (const without of result.damageWithout) assert.ok(without < result.finalDamage);
    assert.ok(result.conditionals.some((c) => c.sheet === 'Gorou' && c.name === 'afterBurst'));
    assert.ok(result.conditionals.some((c) => c.sheet === 'Noelle' && c.name === 'SweepingTime'));
  });

  it('ranks a plunge with Xianyun', () => {
    const result = calculateTeam([noelle, member('Xianyun', 0, 'CranesEchoingCall', 2), gorou(6), zhongli]);
    assert.equal(result.attack, 'Plunge');
    assert.ok(result.conditionals.some((c) => c.sheet === 'CranesEchoingCall'));
  });

  it('requires Noelle first', () => {
    assert.throws(() => calculateTeam([gorou(6), noelle]));
  });
});

describe('memberConditionals', () => {
  it("leaves out constellation effects the character doesn't have", () => {
    const names = calculateTeam([noelle, member('Xianyun', 0, 'CranesEchoingCall'), gorou(6), zhongli]).conditionals
      .filter((c) => c.sheet === 'Xianyun')
      .map((c) => c.name);
    assert.deepEqual(names, ['a1Stacks', 'a4HasStacks']);
  });
});
