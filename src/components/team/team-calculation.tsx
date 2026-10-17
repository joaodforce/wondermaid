import { Panel } from '@/components/calc/damage-explanation';
import { formatNumber, formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';
import { conditionalLabel, sheetName } from '@/modules/go/names';
import { addedDamage, type TeamAttack, type TeamCalculation } from '@/modules/go/types';
import type { CharacterBuild } from '@/modules/team/party';

const ATTACKS: Record<TeamAttack, string> = {
  Na4: '4th normal attack',
  Plunge: 'High plunging attack (Xianyun is in the party)',
};

/** Noelle's final stats for the ranked hit, with every party buff applied */
export function TeamStatsPanel({ calculation }: { calculation: TeamCalculation }) {
  const rows: [string, string, boolean?][] = [
    ['Attack', ATTACKS[calculation.attack], true],
    ['ATK', formatNumber(calculation.stats.atk)],
    ['DEF', formatNumber(calculation.stats.def)],
    ['CRIT Rate', formatPercent(calculation.stats.critRate)],
    ['CRIT DMG', formatPercent(calculation.stats.critDmg)],
    ['DMG Bonus', formatPercent(calculation.stats.dmgBonus)],
    ['Enemy', 'Level 100, 10% Geo RES before shred', true],
    ['Damage (crit-averaged)', formatNumber(calculation.finalDamage)],
  ];
  return (
    <Panel
      title="Noelle in this party"
      description="Her final stats for the ranked hit, after every teammate's buffs, weapons and artifact sets are applied."
    >
      <dl className="divide-y divide-white/5 text-sm">
        {rows.map(([label, value, text]) => (
          <div key={label} className="flex justify-between gap-4 px-5 py-2">
            <dt className="text-stone-400">{label}</dt>
            <dd className={cn('text-right text-stone-100', !text && 'font-mono')}>{value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

/** What each teammate is worth: Noelle's damage with and without them */
export function TeammateImpactPanel({ party, calculation }: { party: CharacterBuild[]; calculation: TeamCalculation }) {
  return (
    <Panel
      title="Teammate impact"
      description="Noelle's damage recalculated with each teammate taken out of the party, so their share of the total shows."
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-stone-300">
          <thead className="border-b border-white/10 bg-black/30 text-left text-xs text-stone-400 uppercase">
            <tr>
              <th className="px-5 py-2.5">Teammate</th>
              <th className="px-3 py-2.5 text-right">Damage without them</th>
              <th className="px-5 py-2.5 text-right">They add</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {party.slice(1).map((member, index) => (
              <tr key={member.id}>
                <td className="px-5 py-2">{member.name}</td>
                <td className="px-3 py-2 text-right font-mono">{formatNumber(calculation.damageWithout[index])}</td>
                <td className="px-5 py-2 text-right font-mono text-emerald-300">
                  +{formatPercent(addedDamage(calculation, index + 1))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/** The effects the calculation assumes are running, grouped by party member */
export function AssumptionsPanel({ party, calculation }: { party: CharacterBuild[]; calculation: TeamCalculation }) {
  return (
    <Panel
      title="Assumed active effects"
      description="Talents, constellations, weapon passives and set bonuses that depend on the situation are assumed to be up while Noelle attacks. Stacking effects use typical values for a rotation."
    >
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        {party.map((member, slot) => {
          const effects = calculation.conditionals.filter((c) => c.member === slot);
          return (
            <div key={member.id}>
              <h3 className="text-sm font-semibold text-stone-100">{member.name}</h3>
              {effects.length ? (
                <ul className="mt-1 space-y-0.5 text-xs text-stone-400">
                  {effects.map((effect) => (
                    <li key={`${effect.sheet}.${effect.name}`}>
                      <span className="text-stone-300">{sheetName(effect.sheet)}</span> · {conditionalLabel(effect)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs text-stone-500">Only always-on effects.</p>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
