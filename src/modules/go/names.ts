import { ARTIFACT_SET_NAMES, WEAPON_NAMES } from '@/modules/calculator/data';
import { CHARACTER_NAMES } from '@/modules/team/characters';
import { ARTIFACT_SET_KEYS, CHARACTER_KEYS, WEAPON_KEYS } from './keys';
import type { ActiveConditional } from './types';

const invert = (map: Record<number, string>) => new Map(Object.entries(map).map(([id, key]) => [key, Number(id)]));
const CHARACTER_IDS = invert(CHARACTER_KEYS);
const WEAPON_IDS = invert(WEAPON_KEYS);
const SET_IDS = invert(ARTIFACT_SET_KEYS);

const splitWords = (key: string) => key.replace(/([a-z0-9])([A-Z])/g, '$1 $2');

/** Display name of a GO character, weapon or artifact set key */
export function sheetName(sheet: string): string {
  const name =
    CHARACTER_NAMES[CHARACTER_IDS.get(sheet) ?? 0] ??
    WEAPON_NAMES[WEAPON_IDS.get(sheet) ?? 0] ??
    ARTIFACT_SET_NAMES[SET_IDS.get(sheet) ?? 0];
  return name ?? splitWords(sheet);
}

/** Readable label for a GO conditional, e.g. `afterSkillBurst` → "After skill burst", `c6Crit` → "C6 crit" */
export function conditionalLabel({ name, type, value }: Pick<ActiveConditional, 'name' | 'type' | 'value'>): string {
  const words = splitWords(name)
    .split(' ')
    .map((word, i) => (/^[acp][0-9]$/.test(word) ? word.toUpperCase() : i ? word.toLowerCase() : word));
  const label = words.join(' ').replace(/^set([0-9])$/, '$1-piece bonus');
  const text = label.charAt(0).toUpperCase() + label.slice(1);
  return type === 'num' ? `${text}: ${value}` : text;
}
