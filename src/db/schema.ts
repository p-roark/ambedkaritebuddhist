import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = sqliteTable('User', {
  id:           text('id').primaryKey(),
  name:         text('name').notNull(),
  email:        text('email').notNull().unique(),
  passwordHash: text('passwordHash').notNull(),
  role:         text('role').notNull().default('MEMBER'), // ADMIN | LEADER | MEMBER | STUDENT
  emailVerified: text('emailVerified'),                  // ISO date string
  image:        text('image'),
  referredBy:   text('referredBy'),
  createdAt:    text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt:    text('updatedAt').notNull().default(sql`(datetime('now'))`),
});

// ─── OAuth accounts (NextAuth — reserved for future OAuth providers) ──────────

export const accounts = sqliteTable('Account', {
  id:                text('id').primaryKey(),
  userId:            text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type:              text('type').notNull(),
  provider:          text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token:     text('refresh_token'),
  access_token:      text('access_token'),
  expires_at:        integer('expires_at'),
  token_type:        text('token_type'),
  scope:             text('scope'),
  id_token:          text('id_token'),
  session_state:     text('session_state'),
}, (t) => ({
  providerIdx: uniqueIndex('Account_provider_providerAccountId_key')
    .on(t.provider, t.providerAccountId),
}));

// ─── Sessions (NextAuth — not used with JWT strategy, kept for completeness) ──

export const sessions = sqliteTable('Session', {
  id:           text('id').primaryKey(),
  sessionToken: text('sessionToken').notNull().unique(),
  userId:       text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires:      text('expires').notNull(),
});

export const verificationTokens = sqliteTable('VerificationToken', {
  identifier: text('identifier').notNull(),
  token:      text('token').notNull().unique(),
  expires:    text('expires').notNull(),
}, (t) => ({
  identifierTokenIdx: uniqueIndex('VerificationToken_identifier_token_key')
    .on(t.identifier, t.token),
}));

// ─── Referral codes ───────────────────────────────────────────────────────────

export const referralCodes = sqliteTable('ReferralCode', {
  id:          text('id').primaryKey(),
  code:        text('code').notNull().unique(),
  ownerId:     text('ownerId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  maxUses:     integer('maxUses').notNull().default(10),
  currentUses: integer('currentUses').notNull().default(0),
  active:      integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt:   text('createdAt').notNull().default(sql`(datetime('now'))`),
}, (t) => ({
  codeIdx: index('ReferralCode_code_idx').on(t.code),
}));

// ─── Inferred types ───────────────────────────────────────────────────────────

export type User           = typeof users.$inferSelect;
export type NewUser        = typeof users.$inferInsert;
export type ReferralCode   = typeof referralCodes.$inferSelect;
export type NewReferralCode = typeof referralCodes.$inferInsert;
