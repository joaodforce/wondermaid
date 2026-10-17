import { NOELLE_CHARACTER_ID, NOELLE_TALENTS } from '@/modules/calculator/data';
import type {
  ArtifactPiece,
  ArtifactSlot,
  NoelleBuild,
  NoelleStats,
  StatLine,
  Talents,
  WeaponInfo,
} from '@/modules/calculator/types';
import { EnkaError, type EnkaAvatar, type EnkaResponse } from './types';

// fightPropMap IDs (https://github.com/EnkaNetwork/API-docs/blob/master/docs/gi/api.md#fightprop)
export const FIGHT_PROPS = {
  hp: 2000,
  baseAtk: 4,
  atk: 2001,
  atkPercent: 6,
  baseDef: 7,
  def: 2002,
  defPercent: 9,
  critRate: 20,
  critDmg: 22,
  energyRecharge: 23,
  elementalMastery: 28,
  geoDmgBonus: 45,
} as const satisfies Record<keyof NoelleStats, number>;

const LEVEL_PROP = '4001';

const EQUIP_SLOTS: Record<string, ArtifactSlot> = {
  EQUIP_BRACER: 'flower',
  EQUIP_NECKLACE: 'plume',
  EQUIP_SHOES: 'sands',
  EQUIP_RING: 'goblet',
  EQUIP_DRESS: 'circlet',
};
const SLOT_ORDER = Object.values(EQUIP_SLOTS);
// Artifact icons are named after their set, e.g. UI_RelicIcon_15021_4
const RELIC_ICON_PATTERN = /^UI_RelicIcon_(\d+)_\d+$/;

export interface PlayerProfile {
  nickname: string;
  level: number | null;
  profilePictureId: number | null;
}

export function parsePlayerProfile(data: EnkaResponse, uid: string): PlayerProfile {
  const info = data.playerInfo ?? {};
  return {
    nickname: info.nickname?.trim() || `Traveler ${uid}`,
    level: info.level ?? null,
    profilePictureId: info.profilePicture?.avatarId ?? info.profilePicture?.id ?? null,
  };
}

export function findNoelle(data: EnkaResponse): EnkaAvatar {
  if (!data.avatarInfoList?.length) {
    throw new EnkaError(
      'SHOWCASE_HIDDEN',
      'Character details are hidden. Turn on "Show Character Details" in your in-game profile and try again in a few minutes.',
    );
  }
  const noelle = data.avatarInfoList.find((avatar) => avatar.avatarId === NOELLE_CHARACTER_ID);
  if (!noelle) {
    throw new EnkaError(
      'NOELLE_NOT_FOUND',
      'Noelle is not in your character showcase. Add her in-game and try again in a few minutes.',
    );
  }
  return noelle;
}

export function parseStats(avatar: EnkaAvatar): NoelleStats {
  const fightProps = avatar.fightPropMap ?? {};
  const entries = Object.entries(FIGHT_PROPS).map(([key, id]) => [key, fightProps[id] ?? 0]);
  return Object.fromEntries(entries) as NoelleStats;
}

export function parseWeapon(avatar: EnkaAvatar): WeaponInfo {
  const equip = avatar.equipList?.find((item) => item.flat?.itemType === 'ITEM_WEAPON');
  if (!equip) throw new EnkaError('UNAVAILABLE', 'Enka.Network returned Noelle without a weapon. Try again later.');

  const stats = equip.flat.weaponStats ?? [];
  const baseAtk = stats.find((stat) => stat.appendPropId === 'FIGHT_PROP_BASE_ATTACK');
  const subStat = stats.find((stat) => stat.appendPropId && stat.appendPropId !== 'FIGHT_PROP_BASE_ATTACK');
  // affixMap holds the refinement as 0-4; 1-2 star weapons have none
  const affix = Object.values(equip.weapon?.affixMap ?? {})[0] ?? 0;

  return {
    id: equip.itemId,
    level: equip.weapon?.level ?? 1,
    refinement: affix + 1,
    baseAtk: baseAtk?.statValue ?? 0,
    subStat: subStat?.appendPropId ? { type: subStat.appendPropId, value: subStat.statValue } : null,
    icon: equip.flat.icon,
    rarity: equip.flat.rankLevel,
  };
}

/** Equipped piece count per artifact set ID */
export function parseArtifactSets(avatar: EnkaAvatar): Record<number, number> {
  const sets: Record<number, number> = {};
  for (const item of avatar.equipList ?? []) {
    if (item.flat?.itemType !== 'ITEM_RELIQUARY') continue;
    const setId = Number(RELIC_ICON_PATTERN.exec(item.flat.icon)?.[1]);
    if (setId) sets[setId] = (sets[setId] ?? 0) + 1;
  }
  return sets;
}

const statLine = (stat: { mainPropId?: string; appendPropId?: string; statValue: number }): StatLine => ({
  type: stat.mainPropId ?? stat.appendPropId ?? '',
  value: stat.statValue,
});

export function parseArtifacts(avatar: EnkaAvatar): ArtifactPiece[] {
  const pieces: ArtifactPiece[] = [];
  for (const item of avatar.equipList ?? []) {
    const slot = EQUIP_SLOTS[item.flat?.equipType ?? ''];
    if (item.flat?.itemType !== 'ITEM_RELIQUARY' || !slot || !item.flat.reliquaryMainstat) continue;
    pieces.push({
      slot,
      setId: Number(RELIC_ICON_PATTERN.exec(item.flat.icon)?.[1]) || 0,
      // Enka reports levels as 1-21
      level: Math.max((item.reliquary?.level ?? 1) - 1, 0),
      rarity: item.flat.rankLevel ?? 5,
      icon: item.flat.icon,
      mainStat: statLine(item.flat.reliquaryMainstat),
      subStats: (item.flat.reliquarySubstats ?? []).map(statLine),
    });
  }
  return pieces.sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));
}

export function parseTalents(avatar: EnkaAvatar): Talents {
  const level = ({ skillId, proudGroupId }: { skillId: number; proudGroupId: number }) => {
    const bonus = avatar.proudSkillExtraLevelMap?.[proudGroupId] ?? 0;
    return { level: (avatar.skillLevelMap?.[skillId] ?? 1) + bonus, bonus };
  };
  return {
    normal: level(NOELLE_TALENTS.normal),
    skill: level(NOELLE_TALENTS.skill),
    burst: level(NOELLE_TALENTS.burst),
  };
}

export function fourPieceSetId(sets: Record<number, number>): number | null {
  const entry = Object.entries(sets).find(([, count]) => count >= 4);
  return entry ? Number(entry[0]) : null;
}

export function parseNoelleBuild(avatar: EnkaAvatar): NoelleBuild {
  const artifactSets = parseArtifactSets(avatar);
  return {
    level: Number(avatar.propMap?.[LEVEL_PROP]?.val) || 90,
    constellation: avatar.talentIdList?.length ?? 0,
    stats: parseStats(avatar),
    weapon: parseWeapon(avatar),
    artifactSets,
    fourPieceSetId: fourPieceSetId(artifactSets),
    artifacts: parseArtifacts(avatar),
    talents: parseTalents(avatar),
  };
}
