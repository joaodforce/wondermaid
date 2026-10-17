import 'dotenv/config';
import { recalculateAllRanks } from '@/modules/leaderboard/services';
import { recalculateTeamShowcases } from '@/modules/team/services';

async function main() {
  const { updated, skipped } = await recalculateAllRanks();
  console.log(`Recalculated ranks for ${updated} builds (${skipped} legacy builds skipped)`);
  const teams = await recalculateTeamShowcases();
  console.log(`Recalculated ${teams.updated} Team Showcase entries (${teams.skipped} could not be rebuilt)`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Recalculation failed:', error);
    process.exit(1);
  });
