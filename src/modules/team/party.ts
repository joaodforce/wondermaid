import { NOELLE_CHARACTER_ID } from '@/modules/calculator/data';
import type { ArtifactPiece, WeaponInfo } from '@/modules/calculator/types';
import { fourPieceSetId, parseArtifacts, parseArtifactSets, parseWeapon } from '@/modules/enka/mapper';
import type { EnkaAvatar } from '@/modules/enka/types';
import { toGoodMember, type GoodMember } from '@/modules/go/good';
import { NOELLE_INFO, supportInfo, type CharacterInfo } from './characters';

export type Element = 'geo' | 'hydro' | 'anemo' | 'pyro' | 'electro' | 'cryo' | 'dendro';

/** Any party member's build as shown on the Team Showcase */
export interface CharacterBuild {
  id: number;
  name: string;
  element: Element;
  rarity: 4 | 5;
  icon: string;
  level: number;
  constellation: number;
  /** Normal attack, skill and burst levels including constellation boosts */
  talents: [number, number, number];
  stats: { hp: number; baseAtk: number; atk: number; def: number; em: number; er: number; critRate: number; critDmg: number };
  weapon: WeaponInfo;
  artifactSets: Record<number, number>;
  fourPieceSetId: number | null;
  artifacts: ArtifactPiece[];
}

const MAX_TEAMMATES = 3;

const fightProp = (avatar: EnkaAvatar, id: number) => avatar.fightPropMap?.[id] ?? 0;

function talentLevels(avatar: EnkaAvatar, info: CharacterInfo): [number, number, number] {
  const [normal, skill, burst] = info.skills.map(
    ({ skillId, proudGroupId }) =>
      (avatar.skillLevelMap?.[skillId] ?? 1) + (avatar.proudSkillExtraLevelMap?.[proudGroupId] ?? 0),
  );
  return [normal, skill, burst];
}

export function parseCharacterBuild(avatar: EnkaAvatar, info: CharacterInfo): CharacterBuild {
  const artifactSets = parseArtifactSets(avatar);
  return {
    id: info.id,
    name: info.name,
    element: info.element,
    rarity: info.rarity,
    icon: info.icon,
    level: Number(avatar.propMap?.['4001']?.val) || 90,
    constellation: avatar.talentIdList?.length ?? 0,
    talents: talentLevels(avatar, info),
    stats: {
      hp: fightProp(avatar, 2000),
      baseAtk: fightProp(avatar, 4),
      atk: fightProp(avatar, 2001),
      def: fightProp(avatar, 2002),
      em: fightProp(avatar, 28),
      er: fightProp(avatar, 23),
      critRate: fightProp(avatar, 20),
      critDmg: fightProp(avatar, 22),
    },
    weapon: parseWeapon(avatar),
    artifactSets,
    fourPieceSetId: fourPieceSetId(artifactSets),
    artifacts: parseArtifacts(avatar),
  };
}

export type TeamValidationError = 'WRONG_SIZE' | 'DUPLICATE' | 'NOT_ALLOWED' | 'NOT_IN_SHOWCASE' | 'NO_NOELLE' | 'UNSUPPORTED';

/** A party picked from a showcase: Noelle first, then the teammates, as shown and as the calculator takes them. */
export interface SelectedParty {
  builds: CharacterBuild[];
  good: GoodMember[];
}

function member(avatar: EnkaAvatar, info: CharacterInfo) {
  const skillIds = info.skills.map((skill) => skill.skillId);
  return { build: parseCharacterBuild(avatar, info), good: toGoodMember(avatar, skillIds) };
}

/** Picks Noelle and the chosen teammates out of a showcase, or says why the selection is invalid. */
export function selectParty(
  avatars: EnkaAvatar[],
  teammateIds: number[],
): SelectedParty | { error: TeamValidationError; name?: string } {
  if (teammateIds.length !== MAX_TEAMMATES) return { error: 'WRONG_SIZE' };
  if (new Set(teammateIds).size !== teammateIds.length) return { error: 'DUPLICATE' };

  const noelleAvatar = avatars.find((avatar) => avatar.avatarId === NOELLE_CHARACTER_ID);
  if (!noelleAvatar) return { error: 'NO_NOELLE' };

  const members = [member(noelleAvatar, NOELLE_INFO)];
  for (const id of teammateIds) {
    const info = supportInfo(id);
    if (!info) return { error: 'NOT_ALLOWED' };
    const avatar = avatars.find((a) => a.avatarId === id);
    if (!avatar) return { error: 'NOT_IN_SHOWCASE' };
    members.push(member(avatar, info));
  }

  const good: GoodMember[] = [];
  for (const { build, good: goodMember } of members) {
    // Genshin Optimizer doesn't know every brand-new character or weapon right away
    if (!goodMember) return { error: 'UNSUPPORTED', name: build.name };
    good.push(goodMember);
  }
  return { builds: members.map((m) => m.build), good };
}
