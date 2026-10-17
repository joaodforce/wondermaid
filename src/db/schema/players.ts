import { integer, pgTable, primaryKey, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';

export const players = pgTable('players', {
  uid: varchar('uid', { length: 15 }).primaryKey(),
  nickname: varchar('nickname', { length: 50 }).notNull(),
  level: integer('level'), // Adventure Rank
  profilePictureId: integer('profile_picture_id'),
  // Set once a user proves they own the UID (see account_claims)
  ownerUserId: uuid('owner_user_id').references(() => users.id, { onDelete: 'set null' }),
  verifiedAt: timestamp('verified_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// A pending ownership claim: the user puts `code` in their in-game bio, then we look for it through Enka
export const accountClaims = pgTable(
  'account_claims',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    uid: varchar('uid', { length: 15 }).notNull(),
    code: varchar('code', { length: 12 }).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.uid] })],
);
