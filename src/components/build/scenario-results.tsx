import Link from 'next/link';
import { formatNumber, formatPercent } from '@/lib/format';
import { weaponName } from '@/modules/calculator/data';
import type { PlayerScenarioResult } from '@/modules/leaderboard/types';

export function ScenarioResults({ uid, scenarios }: { uid: string; scenarios: PlayerScenarioResult[] }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-black/30 bg-ink shadow-2xl shadow-black/30">
      <div className="border-b border-white/10 px-5 py-3">
        <h2 className="font-semibold text-stone-100">Leaderboard results</h2>
        <p className="text-xs text-stone-500">Ranked with each team&apos;s fixed weapon, so only artifacts count. Click a damage number to see how it&apos;s calculated.</p>
      </div>
      {scenarios.length === 0 ? (
        <p className="p-6 text-center text-sm text-stone-400">No results yet. Update the build to rank it.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-300">
            <thead className="border-b border-white/10 bg-black/30 text-xs text-stone-400 uppercase">
              <tr>
                <th className="px-5 py-3">Team</th>
                <th className="px-3 py-3 text-right">Rank</th>
                <th className="hidden px-3 py-3 text-right sm:table-cell">Top</th>
                <th className="hidden px-3 py-3 text-right md:table-cell">DEF</th>
                <th className="hidden px-3 py-3 text-right md:table-cell">Crit</th>
                <th className="hidden px-3 py-3 text-right lg:table-cell">DMG Bonus</th>
                <th className="px-5 py-3 text-right">Damage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {scenarios.map((scenario) => (
                <tr key={scenario.id}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-stone-100">{scenario.name}</p>
                    <p className="text-xs text-stone-500">
                      {scenario.description} · {weaponName(scenario.weapon.id)} R{scenario.weapon.refinement}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-right font-mono whitespace-nowrap">
                    #{scenario.rank}
                    <span className="text-stone-500">/{scenario.total}</span>
                  </td>
                  <td className="hidden px-3 py-3 text-right font-mono sm:table-cell">
                    {scenario.total ? `${Math.max(1, Math.round((scenario.rank / scenario.total) * 100))}%` : '–'}
                  </td>
                  <td className="hidden px-3 py-3 text-right font-mono md:table-cell">
                    {scenario.breakdown ? formatNumber(scenario.breakdown.totalDef) : '–'}
                  </td>
                  <td className="hidden px-3 py-3 text-right font-mono whitespace-nowrap md:table-cell">
                    {scenario.breakdown
                      ? `${formatPercent(scenario.breakdown.critRate)} / ${formatPercent(scenario.breakdown.critDmg)}`
                      : '–'}
                  </td>
                  <td className="hidden px-3 py-3 text-right font-mono lg:table-cell">
                    {scenario.breakdown ? formatPercent(scenario.breakdown.dmgBonus) : '–'}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-base font-bold text-amber-400">
                    <Link
                      href={`/${uid}/calc/${scenario.id}`}
                      title="See how this damage is calculated"
                      className="underline decoration-amber-400/30 decoration-dotted underline-offset-4 hover:text-amber-300 hover:decoration-amber-300"
                    >
                      {formatNumber(scenario.finalDamage)}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
