import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leaderboardRanks, players, noelleBuilds } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scenarioId = searchParams.get('scenarioId') || 'mono-geo-c6-gorou';

  try {
    const results = await db
      .select({
        uid: players.uid,
        nickname: players.nickname,
        finalDamage: leaderboardRanks.finalDamage,
        updatedAt: leaderboardRanks.updatedAt,
        weaponId: noelleBuilds.weaponId,
        weaponRefinement: noelleBuilds.weaponRefinement
      })
      .from(leaderboardRanks)
      .innerJoin(players, eq(leaderboardRanks.uid, players.uid))
      .innerJoin(noelleBuilds, eq(leaderboardRanks.buildId, noelleBuilds.id))
      .where(eq(leaderboardRanks.scenarioId, scenarioId))
      .orderBy(desc(leaderboardRanks.finalDamage))
      .limit(100);

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}