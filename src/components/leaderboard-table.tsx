'use client';

import { ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { apiFetch, errorMessage } from '@/lib/api';
import { formatArtifactSets, formatNumber, formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';
import { LEADERBOARD_PAGE_SIZE, type LeaderboardResponse, type ScenarioSummary } from '@/modules/leaderboard/types';
import { useLeaderboardSync } from './leaderboard-sync';
import { TeamComposition } from './team-composition';

const ATTACK_LABELS = { Na4: 'Normal Attack 4', Ca: 'Charged Attack', Plunge: 'Plunging Attack' } as const;
const MEDALS = ['🥇', '🥈', '🥉'];

interface BoardRequest {
  scenarioId: string;
  page: number;
  search: string;
  /** Asks the server for the page holding this UID */
  focus?: string;
}

const SEARCH_DEBOUNCE_MS = 300;
const requestKey = (request: BoardRequest, version: number) =>
  `${request.scenarioId}|${request.page}|${request.search}|${request.focus ?? ''}@${version}`;

export function LeaderboardTable({
  scenarios,
  initial,
}: {
  scenarios: ScenarioSummary[];
  initial: LeaderboardResponse | null;
}) {
  const { version, highlightUid } = useLeaderboardSync();
  const [request, setRequest] = useState<BoardRequest>({
    scenarioId: initial?.scenario.id ?? scenarios[0]?.id ?? '',
    page: 1,
    search: '',
  });
  const [searchInput, setSearchInput] = useState('');
  const [board, setBoard] = useState<{ key: string; data: LeaderboardResponse } | null>(() =>
    initial ? { key: requestKey(request, 0), data: initial } : null,
  );
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const [seenVersion, setSeenVersion] = useState(version);
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  // A new submission clears the search and jumps to the page with the submitted player
  if (version !== seenVersion) {
    setSeenVersion(version);
    setSearchInput('');
    setRequest((previous) => ({ ...previous, page: 1, search: '', focus: highlightUid ?? undefined }));
  }

  const key = requestKey(request, version);
  const isStale = board?.key !== key;
  const failed = error?.key === key;

  useEffect(() => {
    if (!request.scenarioId || !isStale || failed) return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      scenarioId: request.scenarioId,
      page: String(request.page),
      limit: String(LEADERBOARD_PAGE_SIZE),
    });
    if (request.search) params.set('q', request.search);
    if (request.focus) params.set('focus', request.focus);
    apiFetch<LeaderboardResponse>(`/api/leaderboard?${params}`, { signal: controller.signal })
      .then((data) => setBoard({ key, data }))
      .catch((err) => {
        if (!controller.signal.aborted) setError({ key, message: errorMessage(err) });
      });
    return () => controller.abort();
  }, [request, isStale, failed, key]);

  const selectScenario = (scenarioId: string) => setRequest({ scenarioId, page: 1, search: request.search });
  const goToPage = (page: number) => setRequest({ ...request, page, focus: undefined });
  const onSearch = (value: string) => {
    setSearchInput(value);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(
      () => setRequest((previous) => ({ ...previous, page: 1, search: value.trim(), focus: undefined })),
      SEARCH_DEBOUNCE_MS,
    );
  };

  if (!scenarios.length) {
    return <EmptyState>No scenarios are active yet.</EmptyState>;
  }

  const selected = scenarios.find((scenario) => scenario.id === request.scenarioId) ?? scenarios[0];
  // While a new page loads the previous one stays up, dimmed, unless it was for another scenario
  const data = board && board.data.scenario.id === selected.id ? board.data : null;
  const entries = data?.entries ?? [];
  const first = data ? (data.page - 1) * data.pageSize + 1 : 0;

  return (
    <section className="w-full overflow-hidden rounded-2xl border border-black/30 bg-ink shadow-2xl shadow-black/30">
      <div role="tablist" aria-label="Team scenarios" className="flex gap-1 overflow-x-auto border-b border-white/10 px-2">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            role="tab"
            aria-selected={scenario.id === selected.id}
            onClick={() => selectScenario(scenario.id)}
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

      <TeamComposition scenario={selected} />

      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
        <label className="relative w-full sm:w-72">
          <span className="sr-only">Search players</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-500" aria-hidden />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search by name or UID"
            maxLength={30}
            className="h-9 w-full rounded-lg border border-white/10 bg-black/30 pr-3 pl-9 text-sm text-stone-100 outline-none placeholder:text-stone-500 focus:border-amber-400"
          />
        </label>
        {data && (
          <p className="text-xs text-stone-500" aria-live="polite">
            {data.search
              ? `${formatNumber(data.total)} match${data.total === 1 ? '' : 'es'}`
              : `${formatNumber(data.total)} build${data.total === 1 ? '' : 's'}`}
          </p>
        )}
      </div>

      <div className="relative">
        {failed ? (
          <EmptyState>
            {error.message}{' '}
            <button type="button" onClick={() => setError(null)} className="text-amber-400 underline">
              Retry
            </button>
          </EmptyState>
        ) : !data ? (
          <EmptyState>
            <Loader2 className="mx-auto h-5 w-5 animate-spin" aria-label="Loading leaderboard" />
          </EmptyState>
        ) : entries.length === 0 ? (
          <EmptyState>
            {data.search ? `No players match “${data.search}”.` : 'No builds on this leaderboard yet. Be the first!'}
          </EmptyState>
        ) : (
          <div className={cn('overflow-x-auto transition-opacity', isStale && 'opacity-60')} aria-busy={isStale}>
            <table className="w-full text-left text-sm text-stone-300">
              <thead className="border-b border-white/10 bg-black/30 text-xs text-stone-400 uppercase">
                <tr>
                  <th className="px-3 py-3 sm:px-4">Rank</th>
                  <th className="px-3 py-3 sm:px-4">Player</th>
                  <th className="hidden px-3 py-3 sm:px-4 sm:table-cell">UID</th>
                  <th className="hidden px-3 py-3 sm:px-4 sm:table-cell">Artifacts</th>
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
                        {formatArtifactSets(entry.artifactSets)} · {entry.uid}
                      </span>
                    </td>
                    <td className="hidden px-3 py-3 sm:px-4 font-mono text-stone-400 sm:table-cell">{entry.uid}</td>
                    <td className="hidden max-w-72 truncate px-3 py-3 sm:px-4 text-stone-400 sm:table-cell">
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
                      <Link
                        href={`/${entry.uid}/calc/${selected.id}`}
                        title="See how this damage is calculated"
                        className="underline decoration-amber-400/30 decoration-dotted underline-offset-4 hover:text-amber-300 hover:decoration-amber-300"
                      >
                        {formatNumber(entry.finalDamage)}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data && data.pageCount > 1 && (
        <nav aria-label="Leaderboard pages" className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-sm sm:px-5">
          <p className="text-xs text-stone-500">
            {formatNumber(first)}–{formatNumber(first + entries.length - 1)} of {formatNumber(data.total)}
          </p>
          <div className="flex items-center gap-1">
            <PageButton onClick={() => goToPage(data.page - 1)} disabled={data.page <= 1} label="Previous page">
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </PageButton>
            <span className="px-2 text-xs whitespace-nowrap text-stone-400">
              Page {data.page} of {data.pageCount}
            </span>
            <PageButton onClick={() => goToPage(data.page + 1)} disabled={data.page >= data.pageCount} label="Next page">
              <ChevronRight className="h-4 w-4" aria-hidden />
            </PageButton>
          </div>
        </nav>
      )}
    </section>
  );
}

function PageButton({ onClick, disabled, label, children }: { onClick: () => void; disabled: boolean; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-lg text-stone-300 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <div className="p-8 text-center text-sm text-stone-400">{children}</div>;
}
