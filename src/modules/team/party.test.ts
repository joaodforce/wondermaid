import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { EnkaAvatar } from '@/modules/enka/types';
import { selectParty } from './party';

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

describe('selectParty validation', () => {
  it('rejects invalid selections', () => {
    assert.deepEqual(selectParty(showcase, [10000055, 10000089]), { error: 'WRONG_SIZE' });
    assert.deepEqual(selectParty(showcase, [10000055, 10000055, 10000089]), { error: 'DUPLICATE' });
    assert.deepEqual(selectParty(showcase, [10000055, 10000089, 10000106]), { error: 'NOT_ALLOWED' });
    assert.deepEqual(selectParty(showcase, [10000055, 10000089, 10000060]), { error: 'NOT_IN_SHOWCASE' });
    assert.deepEqual(selectParty([gorou, furina, zhongli], [10000055, 10000089, 10000030]), { error: 'NO_NOELLE' });
  });
});

describe('selectParty', () => {
  it('returns the builds and their Genshin Optimizer form, Noelle first', () => {
    const party = selectParty(showcase, [10000055, 10000030, 10000064]);
    if ('error' in party) throw new Error(party.error);
    assert.deepEqual(party.builds.map((b) => b.name), ['Noelle', 'Gorou', 'Zhongli', 'Yun Jin']);
    assert.deepEqual(party.good.map((m) => m.char.key), ['Noelle', 'Gorou', 'Zhongli', 'YunJin']);
    // GO takes base talent levels and adds Noelle's C3/C5 boosts itself
    assert.deepEqual(party.good[0].char.talent, { auto: 10, skill: 9, burst: 10 });
    assert.deepEqual(party.builds[0].talents, [10, 12, 13]);
  });

  it('names a member Genshin Optimizer cannot calculate', () => {
    const unknownWeapon = avatar(10000055, 6, {}, { equipList: [weapon(99999)] });
    assert.deepEqual(selectParty([noelle, unknownWeapon, zhongli, yunJin], [10000055, 10000030, 10000064]), {
      error: 'UNSUPPORTED',
      name: 'Gorou',
    });
  });
});
