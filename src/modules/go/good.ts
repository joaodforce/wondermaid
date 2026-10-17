import type { ArtifactSetKey, AscensionKey, MainStatKey, RefinementKey, SubstatKey } from '@genshin-optimizer/gi/consts';
import type { ICharacter, IWeapon } from '@genshin-optimizer/gi/good';
import type { EnkaAvatar } from '@/modules/enka/types';
import { ARTIFACT_SET_KEYS, CHARACTER_KEYS, WEAPON_KEYS } from './keys';

/** One party member in Genshin Optimizer's GOOD shape, as its formula engine takes it */
export interface GoodMember {
  char: ICharacter;
  weapon: IWeapon;
  artifacts: { set: ArtifactSetKey; stats: { key: MainStatKey | SubstatKey; value: number }[] }[];
}

// Enka stat names → GO stat keys; GO takes percentages as fractions
const STAT_KEYS: Record<string, MainStatKey | SubstatKey> = {
  FIGHT_PROP_HP: 'hp',
  FIGHT_PROP_HP_PERCENT: 'hp_',
  FIGHT_PROP_ATTACK: 'atk',
  FIGHT_PROP_ATTACK_PERCENT: 'atk_',
  FIGHT_PROP_DEFENSE: 'def',
  FIGHT_PROP_DEFENSE_PERCENT: 'def_',
  FIGHT_PROP_CRITICAL: 'critRate_',
  FIGHT_PROP_CRITICAL_HURT: 'critDMG_',
  FIGHT_PROP_ELEMENT_MASTERY: 'eleMas',
  FIGHT_PROP_CHARGE_EFFICIENCY: 'enerRech_',
  FIGHT_PROP_HEAL_ADD: 'heal_',
  FIGHT_PROP_PHYSICAL_ADD_HURT: 'physical_dmg_',
  FIGHT_PROP_ELEC_ADD_HURT: 'electro_dmg_',
  FIGHT_PROP_ROCK_ADD_HURT: 'geo_dmg_',
  FIGHT_PROP_FIRE_ADD_HURT: 'pyro_dmg_',
  FIGHT_PROP_WATER_ADD_HURT: 'hydro_dmg_',
  FIGHT_PROP_ICE_ADD_HURT: 'cryo_dmg_',
  FIGHT_PROP_WIND_ADD_HURT: 'anemo_dmg_',
  FIGHT_PROP_GRASS_ADD_HURT: 'dendro_dmg_',
};
const FLAT_STATS = new Set(['hp', 'atk', 'def', 'eleMas']);
const RELIC_ICON_PATTERN = /^UI_RelicIcon_(\d+)_\d+$/;
const LEVEL_PROP = '4001';
const ASCENSION_PROP = '1002';
// Lowest level each ascension allows past (20/40/50/60/70/80), used when Enka omits the ascension
const ASCENSION_CAPS = [20, 40, 50, 60, 70, 80];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const ascensionFor = (level: number) => ASCENSION_CAPS.filter((cap) => level > cap).length;

/**
 * Converts an Enka showcase character to GO's format, or null if GO doesn't know the character or weapon.
 * `skillIds` are the [normal attack, skill, burst] IDs; GO takes base talent levels and adds constellation boosts itself.
 */
export function toGoodMember(avatar: EnkaAvatar, skillIds: readonly number[]): GoodMember | null {
  const charKey = CHARACTER_KEYS[avatar.avatarId];
  const weaponEquip = avatar.equipList?.find((item) => item.flat?.itemType === 'ITEM_WEAPON');
  const weaponKey = weaponEquip && WEAPON_KEYS[weaponEquip.itemId];
  if (!charKey || !weaponEquip || !weaponKey) return null;

  const level = clamp(Number(avatar.propMap?.[LEVEL_PROP]?.val) || 1, 1, 100);
  const ascension = Number(avatar.propMap?.[ASCENSION_PROP]?.val ?? ascensionFor(level));
  const [auto, skill, burst] = skillIds.map((id) => avatar.skillLevelMap?.[id] ?? 1);
  const weaponLevel = clamp(weaponEquip.weapon?.level ?? 1, 1, 90);
  const refinement = (Object.values(weaponEquip.weapon?.affixMap ?? {})[0] ?? 0) + 1;

  const artifacts: GoodMember['artifacts'] = [];
  for (const item of avatar.equipList ?? []) {
    if (item.flat?.itemType !== 'ITEM_RELIQUARY') continue;
    const set = ARTIFACT_SET_KEYS[Number(RELIC_ICON_PATTERN.exec(item.flat.icon)?.[1])];
    if (!set) continue;
    const stats = [item.flat.reliquaryMainstat, ...(item.flat.reliquarySubstats ?? [])].flatMap((stat) => {
      const key = stat && STAT_KEYS[stat.mainPropId ?? stat.appendPropId ?? ''];
      if (!stat || !key) return [];
      return [{ key, value: FLAT_STATS.has(key) ? stat.statValue : stat.statValue / 100 }];
    });
    artifacts.push({ set, stats });
  }

  return {
    char: {
      key: charKey,
      level,
      ascension: clamp(ascension, 0, 6) as AscensionKey,
      constellation: clamp(avatar.talentIdList?.length ?? 0, 0, 6),
      talent: { auto, skill, burst },
    },
    weapon: {
      key: weaponKey,
      level: weaponLevel,
      ascension: clamp(weaponEquip.weapon?.promoteLevel ?? ascensionFor(weaponLevel), 0, 6) as AscensionKey,
      refinement: clamp(refinement, 1, 5) as RefinementKey,
      location: '',
      lock: false,
    },
    artifacts,
  };
}
