import { index, integer, jsonb, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import type { NoelleBuild } from '@/modules/calculator/types';
import { players } from './players';

// Snapshot of Noelle's build at each update; only the latest one per player is kept
export const noelleBuilds = pgTable(
  'noelle_builds',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    uid: varchar('uid', { length: 15 })
      .references(() => players.uid, { onDelete: 'cascade' })
      .notNull(),
    weaponId: integer('weapon_id').notNull(),
    weaponRefinement: integer('weapon_refinement').notNull(),
    constellation: integer('constellation').notNull().default(0),
    artifactSetIds: jsonb('artifact_set_ids').$type<number[]>().notNull(), // Sets with 2+ pieces equipped
    statsJson: jsonb('stats_json').$type<NoelleBuild>().notNull(), // Parsed build the ranks were calculated from
    calculatedAt: timestamp('calculated_at').defaultNow().notNull(),
  },
  (t) => [index('noelle_builds_uid_idx').on(t.uid)],
);
