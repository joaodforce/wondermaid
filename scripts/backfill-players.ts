import 'dotenv/config';
import { notExists, eq } from 'drizzle-orm';
import { db } from '@/db';
import { leaderboardRanks, players } from '@/db/schema';
import { EnkaError } from '@/modules/enka/types';
import { updatePlayerFromEnka } from '@/modules/leaderboard/services';

// Refreshes players from Enka one at a time, e.g. after importing players without builds.
// Only players with no ranks yet are refreshed unless `--all` is passed.
const DELAY_MS = 2_000;
const RATE_LIMIT_BACKOFF_MS = 60_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function refresh(uid: string, retried = false): Promise<string> {
  try {
    const { nickname, results } = await updatePlayerFromEnka(uid);
    return `ok (${nickname}, ${results.length} scenarios)`;
  } catch (error) {
    if (error instanceof EnkaError && error.code === 'RATE_LIMITED' && !retried) {
      await sleep(RATE_LIMIT_BACKOFF_MS);
      return refresh(uid, true);
    }
    if (error instanceof EnkaError) return `skipped: ${error.message}`;
    throw error;
  }
}

async function main() {
  const all = process.argv.includes('--all');
  const query = db.select({ uid: players.uid }).from(players);
  const rows = all
    ? await query
    : await query.where(
        notExists(db.select().from(leaderboardRanks).where(eq(leaderboardRanks.uid, players.uid))),
      );

  console.log(`Refreshing ${rows.length} players`);
  for (const [index, { uid }] of rows.entries()) {
    if (index) await sleep(DELAY_MS);
    console.log(`${uid}: ${await refresh(uid)}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
  });
