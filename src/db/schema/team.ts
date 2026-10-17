import { doublePrecision, index, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import type { DamageBreakdown, NoelleBuild } from '@/modules/calculator/types';
import type { CharacterBuild } from '@/modules/team/party';
import { players } from './players';
import { users } from './users';

// One Team Showcase entry per game account: Noelle plus three teammates from the owner's showcase
export const teamShowcases = pgTable(
  'team_showcases',
  {
    uid: varchar('uid', { length: 15 })
      .primaryKey()
      .references(() => players.uid, { onDelete: 'cascade' }),
    submittedBy: uuid('submitted_by').references(() => users.id, { onDelete: 'set null' }),
    noelleJson: jsonb('noelle_json').$type<NoelleBuild>().notNull(), // What the calculator reads
    partyJson: jsonb('party_json').$type<CharacterBuild[]>().notNull(), // Noelle first, then the teammates
    finalDamage: doublePrecision('final_damage').notNull(),
    breakdownJson: jsonb('breakdown_json').$type<DamageBreakdown>().notNull(),
    submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  },
  (t) => [index('team_showcases_damage_idx').on(t.finalDamage.desc())],
);
