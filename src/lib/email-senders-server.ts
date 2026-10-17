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
  const [{ eq }, { getDb }, { emailSenders, organizationSettings }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
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
