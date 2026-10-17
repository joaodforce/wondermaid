import type { NextRequest } from 'next/server';
import { jsonError } from '@/lib/http';
import { getPlayerBuild } from '@/modules/leaderboard/services';
import { renderShareCard } from '@/modules/leaderboard/share-card';

// GET /{uid}/card: the player's share card as a PNG (also the page's link preview); ?download=1 saves it
export async function GET(request: NextRequest, { params }: RouteContext<'/[uid]/card'>) {
  const { uid } = await params;
  const player = /^\d{9,10}$/.test(uid) ? await getPlayerBuild(uid) : null;
  if (!player) return jsonError(404, 'NOT_FOUND', 'Player not found');

  const download = request.nextUrl.searchParams.has('download');
  const filename = `${player.nickname.replace(/[^\w-]+/g, '_') || uid}-noelle.png`;
  return renderShareCard(player, {
    'Cache-Control': 'public, max-age=60, s-maxage=300',
    ...(download && { 'Content-Disposition': `attachment; filename="${filename}"` }),
  });
}
