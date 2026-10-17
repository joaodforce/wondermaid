import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { explainNoelleDamage } from '@/modules/calculator/noelle';
import type { EnkaAvatar } from '@/modules/enka/types';
import { selectParty, teamScenario } from './party';

const weapon = (itemId: number, refinement = 1) => ({
  itemId,
  weapon: { level: 90, affixMap: { x: refinement - 1 } },
  flat: {
    itemType: 'ITEM_WEAPON' as const,
    icon: 'icon',
    weaponStats: [{ appendPropId: 'FIGHT_PROP_BASE_ATTACK', statValue: 500 }],
  },
});
const relics = (setId: number) =>
  [1, 2, 3, 4, 5].map((n) => ({ itemId: n, flat: { itemType: 'ITEM_RELIQUARY' as const, icon: `UI_RelicIcon_${setId}_${n}` } }));

const avatar = (avatarId: number, cons: number, skills: Record<string, number>, extra: Partial<EnkaAvatar> = {}): EnkaAvatar => ({
  avatarId,
  talentIdList: Array.from({ length: cons }, (_, i) => i),
  propMap: { '4001': { type: 4001, val: '90' } },
  skillLevelMap: skills,
  fightPropMap: { '4': 700, '2001': 2000, '7': 799, '2002': 3000, '20': 0.6, '22': 1.5, '45': 0.466, '2000': 15000 },
  equipList: [...relics(15021), weapon(12510)],
  ...extra,
});

const noelle = avatar(10000034, 6, { '10341': 10, '10342': 9, '10343': 10 }, { proudSkillExtraLevelMap: { '3432': 3, '3439': 3 } });
const gorou = avatar(10000055, 6, { '10551': 1, '10552': 10, '10555': 9 }, { equipList: [...relics(15007), weapon(15402)] });
const furina = avatar(10000089, 2, { '10891': 1, '10892': 9, '10895': 10 });
const zhongli = avatar(10000030, 0, { '10301': 1, '10302': 10, '10303': 10 }, { equipList: [...relics(15017), weapon(13504)] });
const yunJin = avatar(10000064, 6, { '10641': 1, '10642': 9, '10643': 10 }, { equipList: [...relics(15007), weapon(13401)] });
const mavuika = avatar(10000106, 0, {});
const showcase = [noelle, gorou, furina, zhongli, yunJin, mavuika];

describe('selectParty', () => {
  it('rejects invalid selections', () => {
    assert.deepEqual(selectParty(showcase, [10000055, 10000089]), { error: 'WRONG_SIZE' });
    assert.deepEqual(selectParty(showcase, [10000055, 10000055, 10000089]), { error: 'DUPLICATE' });
    assert.deepEqual(selectParty(showcase, [10000055, 10000089, 10000106]), { error: 'NOT_ALLOWED' });
    assert.deepEqual(selectParty(showcase, [10000055, 10000089, 10000060]), { error: 'NOT_IN_SHOWCASE' });
    assert.deepEqual(selectParty([gorou, furina, zhongli], [10000055, 10000089, 10000030]), { error: 'NO_NOELLE' });
  });
});

describe('teamScenario', () => {
  const party = selectParty(showcase, [10000055, 10000030, 10000064]);
  if ('error' in party) throw new Error(party.error);
  const { scenario, effects } = teamScenario(party.noelleBuild, party.teammates);

  it("derives buffs from the teammates' real builds", () => {
    assert.equal(scenario.attackType, 'Na4');
    assert.deepEqual(scenario.noelle, { constellation: 6, burstLevel: 13 });
    assert.equal(scenario.team.geoResonance, true);
    // Noelle, Gorou, Zhongli and Yun Jin are all Geo; Gorou counts at most 3
    assert.deepEqual(scenario.team.gorou, { constellation: 6, skillLevel: 10, geoCount: 4 });
    assert.equal(scenario.team.zhongli, true);
  });

  it('counts party set buffs once each', () => {
    assert.deepEqual(
      scenario.team.extraBuffs?.map((b) => b.source),
      ["Gorou's Noblesse Oblige (4)", "Zhongli's Tenacity of the Millelith (4)"],
    );
  });

  it('flags teammates whose kit is not modeled', () => {
    assert.deepEqual(
      effects.map((e) => [e.name, e.modeled]),
      [
        ['Gorou', true],
        ['Zhongli', true],
        ['Yun Jin', false],
      ],
    );
  });

  it("uses Noelle's real burst level and her own weapon", () => {
    const e = explainNoelleDamage(party.noelle, scenario);
    assert.ok(Math.abs(e.burstDefToAtk - (0.4 * 2.125 + 0.5)) < 1e-9);
    assert.equal(e.weaponSwapped, false);
    assert.ok(e.entries.some((entry) => entry.source === 'Gorou C6' && entry.stat === 'critDmg' && entry.value === 0.4));
  });

  it('switches to plunges with Xianyun and reads her ATK and Crane', () => {
    const xianyun = avatar(10000093, 0, { '10931': 1, '10932': 9, '10935': 9 }, { equipList: [...relics(15003), weapon(14515, 2)] });
    const withXianyun = selectParty([...showcase, xianyun], [10000093, 10000089, 10000030]);
    if ('error' in withXianyun) throw new Error(withXianyun.error);
    const { scenario: plunge } = teamScenario(withXianyun.noelleBuild, withXianyun.teammates);
    assert.equal(plunge.attackType, 'Plunge');
    assert.deepEqual(plunge.team.xianyun, { constellation: 0, atk: 2000, craneRefinement: 2 });
    assert.deepEqual(plunge.team.furina, { constellation: 2, burstLevel: 10 });
    assert.equal(plunge.team.geoResonance, true);
  });
});
