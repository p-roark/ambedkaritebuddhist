import { sqliteTable, text, integer, uniqueIndex, index, primaryKey } from 'drizzle-orm/sqlite-core';
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
  status:       text('status').notNull().default('active'), // active | inactive | blocked
  activationRequestCount: integer('activationRequestCount').notNull().default(0),
  activationRequestStatus: text('activationRequestStatus').notNull().default('none'), // none | pending | rejected
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
  maxAttendees: integer('maxAttendees'), // null = no limit
  externalLink: text('externalLink'), // optional link to outside org event
  paymentInstructions: text('paymentInstructions'), // shown in registration modal for paid events
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
  paidAmount:      integer('paidAmount').notNull().default(0),
  refundDue:       integer('refundDue').notNull().default(0),
  paymentHistory:  text('paymentHistory').notNull().default('[]'),
  paymentStatus:   text('paymentStatus').notNull().default('Unpaid'), // Unpaid | Paid
  registrationStatus: text('registrationStatus').notNull().default('Pending Registration'), // Pending Registration | Confirmed | Rejected
  volunteeringCultural: integer('volunteeringCultural', { mode: 'boolean' }).notNull().default(false),
  photoConsent:        integer('photoConsent', { mode: 'boolean' }).notNull().default(true),
  needsRide:           integer('needsRide', { mode: 'boolean' }).notNull().default(false),
  ridePickupAddress:   text('ridePickupAddress'),
  donationAmount:      integer('donationAmount').notNull().default(0),
  notes:               text('notes'),
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

// --- Contact messages --------------------------------------------------------

export const contactMessages = sqliteTable('ContactMessage', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('PENDING'), // PENDING | RESOLVED
  type: text('type').notNull().default('CONTACT'), // CONTACT | ACTIVATION_REQUEST
  userId: text('userId').references(() => users.id),
  adminNote: text('adminNote'),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updatedAt').notNull().default(sql`(datetime('now'))`),
}, (t) => ({
  statusIdx: index('ContactMessage_status_idx').on(t.status),
  createdIdx: index('ContactMessage_createdAt_idx').on(t.createdAt),
  typeIdx: index('ContactMessage_type_idx').on(t.type),
}));

// ─── Event coordinators (junction) ───────────────────────────────────────────

export const eventCoordinators = sqliteTable('EventCoordinator', {
  eventId: text('eventId').notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId:  text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk:       primaryKey({ columns: [t.eventId, t.userId] }),
  eventIdx: index('EventCoordinator_event_idx').on(t.eventId),
  userIdx:  index('EventCoordinator_user_idx').on(t.userId),
}));

// ─── Leadership roles ─────────────────────────────────────────────────────────

export const leadershipRoles = sqliteTable('LeadershipRole', {
  id:           text('id').primaryKey(),
  roleName:     text('roleName').notNull(),
  userId:       text('userId').references(() => users.id, { onDelete: 'set null' }),
  displayOrder: integer('displayOrder').notNull().default(0),
  createdAt:    text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt:    text('updatedAt').notNull().default(sql`(datetime('now'))`),
}, (t) => ({
  orderIdx: index('LeadershipRole_displayOrder_idx').on(t.displayOrder),
}));

// ─── Organization settings (singleton row, id = 'main') ──────────────────────

export const organizationSettings = sqliteTable('OrganizationSettings', {
  id:           text('id').primaryKey(),
  orgName:      text('orgName').notNull().default('Ambedkarite Buddhist Organization Canada'),
  shortName:    text('shortName').notNull().default('ABC Canada'),
  email:        text('email').notNull().default('info@ambedkaritebuddhist.ca'),
  phone:        text('phone'),
  altPhone:     text('altPhone'),
  addressLine1: text('addressLine1'),
  addressLine2: text('addressLine2'),
  city:         text('city'),
  province:     text('province'),
  postalCode:   text('postalCode'),
  country:      text('country').notNull().default('Canada'),
  website:      text('website'),
  description:  text('description'),
  updatedAt:    text('updatedAt').notNull().default(sql`(datetime('now'))`),
});

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
export type ContactMessage = typeof contactMessages.$inferSelect;
export type NewContactMessage = typeof contactMessages.$inferInsert;
export type OrganizationSettings = typeof organizationSettings.$inferSelect;
