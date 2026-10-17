import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { emailSenders, organizationSettings, users } from '@/db/schema';
import type { EmailPurpose } from '@/lib/email-senders';

const FALLBACK_NAME = 'Ambedkarite Buddhist Community of Canada';
const FALLBACK_ADDRESS = 'info@ambedkaritebuddhist.ca';

export type ResolvedSender = {
  address: string;
  name: string;
  /** Where the address came from: the purpose's own address or the organization email */
  source: 'purpose' | 'organization';
};

/**
 * The address (and display name) to send from: the purpose's address if an
 * admin set one, otherwise the organization email from Settings.
 */
export async function resolveSender(purpose?: EmailPurpose): Promise<ResolvedSender> {
  const db = getDb();

  const org = await db
    .select({ email: organizationSettings.email, orgName: organizationSettings.orgName })
    .from(organizationSettings)
    .where(eq(organizationSettings.id, 'main'))
    .limit(1)
    .then((rows) => rows[0]);
  const name = org?.orgName?.trim() || FALLBACK_NAME;

  if (purpose) {
    const row = await db
      .select({ address: emailSenders.address })
      .from(emailSenders)
      .where(eq(emailSenders.purpose, purpose))
      .limit(1)
      .then((rows) => rows[0]);
    if (row?.address) return { address: row.address, name, source: 'purpose' };
  }

  return { address: org?.email?.trim() || FALLBACK_ADDRESS, name, source: 'organization' };
}

/** Organization name and contact email, for email headers/footers. */
export async function getOrgContact(): Promise<{ orgName: string; contactEmail: string }> {
  const sender = await resolveSender();
  return { orgName: sender.name, contactEmail: sender.address };
}

/**
 * Admins who should receive notifications: active ADMIN accounts in the
 * database plus anyone listed in the ADMIN_EMAIL setting, without duplicates.
 */
export async function getAdminRecipients(): Promise<string[]> {
  const fromEnv = (process.env.ADMIN_EMAIL ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

  let fromDb: string[] = [];
  try {
    fromDb = await getDb()
      .select({ email: users.email })
      .from(users)
      .where(and(eq(users.role, 'ADMIN'), eq(users.status, 'active')))
      .then((rows) => rows.map((r) => r.email.trim().toLowerCase()));
  } catch (error) {
    console.error('[email] Could not load admin recipients:', error);
  }

  return Array.from(new Set([...fromDb, ...fromEnv]));
}
