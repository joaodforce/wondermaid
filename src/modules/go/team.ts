import type { CharacterKey } from '@genshin-optimizer/gi/consts';
import {
  artifactsData,
  charData,
  conditionalEntries,
  conditionals,
  dynIsActiveEntry,
  enemyDebuff,
  genshinCalculatorWithEntries,
  own,
  ownBuff,
  teamData,
  weaponData,
  withMember,
  type Member,
  type Sheet,
  type TagMapNodeEntries,
} from '@genshin-optimizer/gi/formula';
import type { GoodMember } from './good';
import { CHARACTER_PRESETS, genericValue, presetValue, type ConditionalMeta } from './presets';
import type { ActiveConditional, TeamAttack, TeamCalculation } from './types';

const FORMULAS: Record<TeamAttack, { name: string; move: 'normal' | 'plunging' }> = {
  Na4: { name: 'normal_3', move: 'normal' },
  Plunge: { name: 'plunging_high', move: 'plunging' },
};
const PLUNGE_ENABLERS = new Set<CharacterKey>(['Xianyun']);
const MEMBERS = ['0', '1', '2', '3'] as const satisfies readonly Member[];
// Same target as the main leaderboards: a level 100 enemy with 10% Geo RES
const ENEMY_LEVEL = 100;
const ENEMY_BASE_RES = 0.1;

const metaFor = (sheet: string): Record<string, ConditionalMeta> =>
  (conditionals as Record<string, Record<string, ConditionalMeta>>)[sheet] ?? {};

/** Every conditional a member brings: their kit from the presets, their weapon and sets switched fully on. */
export function memberConditionals(member: GoodMember, slot: number): ActiveConditional[] {
  const result: ActiveConditional[] = [];
  const charPreset = CHARACTER_PRESETS[member.char.key];
  for (const meta of Object.values(metaFor(member.char.key))) {
    // GO names constellation effects c1…c6; it already gates them, this keeps them off the assumptions list
    const constellation = Number(/^c([1-6])/.exec(meta.name)?.[1] ?? 0);
    if (constellation > member.char.constellation) continue;
    const preset = charPreset ? charPreset[meta.name] : undefined;
    const value = charPreset ? (preset === undefined ? 0 : presetValue(preset, member.char)) : genericValue(meta);
    if (value) result.push({ member: slot, sheet: member.char.key, name: meta.name, type: meta.type, value });
  }
  const sets = new Set(member.artifacts.map((artifact) => artifact.set));
  for (const sheet of [member.weapon.key, ...sets]) {
    for (const meta of Object.values(metaFor(sheet))) {
      result.push({ member: slot, sheet, name: meta.name, type: meta.type, value: genericValue(meta) });
    }
  }
  return result;
}

function memberEntries(member: GoodMember, src: Member): TagMapNodeEntries {
  return withMember(
    src,
    ...charData(member.char),
    ...weaponData({ ...member.weapon, location: member.char.key === 'Noelle' ? 'Noelle' : '' }),
    ...artifactsData(member.artifacts),
  );
}

export const attackFor = (party: GoodMember[]): TeamAttack =>
  party.some((member) => PLUNGE_ENABLERS.has(member.char.key)) ? 'Plunge' : 'Na4';

function calculator(party: GoodMember[], active: ActiveConditional[]) {
  const srcs = MEMBERS.slice(0, party.length);
  const entries: TagMapNodeEntries = [
    ...teamData(srcs),
    ...party.flatMap((member, slot) => memberEntries(member, srcs[slot])),
    // A null target applies the effect to everyone, including the member's own stats other buffs read
    ...active.map(({ member, sheet, name, value }) => conditionalEntries(sheet as Sheet, srcs[member], null)(name, value)),
    enemyDebuff.reaction.cata.add(''),
    enemyDebuff.reaction.amp.add(''),
    enemyDebuff.common.lvl.add(ENEMY_LEVEL),
    enemyDebuff.common.preRes.add(ENEMY_BASE_RES),
    ownBuff.common.critMode.add('avg'),
    dynIsActiveEntry('0'),
  ];
  return genshinCalculatorWithEntries(entries).withTag({ src: '0' });
}

function hitDamage(party: GoodMember[], active: ActiveConditional[], attack: TeamAttack) {
  const calc = calculator(party, active);
  const formula = calc.listFormulas(own.listing.formulas).find((read) => read.tag.name === FORMULAS[attack].name);
  if (!formula) throw new Error(`Genshin Optimizer has no ${FORMULAS[attack].name} formula for Noelle`);
  return { calc, damage: calc.compute(formula).val as number };
}

/**
 * Noelle's damage in a real party on Genshin Optimizer's engine: every member's actual level,
 * constellation, talents, weapon and artifacts, with their kits running as `CHARACTER_PRESETS` says.
 * `party[0]` must be Noelle.
 */
export function calculateTeam(party: GoodMember[]): TeamCalculation {
  if (party[0]?.char.key !== 'Noelle') throw new Error('Noelle must be the first party member');
  const attack = attackFor(party);
  const active = party.flatMap((member, slot) => memberConditionals(member, slot));
  const { calc, damage } = hitDamage(party, active, attack);

  const hit = calc.withTag({ ele: 'geo', move: FORMULAS[attack].move });
  const stat = (read: Parameters<typeof calc.compute>[0]) => hit.compute(read).val as number;

  const damageWithout = party.slice(1).map((_, index) => {
    const slot = index + 1;
    const rest = party.filter((__, i) => i !== slot);
    // Later members shift down a slot once this one is gone
    const shifted = active
      .filter((c) => c.member !== slot)
      .map((c) => (c.member > slot ? { ...c, member: c.member - 1 } : c));
    return hitDamage(rest, shifted, attackFor(rest)).damage;
  });

  return {
    attack,
    finalDamage: damage,
    stats: {
      atk: stat(own.final.atk),
      def: stat(own.final.def),
      critRate: stat(own.common.cappedCritRate_),
      critDmg: stat(own.final.critDMG_),
      dmgBonus: stat(own.final.dmg_),
    },
    conditionals: active,
    damageWithout,
  };
}
