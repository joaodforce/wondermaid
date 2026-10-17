import { boolean, doublePrecision, index, integer, jsonb, pgTable, primaryKey, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import type { DamageBreakdown, TeamConfig } from '@/modules/calculator/types';
import { noelleBuilds } from './builds';
import { players } from './players';

export const scenarios = pgTable('scenarios', {
  id: varchar('id', { length: 50 }).primaryKey(), // e.g. 'mono-geo-c6-gorou'
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull().default(''),
  attackType: varchar('attack_type', { length: 20 }).notNull(), // 'Na4' | 'Ca' | 'Plunge'
  teamConfigJson: jsonb('team_config_json').$type<TeamConfig>().notNull(),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const leaderboardRanks = pgTable(
  'leaderboard_ranks',
  {
    uid: varchar('uid', { length: 15 })
      .references(() => players.uid, { onDelete: 'cascade' })
      .notNull(),
    scenarioId: varchar('scenario_id', { length: 50 })
      .references(() => scenarios.id, { onDelete: 'cascade' })
      .notNull(),
    buildId: varchar('build_id', { length: 36 })
      .references(() => noelleBuilds.id, { onDelete: 'cascade' })
      .notNull(),
    finalDamage: doublePrecision('final_damage').notNull(),
    breakdownJson: jsonb('breakdown_json').$type<DamageBreakdown>(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.uid, t.scenarioId] }),
    index('leaderboard_ranks_scenario_damage_idx').on(t.scenarioId, t.finalDamage.desc()),
  ],
);
