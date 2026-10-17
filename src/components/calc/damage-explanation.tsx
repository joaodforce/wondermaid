import type { ReactNode } from 'react';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { weaponName } from '@/modules/calculator/data';
import {
  ENEMY_BASE_RES,
  ENEMY_LEVEL,
  LUNAR_CRYSTALLIZE_BASE,
  type DamageExplanation,
} from '@/modules/calculator/noelle';
import type { BuffEntry, BuffStat } from '@/modules/calculator/team';
import type { NoelleStats } from '@/modules/calculator/types';

type Tone = 'user' | 'weapon' | 'team' | 'noelle' | 'constant' | 'result';

const TONES: Record<Tone, string> = {
  user: 'bg-amber-400/15 text-amber-200 ring-amber-400/40',
  weapon: 'bg-rose-400/15 text-rose-200 ring-rose-400/40',
  team: 'bg-sky-400/15 text-sky-200 ring-sky-400/40',
  noelle: 'bg-violet-400/15 text-violet-200 ring-violet-400/40',
  constant: 'bg-white/5 text-stone-300 ring-white/15',
  result: 'bg-white/10 text-white ring-white/30 font-semibold',
};

export const LEGEND: { tone: Tone; label: string }[] = [
  { tone: 'user', label: 'Your build (Enka stats and artifact sets)' },
  { tone: 'weapon', label: "The team's fixed weapon" },
  { tone: 'team', label: 'Teammate buffs' },
  { tone: 'noelle', label: 'Standard C6 Noelle' },
  { tone: 'constant', label: 'Fixed values' },
];

/** A number in a formula, coloured by where it comes from */
export function Value({ tone, children, title }: { tone: Tone; children: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-[0.85em] ring-1 ring-inset', TONES[tone])}
    >
      {children}
    </span>
  );
}

const pct = (fraction: number, digits = 1) => `${(fraction * 100).toFixed(digits)}%`;
const mult = (value: number) => `×${value.toFixed(4)}`;
const signed = (text: string, value: number) => (value < 0 ? text : `+${text}`);

const PERCENT_BUFFS = new Set<BuffStat>(['atkPercent', 'defPercent', 'critRate', 'critDmg', 'dmgBonus', 'resShred', 'reactionBonus']);
const BUFF_LABELS: Record<BuffStat, string> = {
  atkPercent: 'ATK%',
  flatAtk: 'ATK',
  defPercent: 'DEF%',
  flatDef: 'DEF',
  critRate: 'CRIT Rate',
  critDmg: 'CRIT DMG',
  dmgBonus: 'DMG Bonus',
  flatDmg: 'Flat DMG',
  resShred: 'Enemy RES shred',
  reactionBonus: 'Lunar reaction DMG',
};

const formatBuff = (stat: BuffStat, value: number) =>
  signed(PERCENT_BUFFS.has(stat) ? pct(value) : formatNumber(value), value);

function entryTone(entry: BuffEntry, weaponSwapped: boolean): Tone {
  if (entry.origin === 'artifacts') return 'user';
  if (entry.origin === 'weapon') return weaponSwapped ? 'weapon' : 'user';
  return entry.origin;
}

/** Sheet values the weapon swap changed are the fixed weapon's doing; the rest come from the player */
const sheetTone = (e: DamageExplanation, key: keyof NoelleStats): Tone =>
  e.weaponSwapped && Math.abs(e.sheet[key] - e.playerSheet[key]) > 1e-9 ? 'weapon' : 'user';

function Panel({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-black/30 bg-ink shadow-2xl shadow-black/30">
      <div className="border-b border-white/10 px-5 py-3">
        <h2 className="font-semibold text-stone-100">{title}</h2>
        {description && <p className="mt-0.5 text-xs leading-relaxed text-stone-400">{description}</p>}
      </div>
      {children}
    </section>
  );
}

const SHEET_ROWS: { key: keyof NoelleStats; label: string; percent?: boolean }[] = [
  { key: 'baseAtk', label: 'Base ATK' },
  { key: 'atk', label: 'ATK' },
  { key: 'atkPercent', label: 'ATK%', percent: true },
  { key: 'baseDef', label: 'Base DEF' },
  { key: 'def', label: 'DEF' },
  { key: 'defPercent', label: 'DEF%', percent: true },
  { key: 'critRate', label: 'CRIT Rate', percent: true },
  { key: 'critDmg', label: 'CRIT DMG', percent: true },
  { key: 'geoDmgBonus', label: 'Geo DMG Bonus', percent: true },
  { key: 'elementalMastery', label: 'Elemental Mastery' },
];

