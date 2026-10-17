import { doublePrecision, pgTable, primaryKey, real, timestamp, varchar } from 'drizzle-orm/pg-core';
import { players } from './players';

// Scores imported from the earlier community ranking system. Its scenarios and calculator differ from ours,
// so these are kept for reference only and never shown on the leaderboard.
export const legacyRankings = pgTable(
  'legacy_rankings',
  {
    uid: varchar('uid', { length: 15 })
      .references(() => players.uid, { onDelete: 'cascade' })
      .notNull(),
    scenarioName: varchar('scenario_name', { length: 100 }).notNull(),
    finalDamage: doublePrecision('final_damage').notNull(),
    effectiveAtk: real('effective_atk'),
    recordedAt: timestamp('recorded_at').notNull(),
  },
  (t) => [primaryKey({ columns: [t.uid, t.scenarioName] })],
);
