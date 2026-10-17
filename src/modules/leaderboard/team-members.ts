import type { TeamConfig } from '@/modules/calculator/types';

export type TeamMember =
  | { kind: 'character'; name: string; icon: string; rarity: 4 | 5; constellation: number }
  | { kind: 'flex' };

// Portrait icons from Enka's store/gi/avatars.json (side icon names without "_Side")
const CHARACTERS = {
  noelle: { name: 'Noelle', icon: 'UI_AvatarIcon_Noel', rarity: 4 },
  gorou: { name: 'Gorou', icon: 'UI_AvatarIcon_Gorou', rarity: 4 },
  zhongli: { name: 'Zhongli', icon: 'UI_AvatarIcon_Zhongli', rarity: 5 },
  furina: { name: 'Furina', icon: 'UI_AvatarIcon_Furina', rarity: 5 },
  yelan: { name: 'Yelan', icon: 'UI_AvatarIcon_Yelan', rarity: 5 },
  xianyun: { name: 'Xianyun', icon: 'UI_AvatarIcon_Liuyun', rarity: 5 },
  columbina: { name: 'Columbina', icon: 'UI_AvatarIcon_Columbina', rarity: 5 },
  linnea: { name: 'Linnea', icon: 'UI_AvatarIcon_Linnea', rarity: 5 },
} as const;

const TEAM_SIZE = 4;

/**
 * The party a scenario simulates, derived from its team config so the picture always matches the
 * buffs that are calculated. Slots no buff depends on are shown as flex.
 */
export function teamMembers(team: TeamConfig): TeamMember[] {
  const member = (key: keyof typeof CHARACTERS, constellation = 0): TeamMember => ({
    kind: 'character',
    ...CHARACTERS[key],
    constellation,
  });

  const members: TeamMember[] = [member('noelle', 6)];
  if (team.columbina) members.push(member('columbina', team.columbina.constellation));
  if (team.linnea) members.push(member('linnea'));
  if (team.furina) members.push(member('furina', team.furina.constellation));
  if (team.yelan) members.push(member('yelan'));
  if (team.xianyun) members.push(member('xianyun', team.xianyun.constellation));
  if (team.gorou) members.push(member('gorou', team.gorou.constellation));
  if (team.zhongli) members.push(member('zhongli'));

  while (members.length < TEAM_SIZE) members.push({ kind: 'flex' });
  return members.slice(0, TEAM_SIZE);
}
