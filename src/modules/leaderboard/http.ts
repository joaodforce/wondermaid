import { jsonError } from '@/lib/http';
import { LeaderboardError, type LeaderboardErrorCode } from './services';

const LEADERBOARD_ERROR_STATUS: Record<LeaderboardErrorCode, number> = {
  SCENARIO_NOT_FOUND: 404,
};

export function handleLeaderboardError(error: unknown, context: string): Response {
  if (error instanceof LeaderboardError) {
    return jsonError(LEADERBOARD_ERROR_STATUS[error.code], error.code, error.message);
  }
  console.error(`[leaderboard] ${context} failed:`, error);
  return jsonError(500, 'INTERNAL_ERROR', 'Something went wrong');
}
