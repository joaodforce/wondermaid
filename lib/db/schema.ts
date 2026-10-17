import { pgTable, varchar, timestamp, integer, jsonb, primaryKey, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const players = pgTable('players', {
  uid: varchar('uid', { length: 15 }).primaryKey(),
  nickname: varchar('nickname', { length: 50 }).notNull(),
  profilePictureId: integer('profile_picture_id'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const noelleBuilds = pgTable('noelle_builds', {
  id: varchar('id', { length: 36 }).primaryKey(), // UUID
  uid: varchar('uid', { length: 15 }).references(() => players.uid, { onDelete: 'cascade' }).notNull(),
  weaponId: integer('weapon_id').notNull(),
  weaponRefinement: integer('weapon_refinement').notNull(),
  artifactSetIds: jsonb('artifact_set_ids').notNull(), // Array of set IDs
  statsJson: jsonb('stats_json').notNull(), // Raw Enka stats payload
  calculatedAt: timestamp('calculated_at').defaultNow().notNull(),
});

export const scenarios = pgTable('scenarios', {
  id: varchar('id', { length: 50 }).primaryKey(), // e.g., 'mono-geo-c6-gorou'
  name: varchar('name', { length: 100 }).notNull(),
  attackType: varchar('attack_type', { length: 20 }).notNull(), // Na4, Ca, Plunge
  teamConfigJson: jsonb('team_config_json').notNull(), // Team buff parameters
});

export const leaderboardRanks = pgTable('leaderboard_ranks', {
  uid: varchar('uid', { length: 15 }).references(() => players.uid, { onDelete: 'cascade' }).notNull(),
  scenarioId: varchar('scenario_id', { length: 50 }).references(() => scenarios.id, { onDelete: 'cascade' }).notNull(),
  buildId: varchar('build_id', { length: 36 }).references(() => noelleBuilds.id, { onDelete: 'cascade' }).notNull(),
  finalDamage: real('final_damage').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.uid, t.scenarioId] })
}));