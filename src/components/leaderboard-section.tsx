import { connection } from 'next/server';
import { listActiveScenarios, toScenarioSummary } from '@/modules/leaderboard/scenarios';
import { getLeaderboard } from '@/modules/leaderboard/services';
import { LeaderboardTable } from './leaderboard-table';

// Server-renders the scenario tabs and the first board; the table fetches other tabs on demand
export async function LeaderboardSection() {
  await connection();
  const scenarios = await listActiveScenarios();
  const initial = scenarios.length ? await getLeaderboard(scenarios[0].id) : null;
  return <LeaderboardTable scenarios={scenarios.map(toScenarioSummary)} initial={initial} />;
}

export function LeaderboardSkeleton() {
  return (
    <div className="w-full animate-pulse" aria-hidden>
      <div className="h-11 border-b border-slate-800" />
      <div className="mt-3 mb-4 h-5 w-64 rounded bg-slate-800/60" />
      <div className="h-80 rounded-xl border border-slate-800 bg-slate-900" />
    </div>
  );
}
