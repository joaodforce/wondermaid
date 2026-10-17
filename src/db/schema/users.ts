import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

// Privacy first: an account is only a username and a password hash, no email or other personal data
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username', { length: 24 }).notNull().unique(), // Stored lowercase
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// The id is the SHA-256 of the cookie token, so a database leak can't be replayed as sessions
export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
});
