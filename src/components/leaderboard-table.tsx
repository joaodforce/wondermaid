'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { apiFetch, errorMessage } from '@/lib/api';
import { formatArtifactSets, formatNumber, formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';
import { weaponName } from '@/modules/calculator/data';
import type { LeaderboardResponse, ScenarioSummary } from '@/modules/leaderboard/types';
import { useLeaderboardSync } from './leaderboard-sync';

const ATTACK_LABELS = { Na4: 'Normal Attack 4', Ca: 'Charged Attack', Plunge: 'Plunging Attack' } as const;
const MEDALS = ['🥇', '🥈', '🥉'];

type Board = { version: number; data: LeaderboardResponse };

export function LeaderboardTable({
  scenarios,
  initial,
}: {
  scenarios: ScenarioSummary[];
  initial: LeaderboardResponse | null;
}) {
  const { version, highlightUid } = useLeaderboardSync();
  const [selectedId, setSelectedId] = useState(initial?.scenario.id ?? scenarios[0]?.id);
  const [boards, setBoards] = useState<Record<string, Board>>(() =>
    initial ? { [initial.scenario.id]: { version: 0, data: initial } } : {},
  );
  const [error, setError] = useState<{ key: string; message: string } | null>(null);

  const board = selectedId ? boards[selectedId] : undefined;
  const requestKey = `${selectedId}@${version}`;
  const isStale = !board || board.version < version;
  const failed = error?.key === requestKey;

  // Fetches the selected scenario when it was never loaded or a submission made it stale
  useEffect(() => {
    if (!selectedId || !isStale || failed) return;
    const controller = new AbortController();
    apiFetch<LeaderboardResponse>(`/api/leaderboard?scenarioId=${encodeURIComponent(selectedId)}`, {
      signal: controller.signal,
    })
      .then((data) => setBoards((previous) => ({ ...previous, [selectedId]: { version, data } })))
      .catch((err) => {
        if (!controller.signal.aborted) setError({ key: requestKey, message: errorMessage(err) });
      });
    return () => controller.abort();
  }, [selectedId, version, isStale, failed, requestKey]);

  if (!scenarios.length) {
    return <EmptyState>No scenarios are active yet.</EmptyState>;
  }

  const selected = scenarios.find((scenario) => scenario.id === selectedId) ?? scenarios[0];
  const entries = board?.data.entries ?? [];

  return (
    <section className="w-full overflow-hidden rounded-2xl border border-black/30 bg-ink shadow-2xl shadow-black/30">
      <div role="tablist" aria-label="Team scenarios" className="flex gap-1 overflow-x-auto border-b border-white/10 px-2">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            role="tab"
            aria-selected={scenario.id === selected.id}
            onClick={() => setSelectedId(scenario.id)}
            className={cn(
              '-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
              scenario.id === selected.id
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200',
            )}
          >
            {scenario.name}
          </button>
        ))}
      </div>

      <p className="border-b border-white/10 px-4 py-3 text-sm text-stone-400 sm:px-5">
        {selected.description} · <span className="text-stone-500">{ATTACK_LABELS[selected.attackType]} damage</span>
      </p>

      <div className="relative">
        {failed ? (
          <EmptyState>
            {error.message}{' '}
            <button type="button" onClick={() => setError(null)} className="text-amber-400 underline">
              Retry
            </button>
          </EmptyState>
        ) : !board ? (
          <EmptyState>
            <Loader2 className="mx-auto h-5 w-5 animate-spin" aria-label="Loading leaderboard" />
          </EmptyState>
        ) : entries.length === 0 ? (
          <EmptyState>No builds on this leaderboard yet. Be the first!</EmptyState>
        ) : (
          <div className={cn('overflow-x-auto transition-opacity', isStale && 'opacity-60')} aria-busy={isStale}>
            <table className="w-full text-left text-sm text-stone-300">
              <thead className="border-b border-white/10 bg-black/30 text-xs text-stone-400 uppercase">
                <tr>
                  <th className="px-3 py-3 sm:px-4">Rank</th>
                  <th className="px-3 py-3 sm:px-4">Player</th>
                  <th className="hidden px-3 py-3 sm:px-4 sm:table-cell">UID</th>
                  <th className="hidden px-3 py-3 sm:px-4 sm:table-cell">Weapon</th>
                  <th className="hidden px-3 py-3 sm:px-4 lg:table-cell">Artifacts</th>
                  <th className="hidden px-3 py-3 sm:px-4 text-right md:table-cell">DEF</th>
                  <th className="hidden px-3 py-3 sm:px-4 text-right md:table-cell">Crit</th>
                  <th className="px-3 py-3 sm:px-4 text-right">Damage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {entries.map((entry) => (
                  <tr
                    key={entry.uid}
                    className={cn(
                      'transition-colors hover:bg-white/5',
                      entry.uid === highlightUid && 'bg-rose-500/15 hover:bg-rose-500/20',
                    )}
                  >
                    <td className="px-3 py-3 sm:px-4 font-semibold whitespace-nowrap text-stone-100">
                      {MEDALS[entry.rank - 1] && <span aria-hidden>{MEDALS[entry.rank - 1]} </span>}
                      {entry.rank}
                    </td>
                    <td className="px-3 py-3 sm:px-4 font-medium whitespace-nowrap text-stone-100">
                      <Link href={`/${entry.uid}`} className="hover:text-amber-300 hover:underline">
                        {entry.nickname}
                      </Link>
                      <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-xs text-stone-400">
                        C{entry.constellation}
                      </span>
                      <span className="block text-xs font-normal whitespace-normal text-stone-500 sm:hidden">
                        {weaponName(entry.weaponId)} R{entry.weaponRefinement} · {entry.uid}
                      </span>
                    </td>
                    <td className="hidden px-3 py-3 sm:px-4 font-mono text-stone-400 sm:table-cell">{entry.uid}</td>
                    <td className="hidden px-3 py-3 sm:px-4 whitespace-nowrap sm:table-cell">
                      {weaponName(entry.weaponId)} <span className="text-stone-500">R{entry.weaponRefinement}</span>
                    </td>
                    <td className="hidden max-w-64 truncate px-3 py-3 sm:px-4 text-stone-400 lg:table-cell">
                      {formatArtifactSets(entry.artifactSets)}
                    </td>
                    <td className="hidden px-3 py-3 sm:px-4 text-right font-mono md:table-cell">
                      {entry.totalDef != null ? formatNumber(entry.totalDef) : '–'}
                    </td>
                    <td className="hidden px-3 py-3 sm:px-4 text-right font-mono whitespace-nowrap md:table-cell">
                      {entry.critRate != null && entry.critDmg != null
                        ? `${formatPercent(entry.critRate)} / ${formatPercent(entry.critDmg)}`
                        : '–'}
                    </td>
                    <td className="px-3 py-3 sm:px-4 text-right font-mono text-base font-bold text-amber-400">
                      {formatNumber(entry.finalDamage)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <div className="p-8 text-center text-sm text-stone-400">{children}</div>;
}
