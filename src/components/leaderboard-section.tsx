import { connection } from 'next/server';
import { listActiveScenarios, toScenarioSummary } from '@/modules/leaderboard/scenarios';
import { getLeaderboard } from '@/modules/leaderboard/services';
import { LEADERBOARD_PAGE_SIZE } from '@/modules/leaderboard/types';
import { LeaderboardTable } from './leaderboard-table';

// Server-renders the scenario tabs and the first board; the table fetches other tabs on demand
export async function LeaderboardSection() {
  await connection();
  const scenarios = await listActiveScenarios();
  const initial = scenarios.length ? await getLeaderboard(scenarios[0].id, { pageSize: LEADERBOARD_PAGE_SIZE }) : null;
  return <LeaderboardTable scenarios={scenarios.map(toScenarioSummary)} initial={initial} />;
}

export function LeaderboardSkeleton() {
  return (
    <div className="h-96 w-full animate-pulse rounded-2xl border border-black/30 bg-ink/80" aria-hidden />
  );
}
