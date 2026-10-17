import 'dotenv/config';
import { recalculateAllRanks } from '@/modules/leaderboard/services';

recalculateAllRanks()
  .then(({ updated, skipped }) => {
    console.log(`Recalculated ranks for ${updated} builds (${skipped} legacy builds skipped)`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Recalculation failed:', error);
    process.exit(1);
  });
