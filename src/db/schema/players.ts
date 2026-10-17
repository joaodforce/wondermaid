import { integer, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

export const players = pgTable('players', {
  uid: varchar('uid', { length: 15 }).primaryKey(),
  nickname: varchar('nickname', { length: 50 }).notNull(),
  level: integer('level'), // Adventure Rank
  profilePictureId: integer('profile_picture_id'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
