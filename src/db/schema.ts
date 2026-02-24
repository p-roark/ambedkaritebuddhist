import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = sqliteTable('User', {
  id:           text('id').primaryKey(),
  name:         text('name').notNull(),
  email:        text('email').notNull().unique(),
  passwordHash: text('passwordHash').notNull(),
  phone:        text('phone'),
  altPhone:     text('altPhone'),
  addressLine1: text('addressLine1'),
  addressLine2: text('addressLine2'),
  city:         text('city'),
  province:     text('province'),
  postalCode:   text('postalCode'),
  education:    text('education'),
  interests:    text('interests'),
  notes:        text('notes'),
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

// ─── Events ───────────────────────────────────────────────────────────────────

export const events = sqliteTable('Event', {
  id:        text('id').primaryKey(),
  title:     text('title').notNull(),
  description: text('description').notNull().default(''),
  coverImage: text('coverImage').notNull().default('/images/events/covers/dcpd.jpg'),
  date:      text('date').notNull(), // YYYY-MM-DD
  time:      text('time').notNull().default('18:00'),
  location:  text('location').notNull(),
  eventType: text('eventType').notNull().default('General'),
  isPaid:    integer('isPaid', { mode: 'boolean' }).notNull().default(false),
  adultPrice: integer('adultPrice').notNull().default(0),
  childPrice: integer('childPrice').notNull().default(0),
  eventImages: text('eventImages').notNull().default('[]'),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
  status:    text('status').notNull().default('Upcoming'), // Upcoming | Registration Started | Event Ended
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updatedAt').notNull().default(sql`(datetime('now'))`),
}, (t) => ({
  dateIdx: index('Event_date_idx').on(t.date),
}));

// ─── Event registrations ─────────────────────────────────────────────────────

export const eventRegistrations = sqliteTable('EventRegistration', {
  id:              text('id').primaryKey(),
  eventId:         text('eventId').notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId:          text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  volunteering:    integer('volunteering', { mode: 'boolean' }).notNull().default(false),
  includeFamily:   integer('includeFamily', { mode: 'boolean' }).notNull().default(false),
  selectedFamilyMemberIds: text('selectedFamilyMemberIds').notNull().default('[]'),
  nonMemberGuestDetails: text('nonMemberGuestDetails').notNull().default('[]'),
  nonMemberAdultGuests: integer('nonMemberAdultGuests').notNull().default(0),
  nonMemberChildGuests: integer('nonMemberChildGuests').notNull().default(0),
  adultsCount:     integer('adultsCount').notNull().default(1),
  childrenCount:   integer('childrenCount').notNull().default(0),
  totalAmount:     integer('totalAmount').notNull().default(0),
  paymentStatus:   text('paymentStatus').notNull().default('Unpaid'), // Unpaid | Paid
  registrationStatus: text('registrationStatus').notNull().default('Pending Registration'), // Pending Registration | Confirmed | Rejected
  createdAt:       text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt:       text('updatedAt').notNull().default(sql`(datetime('now'))`),
}, (t) => ({
  eventIdx: index('EventRegistration_event_idx').on(t.eventId),
  userIdx: index('EventRegistration_user_idx').on(t.userId),
  eventUserUnique: uniqueIndex('EventRegistration_event_user_key').on(t.eventId, t.userId),
}));

// --- Family members ----------------------------------------------------------

export const familyMembers = sqliteTable('FamilyMember', {
  id:          text('id').primaryKey(),
  userId:      text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:        text('name').notNull(),
  relationship: text('relationship').notNull(),
  age:         integer('age'),
  notes:       text('notes'),
  createdAt:   text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt:   text('updatedAt').notNull().default(sql`(datetime('now'))`),
}, (t) => ({
  userIdx: index('FamilyMember_user_idx').on(t.userId),
}));

// ─── Inferred types ───────────────────────────────────────────────────────────

export type User           = typeof users.$inferSelect;
export type NewUser        = typeof users.$inferInsert;
export type ReferralCode   = typeof referralCodes.$inferSelect;
export type NewReferralCode = typeof referralCodes.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type NewEventRegistration = typeof eventRegistrations.$inferInsert;
export type FamilyMember = typeof familyMembers.$inferSelect;
export type NewFamilyMember = typeof familyMembers.$inferInsert;
