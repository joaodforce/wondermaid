import type { CharacterKey } from '@genshin-optimizer/gi/consts';
import type { ICharacter } from '@genshin-optimizer/gi/good';

type PresetValue = number | ((char: ICharacter) => number);

// Furina's typical average Fanfare across a rotation; C1 raises the cap and C2 speeds up gain
const FURINA_FANFARE = [200, 340, 400];

/**
 * How each supported character's kit is assumed to be running while Noelle attacks, keyed by
 * Genshin Optimizer's conditional names (see `conditionals` in its formula metadata). A list
 * conditional takes the 1-based index of its option, a toggle takes 1. Characters missing here
 * fall back to `genericValue`, the same as weapons and artifact sets.
 */
export const CHARACTER_PRESETS: Partial<Record<CharacterKey, Record<string, PresetValue>>> = {
  Noelle: { SweepingTime: 1 },
  Gorou: { afterBurst: 1, afterSkillBurst: 1, inField: 1 },
  Zhongli: { skill: 1 },
  YunJin: { skill: 1, c4: 1 },
  Albedo: { burstUsed: 1, skillInField: 1 },
  Chiori: { a4Construct: 1 },
  Xilonen: { sourceActive: 1, nsBlessing: 1, nsBurst: 1, c4Blooming: 1, c6Imperishable: 1 },
  Kachina: { a1NightsoulBurst: 1, c4Opponents: 1 },
  Illuga: { a1AfterSkillBurst: 1, burstSong: 1, c4BurstActive: 1 },
  Linnea: { a1Lumi: 1, c1LumiStacks: 10, c1TeamStacks: 1, c2Moondrift: 1, c4Moondrift: 1 },
  Furina: { burstFanfare: (char) => FURINA_FANFARE[Math.min(char.constellation, 2)], skillHpConsumeStacks: 4 },
  // Her A4 ramps from 1% to 50% over the burst; 7 stacks is about the average
  Yelan: { a4Stacks: 7, c4Stacks: 4 },
  Xingqiu: { skill: 1, burst: 1, c2: 1 },
  Xianyun: { a1Stacks: 1, a4HasStacks: 1, c2AfterSkill: 1, c6SkyladderUses: 3 },
  Faruzan: { a4Active: 1, burstBenefit: 1, burstHit: 1, c6Crit: 1 },
  Bennett: { activeInArea: 1 },
  Columbina: { burstDomain: 1, a1Stacks: 3, c2Brilliance: 1, c2Lunarcrystallize: 1, c4Buff: 1, c6Lunarcrystallize: 1 },
  Aino: { c1AfterSkillOrBurst: 1, c6AfterBurst: 1 },
  Jean: { c1: 1, c2: 1, c4: 1, c6: 1 },
};

export interface ConditionalMeta {
  name: string;
  type: string;
  max?: number;
  list?: readonly string[];
}

/** Weapons, artifact sets and unlisted characters: every effect on, stacks at their max */
export function genericValue(meta: ConditionalMeta): number {
  if (meta.type === 'num') return meta.max ?? 0;
  return 1;
}

export function presetValue(value: PresetValue, char: ICharacter): number {
  return typeof value === 'function' ? value(char) : value;
}
