import { doublePrecision, index, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import type { GoodMember } from '@/modules/go/good';
import type { TeamCalculation } from '@/modules/go/types';
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
    partyJson: jsonb('party_json').$type<CharacterBuild[]>().notNull(), // Noelle first, then the teammates
    // The same party in Genshin Optimizer's format, which the calculator reads. Null for entries
    // submitted before the GO engine until recalculation rebuilds them from the stored Enka profile.
    goodJson: jsonb('good_json').$type<GoodMember[]>(),
    finalDamage: doublePrecision('final_damage').notNull(),
    calculationJson: jsonb('calculation_json').$type<TeamCalculation>(),
    submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  },
  (t) => [index('team_showcases_damage_idx').on(t.finalDamage.desc())],
);
