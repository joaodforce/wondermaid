import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { EnkaError, type EnkaAvatar, type EnkaEquip, type EnkaResponse } from './types';
import { findNoelle, parseNoelleBuild, parsePlayerProfile } from './mapper';

const relic = (setId: number, slot: number): EnkaEquip => ({
  itemId: 95400 + slot,
  reliquary: { level: 21, mainPropId: 10001 },
  flat: { itemType: 'ITEM_RELIQUARY', icon: `UI_RelicIcon_${setId}_${slot}` },
});

const noelle: EnkaAvatar = {
  avatarId: 10000034,
  talentIdList: [3401, 3402, 3403, 3404, 3405, 3406],
  propMap: { '4001': { type: 4001, val: '90' } },
  fightPropMap: {
    '4': 733.2,
    '6': 0.0466,
    '2001': 900.1,
    '7': 799.0,
    '9': 2.6,
    '2002': 2976.4,
    '20': 0.65,
    '22': 1.4,
    '23': 1.2,
    '28': 80,
    '30': 0.25,
    '45': 0.466,
    '2000': 14000,
  },
  equipList: [
    relic(15021, 4),
    relic(15021, 2),
    relic(15021, 5),
    relic(15021, 1),
    relic(15014, 3),
    {
      itemId: 12510,
      weapon: { level: 90, promoteLevel: 6, affixMap: { '112510': 1 } },
      flat: {
        itemType: 'ITEM_WEAPON',
        icon: 'UI_EquipIcon_Claymore_Itadorimaru',
        weaponStats: [
          { appendPropId: 'FIGHT_PROP_BASE_ATTACK', statValue: 542 },
          { appendPropId: 'FIGHT_PROP_CRITICAL_HURT', statValue: 88.2 },
        ],
      },
    },
  ],
};

describe('parseNoelleBuild', () => {
  const build = parseNoelleBuild(noelle);

  it('maps fightPropMap IDs to stats', () => {
    assert.equal(build.stats.atk, 900.1);
    assert.equal(build.stats.def, 2976.4);
    assert.equal(build.stats.baseDef, 799);
    assert.equal(build.stats.defPercent, 2.6);
    assert.equal(build.stats.critRate, 0.65);
    assert.equal(build.stats.critDmg, 1.4);
    assert.equal(build.stats.energyRecharge, 1.2);
    assert.equal(build.stats.elementalMastery, 80);
    // Geo is 45; 30 is Physical DMG Bonus
    assert.equal(build.stats.geoDmgBonus, 0.466);
  });

  it('reads the weapon, refinement and substat', () => {
    assert.deepEqual(build.weapon, {
      id: 12510,
      level: 90,
      refinement: 2,
      baseAtk: 542,
      subStat: { type: 'FIGHT_PROP_CRITICAL_HURT', value: 88.2 },
    });
  });

  it('counts artifact sets from their icons and finds the 4-piece set', () => {
    assert.deepEqual(build.artifactSets, { 15021: 4, 15014: 1 });
    assert.equal(build.fourPieceSetId, 15021);
  });

  it('reads level and constellation', () => {
    assert.equal(build.level, 90);
    assert.equal(build.constellation, 6);
    assert.equal(parseNoelleBuild({ ...noelle, talentIdList: undefined }).constellation, 0);
  });

  it('has no 4-piece set for 2+2 builds', () => {
    const equipList = [relic(15021, 1), relic(15021, 2), relic(15014, 3), relic(15014, 4), relic(15001, 5)];
    assert.equal(parseNoelleBuild({ ...noelle, equipList: [...equipList, noelle.equipList![5]] }).fourPieceSetId, null);
  });
});

describe('findNoelle', () => {
  const response = (avatarInfoList?: EnkaAvatar[]): EnkaResponse => ({ playerInfo: { nickname: 'Maid' }, avatarInfoList });

  it('rejects hidden showcases and showcases without Noelle', () => {
    assert.throws(() => findNoelle(response()), (error: EnkaError) => error.code === 'SHOWCASE_HIDDEN');
    assert.throws(
      () => findNoelle(response([{ ...noelle, avatarId: 10000002 }])),
      (error: EnkaError) => error.code === 'NOELLE_NOT_FOUND',
    );
    assert.equal(findNoelle(response([noelle])), noelle);
  });
});

describe('parsePlayerProfile', () => {
  it('falls back to a placeholder nickname', () => {
    assert.equal(parsePlayerProfile({ playerInfo: { nickname: ' ' } }, '700000001').nickname, 'Traveler 700000001');
    assert.deepEqual(parsePlayerProfile({ playerInfo: { nickname: 'Maid', level: 60, profilePicture: { id: 3401 } } }, '1'), {
      nickname: 'Maid',
      level: 60,
      profilePictureId: 3401,
    });
  });
});
