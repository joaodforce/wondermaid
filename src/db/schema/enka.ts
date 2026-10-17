import { jsonb, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import type { EnkaResponse } from '@/modules/enka/types';
import { players } from './players';

// The full Enka showcase response from each player's latest update, kept so new features can read
// fields we don't parse yet without every player having to update again
export const enkaProfiles = pgTable('enka_profiles', {
  uid: varchar('uid', { length: 15 })
    .primaryKey()
    .references(() => players.uid, { onDelete: 'cascade' }),
  responseJson: jsonb('response_json').$type<EnkaResponse>().notNull(),
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
});