export function CharacterSheetPanel({ explanation: e }: { explanation: DamageExplanation }) {
  const format = (value: number, percent?: boolean) => (percent ? pct(value) : formatNumber(value));
  const fixed = `${weaponName(e.weapon.id)} R${e.weapon.refinement}`;
  return (
    <Panel
      title="1. Character sheet"
      description={
        e.weaponSwapped ? (
          <>
            Noelle&apos;s stats as Enka reports them. Your{' '}
            {weaponName(e.playerWeapon.id)} R{e.playerWeapon.refinement} is replaced with {fixed}: its base ATK,
            substat and static passive are taken out of these totals and {fixed}&apos;s are put in, so only artifacts
            decide the ranking.
          </>
        ) : (
          "Noelle's stats as Enka reports them, with your own weapon."
        )
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-stone-300">
          <thead className="border-b border-white/10 bg-black/30 text-left text-xs text-stone-400 uppercase">
            <tr>
              <th className="px-5 py-2.5">Stat</th>
              <th className="px-3 py-2.5 text-right">Your sheet</th>
              {e.weaponSwapped && <th className="px-3 py-2.5 text-right">With {fixed}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {SHEET_ROWS.map(({ key, label, percent }) => {
              return (
                <tr key={key}>
                  <td className="px-5 py-2">{label}</td>
                  <td className="px-3 py-2 text-right">
                    <Value tone="user">{format(e.playerSheet[key], percent)}</Value>
                  </td>
                  {e.weaponSwapped && (
                    <td className="px-3 py-2 text-right">
                      <Value tone={sheetTone(e, key)}>{format(e.sheet[key], percent)}</Value>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function BuffsPanel({ explanation: e }: { explanation: DamageExplanation }) {
  return (
    <Panel
      title="2. Buffs on top of the sheet"
      description="Conditional effects the character sheet doesn't include: weapon and set passives, teammates and Noelle's constellations."
    >
      {e.entries.length === 0 ? (
        <p className="px-5 py-4 text-sm text-stone-400">No conditional buffs apply.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-stone-300">
            <thead className="border-b border-white/10 bg-black/30 text-left text-xs text-stone-400 uppercase">
              <tr>
                <th className="py-2.5 pr-2 pl-4 sm:px-5">Source</th>
                <th className="hidden px-3 py-2.5 sm:table-cell">Effect</th>
                <th className="px-2 py-2.5 sm:px-3">Stat</th>
                <th className="py-2.5 pr-4 pl-2 text-right sm:pr-5">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {e.entries.map((entry, index) => (
                <tr key={index}>
                  <td className="py-2 pr-2 pl-4 sm:px-5">
                    <Value tone={entryTone(entry, e.weaponSwapped)}>{entry.source}</Value>
                    <p className="mt-1 text-xs text-stone-400 sm:hidden">{entry.note}</p>
                  </td>
                  <td className="hidden px-3 py-2 text-stone-400 sm:table-cell">{entry.note}</td>
                  <td className="px-2 py-2 sm:px-3 sm:whitespace-nowrap">{BUFF_LABELS[entry.stat]}</td>
                  <td className="py-2 pr-4 pl-2 text-right font-mono whitespace-nowrap sm:pr-5">
                    {formatBuff(entry.stat, entry.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function Step({ index, title, children, result }: { index: number; title: string; children: ReactNode; result: ReactNode }) {
  return (
    <li className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="text-sm font-medium text-stone-100">
          <span className="mr-2 text-stone-500">{index}.</span>
          {title}
        </p>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1.5 text-sm text-stone-400">{children}</p>
      </div>
      <div className="shrink-0 sm:text-right">{result}</div>
    </li>
  );
}

const Op = ({ children }: { children: ReactNode }) => <span className="text-stone-500">{children}</span>;

/** Sum of the ledger entries for a stat, coloured by origin when they all come from one place */
function BuffTotal({ e, stat }: { e: DamageExplanation; stat: BuffStat }) {
  const entries = e.entries.filter((entry) => entry.stat === stat);
  const tones = new Set(entries.map((entry) => entryTone(entry, e.weaponSwapped)));
  const tone: Tone = tones.size === 1 ? [...tones][0] : 'result';
  const title = entries.map((entry) => `${entry.source}: ${formatBuff(stat, entry.value)}`).join('\n') || 'No buffs';
  return (
    <Value tone={entries.length ? tone : 'constant'} title={title}>
      {PERCENT_BUFFS.has(stat) ? pct(e.buffs[stat]) : formatNumber(e.buffs[stat])}
    </Value>
  );
}

export function FormulaPanel({ explanation: e }: { explanation: DamageExplanation }) {
  const capped = e.critRate > 1;
  const lunar = e.lunarCrystallize;
  let step = 0;

  return (
    <Panel
      title="3. Step by step"
      description="The exact formulas the leaderboard runs, with your numbers. Hover a buff total to see what it's made of."
    >
      <ol className="divide-y divide-white/5">
        <Step index={++step} title="Total DEF" result={<Value tone="result">{formatNumber(e.totalDef)}</Value>}>
          <Value tone={sheetTone(e, 'def')} title="Sheet DEF">{formatNumber(e.sheet.def)}</Value>
          <Op>+</Op>
          <Value tone="user" title="Base DEF">{formatNumber(e.sheet.baseDef)}</Value>
          <Op>×</Op>
          <BuffTotal e={e} stat="defPercent" />
          <Op>+</Op>
          <BuffTotal e={e} stat="flatDef" />
        </Step>

        <Step index={++step} title="Total ATK" result={<Value tone="result">{formatNumber(e.totalAtk)}</Value>}>
          <Value tone={sheetTone(e, 'atk')} title="Sheet ATK">{formatNumber(e.sheet.atk)}</Value>
          <Op>+</Op>
          <Value tone={sheetTone(e, 'baseAtk')} title="Base ATK">{formatNumber(e.sheet.baseAtk)}</Value>
          <Op>×</Op>
          <BuffTotal e={e} stat="atkPercent" />
          <Op>+</Op>
          <BuffTotal e={e} stat="flatAtk" />
        </Step>

        <Step
          index={++step}
          title="Sweeping Time ATK (burst converts DEF to ATK)"
          result={<Value tone="result">{formatNumber(e.scalingAtk)}</Value>}
        >
          <Value tone="result">{formatNumber(e.totalAtk)}</Value>
          <Op>+</Op>
          <Value tone="result">{formatNumber(e.totalDef)}</Value>
          <Op>×</Op>
          <Value
            tone={e.noelle ? 'user' : 'noelle'}
            title={
              e.noelle
                ? `Your burst level ${e.noelle.burstLevel}${e.noelle.constellation >= 6 ? ' + C6 (50%)' : ''}`
                : 'Burst level 13 (85%) + C6 (50%)'
            }
          >
            {pct(e.burstDefToAtk, 1)}
          </Value>
        </Step>

        <Step index={++step} title="Base damage" result={<Value tone="result">{formatNumber(e.baseDamage)}</Value>}>
          <Value tone="result">{formatNumber(e.scalingAtk)}</Value>
          <Op>×</Op>
          <Value tone="noelle" title={`${e.attackType} motion value`}>{pct(e.motionValue)}</Value>
          <Op>+</Op>
          <BuffTotal e={e} stat="flatDmg" />
          <Op>flat DMG</Op>
        </Step>

        <Step
          index={++step}
          title="DMG Bonus multiplier"
          result={<Value tone="result">{mult(1 + e.dmgBonus)}</Value>}
        >
          <Op>1 +</Op>
          <Value tone={sheetTone(e, 'geoDmgBonus')} title="Geo DMG Bonus on the sheet">{pct(e.sheet.geoDmgBonus)}</Value>
          <Op>+</Op>
          <BuffTotal e={e} stat="dmgBonus" />
        </Step>

        <Step index={++step} title="Average crit multiplier" result={<Value tone="result">{mult(e.critMultiplier)}</Value>}>
          <Op>1 + min(</Op>
          <Value tone={sheetTone(e, 'critRate')} title="CRIT Rate on the sheet">{pct(e.sheet.critRate)}</Value>
          <Op>+</Op>
          <BuffTotal e={e} stat="critRate" />
          <Op>, 100%) ×</Op>
          <Value tone={sheetTone(e, 'critDmg')} title="CRIT DMG on the sheet">{pct(e.sheet.critDmg)}</Value>
          <Op>+</Op>
          <BuffTotal e={e} stat="critDmg" />
          {capped && <span className="text-xs text-amber-300">CRIT Rate is over 100%, the excess is wasted</span>}
        </Step>

        <Step
          index={++step}
          title={`Enemy DEF (level ${ENEMY_LEVEL} enemy)`}
          result={<Value tone="result">{mult(e.enemyDefMultiplier)}</Value>}
        >
          <Op>(</Op>
          <Value tone="user" title="Noelle's level">{e.characterLevel}</Value>
          <Op>+ 100) ÷ ((</Op>
          <Value tone="user">{e.characterLevel}</Value>
          <Op>+ 100) + (</Op>
          <Value tone="constant">{ENEMY_LEVEL}</Value>
          <Op>+ 100))</Op>
        </Step>

        <Step index={++step} title="Enemy RES" result={<Value tone="result">{mult(e.enemyResMultiplier)}</Value>}>
          <Value tone="constant" title="Base enemy RES">{pct(ENEMY_BASE_RES, 0)}</Value>
          <Op>−</Op>
          <BuffTotal e={e} stat="resShred" />
          <Op>= {pct(e.enemyRes)} RES →</Op>
          <Op>
            {e.enemyRes < 0 ? '1 − RES ÷ 2' : e.enemyRes < 0.75 ? '1 − RES' : '1 ÷ (4 × RES + 1)'}
          </Op>
        </Step>

        <Step index={++step} title="Damage per hit" result={<Value tone="result">{formatNumber(e.hitDamage)}</Value>}>
          <Value tone="result">{formatNumber(e.baseDamage)}</Value>
          <Op>×</Op>
          <Value tone="result">{mult(1 + e.dmgBonus)}</Value>
          <Op>×</Op>
          <Value tone="result">{mult(e.critMultiplier)}</Value>
          <Op>×</Op>
          <Value tone="result">{mult(e.enemyDefMultiplier)}</Value>
          <Op>×</Op>
          <Value tone="result">{mult(e.enemyResMultiplier)}</Value>
        </Step>

        {lunar && (
          <Step
            index={++step}
            title="Lunar Crystallize (ignores enemy DEF)"
            result={<Value tone="result">{formatNumber(lunar.damage)}</Value>}
          >
            <Value tone="constant" title="Level 90 reaction base value">{LUNAR_CRYSTALLIZE_BASE.toFixed(2)}</Value>
            <Op>×</Op>
            <Value tone="team" title={lunar.sources.map((s) => `${s.source}: ${pct(s.multiplier, 0)}`).join('\n')}>
              {pct(lunar.baseMultiplier, 0)}
            </Value>
            <Op>× (1 +</Op>
            <Value tone="user" title={`From ${formatNumber(lunar.elementalMastery)} Elemental Mastery`}>
              {pct(lunar.emBonus)}
            </Value>
            <Op>EM +</Op>
            <BuffTotal e={e} stat="reactionBonus" />
            <Op>) ×</Op>
            <Value tone="result">{mult(e.enemyResMultiplier)}</Value>
            <Op>×</Op>
            <Value tone="result">{mult(e.critMultiplier)}</Value>
            {lunar.elevation !== 1 && (
              <>
                <Op>×</Op>
                <Value tone="team" title="Columbina C2 elevation">{`×${lunar.elevation}`}</Value>
              </>
            )}
          </Step>
        )}

        <Step
          index={++step}
          title="Leaderboard damage"
          result={<span className="font-mono text-2xl font-bold text-amber-400">{formatNumber(e.finalDamage)}</span>}
        >
          <Value tone="result">{formatNumber(e.hitDamage)}</Value>
          {lunar && (
            <>
              <Op>+</Op>
              <Value tone="result">{formatNumber(lunar.damage)}</Value>
            </>
          )}
        </Step>
      </ol>
    </Panel>
  );
}
