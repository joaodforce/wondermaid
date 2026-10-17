import { NOELLE_CHARACTER_ID } from '@/modules/calculator/data';
import type { ArtifactPiece, NoelleBuild, Scenario, TeamConfig, WeaponInfo } from '@/modules/calculator/types';
import { fourPieceSetId, parseArtifacts, parseArtifactSets, parseNoelleBuild, parseWeapon } from '@/modules/enka/mapper';
import type { EnkaAvatar } from '@/modules/enka/types';
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

export interface TeammateEffect {
  id: number;
  name: string;
  /** Whether the character's own kit buffs are in the calculation (sets, weapons and element always are) */
  modeled: boolean;
}

const MAX_TEAMMATES = 3;
const CRANES_ECHOING_CALL = 14515;
const THRILLING_TALES = 14302;
const THRILLING_TALES_ATK = [0.24, 0.3, 0.36, 0.42, 0.48];
// Support sets whose 4-piece effect buffs the whole party (set id → effect)
const PARTY_SETS: Record<number, { stat: 'atkPercent' | 'dmgBonus'; value: number; name: string; note: string }> = {
  15007: { stat: 'atkPercent', value: 0.2, name: 'Noblesse Oblige', note: 'Party ATK +20% after their burst' },
  15017: { stat: 'atkPercent', value: 0.2, name: 'Tenacity of the Millelith', note: 'Party ATK +20% while their skill is up' },
  15037: {
    stat: 'dmgBonus',
    value: 0.12,
    name: 'Scroll of the Hero of Cinder City',
    note: 'Geo DMG +12% after their Nightsoul reaction (Nightsoul burst bonus not counted)',
  },
};
// Teammates whose own buffs the calculator implements (see calculator/team.ts)
const MODELED = new Set([10000055, 10000030, 10000089, 10000060, 10000093, 10000125, 10000130, 10000032]);
// Characters that raise the party's Moonsign (Night of the Sky's Unveiling)
const MOONSIGN = new Set([10000125, 10000130, 10000121, 10000127]);

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

export type TeamValidationError = 'WRONG_SIZE' | 'DUPLICATE' | 'NOT_ALLOWED' | 'NOT_IN_SHOWCASE' | 'NO_NOELLE';

/** Picks Noelle and the chosen teammates out of a showcase, or says why the selection is invalid. */
export function selectParty(
  avatars: EnkaAvatar[],
  teammateIds: number[],
): { noelle: NoelleBuild; noelleBuild: CharacterBuild; teammates: CharacterBuild[] } | { error: TeamValidationError } {
  if (teammateIds.length !== MAX_TEAMMATES) return { error: 'WRONG_SIZE' };
  if (new Set(teammateIds).size !== teammateIds.length) return { error: 'DUPLICATE' };

  const noelleAvatar = avatars.find((avatar) => avatar.avatarId === NOELLE_CHARACTER_ID);
  if (!noelleAvatar) return { error: 'NO_NOELLE' };

  const teammates: CharacterBuild[] = [];
  for (const id of teammateIds) {
    const info = supportInfo(id);
    if (!info) return { error: 'NOT_ALLOWED' };
    const avatar = avatars.find((a) => a.avatarId === id);
    if (!avatar) return { error: 'NOT_IN_SHOWCASE' };
    teammates.push(parseCharacterBuild(avatar, info));
  }
  return {
    noelle: parseNoelleBuild(noelleAvatar),
    noelleBuild: parseCharacterBuild(noelleAvatar, NOELLE_INFO),
    teammates,
  };
}

/**
 * The scenario a real party represents: teammates' buffs come from their actual constellations, talent
 * levels, stats, artifact sets and weapons, and Noelle uses her own weapon, constellation and burst level.
 */
export function teamScenario(noelle: CharacterBuild, teammates: CharacterBuild[]): { scenario: Scenario; effects: TeammateEffect[] } {
  const byId = new Map(teammates.map((t) => [t.id, t]));
  const has = (id: number) => byId.get(id);
  const geoCount = 1 + teammates.filter((t) => t.element === 'geo').length;

  const team: TeamConfig = { geoResonance: geoCount >= 2 };
  const gorou = has(10000055);
  if (gorou) team.gorou = { constellation: gorou.constellation, skillLevel: gorou.talents[1], geoCount };
  if (has(10000030)) team.zhongli = true;
  const furina = has(10000089);
  if (furina) team.furina = { constellation: furina.constellation, burstLevel: furina.talents[2] };
  if (has(10000060)) team.yelan = true;
  const xianyun = has(10000093);
  if (xianyun) {
    team.xianyun = {
      constellation: xianyun.constellation,
      atk: xianyun.stats.atk,
      craneRefinement: xianyun.weapon.id === CRANES_ECHOING_CALL ? xianyun.weapon.refinement : undefined,
    };
  }
  const columbina = has(10000125);
  if (columbina) team.columbina = { constellation: columbina.constellation };
  if (has(10000130)) team.linnea = true;
  const moonsign = teammates.filter((t) => MOONSIGN.has(t.id)).length;
  if (moonsign) team.moonsign = Math.min(moonsign, 2);
  const bennett = has(10000032);
  if (bennett) team.bennett = { constellation: bennett.constellation, baseAtk: bennett.stats.baseAtk, burstLevel: bennett.talents[2] };

  // The same set's party buff doesn't stack, so each counts once
  const extraBuffs: NonNullable<TeamConfig['extraBuffs']> = [];
  const seenSets = new Set<number>();
  for (const teammate of teammates) {
    const set = teammate.fourPieceSetId ? PARTY_SETS[teammate.fourPieceSetId] : undefined;
    if (set && !seenSets.has(teammate.fourPieceSetId!)) {
      seenSets.add(teammate.fourPieceSetId!);
      extraBuffs.push({ stat: set.stat, value: set.value, source: `${teammate.name}'s ${set.name} (4)`, note: set.note });
    }
    if (teammate.weapon.id === THRILLING_TALES) {
      const r = Math.min(Math.max(teammate.weapon.refinement, 1), 5);
      extraBuffs.push({
        stat: 'atkPercent',
        value: THRILLING_TALES_ATK[r - 1],
        source: `${teammate.name}'s Thrilling Tales of Dragon Slayers R${r}`,
        note: 'ATK bonus for the next character on switching',
      });
    }
  }
  if (extraBuffs.length) team.extraBuffs = extraBuffs;

  return {
    scenario: {
      attackType: xianyun ? 'Plunge' : 'Na4',
      team,
      noelle: { constellation: noelle.constellation, burstLevel: noelle.talents[2] },
    },
    effects: teammates.map((t) => ({ id: t.id, name: t.name, modeled: MODELED.has(t.id) })),
  };
}
