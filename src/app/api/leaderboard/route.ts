import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { jsonError } from '@/lib/http';
import { handleLeaderboardError } from '@/modules/leaderboard/http';
import { DEFAULT_SCENARIO_ID } from '@/modules/leaderboard/scenarios';
import { getLeaderboard } from '@/modules/leaderboard/services';
import { leaderboardQuerySchema } from '@/modules/leaderboard/validation';

export async function GET(request: NextRequest) {
  const query = leaderboardQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!query.success) {
    return jsonError(400, 'VALIDATION_ERROR', 'Invalid query', z.flattenError(query.error).fieldErrors);
  }

  try {
    const { scenarioId = DEFAULT_SCENARIO_ID, limit, page, q, focus } = query.data;
    return Response.json(await getLeaderboard(scenarioId, { page, pageSize: limit, search: q, focusUid: focus }));
  } catch (error) {
    return handleLeaderboardError(error, 'get');
  }
}
