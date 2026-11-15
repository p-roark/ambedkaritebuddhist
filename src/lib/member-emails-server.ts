import { and, desc, eq, inArray, lt, or, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { memberEmailRecipients, memberEmails, users } from '@/db/schema';
import { isEmailConfigured, sendEmailAs } from '@/lib/email';
import { getOrgContact, resolveSender } from '@/lib/email-senders-server';
import { renderMemberEmail } from '@/lib/member-email';

/**
 * Emails per send request. Each email is one outgoing request to Gmail, and a
 * Worker on the free plan may make at most 50 outgoing requests and 50
 * database queries per request; 15 leaves room for the token and bookkeeping.
 */
export const SEND_BATCH_SIZE = 15;

/** Recipients claimed by a request that never finished are retried after this. */
const STALE_CLAIM_MS = 10 * 60_000;

export const MAX_RECIPIENTS = 2000;

export type MemberEmailProgress = { total: number; sent: number; failed: number; pending: number };

/**
 * Creates an email to the chosen members and its recipient list. Only active
 * accounts with an email address are included, whatever ids are sent.
 * Returns null if none of them can receive it.
 */
export async function createMemberEmail(input: {
  subject: string;
  body: string;
  templateId: string | null;
  userIds: string[];
  sentBy: string;
}): Promise<{ id: string; recipientCount: number } | null> {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.insert(memberEmails).values({
    id,
    subject: input.subject,
    body: input.body,
    templateId: input.templateId,
    sentBy: input.sentBy,
    recipientCount: 0,
    createdAt: now,
  });

  // One statement for any number of recipients (the ids go in as one JSON array)
  await db.run(sql`
    INSERT OR IGNORE INTO "MemberEmailRecipient" ("emailId", "userId", "email", "name", "status")
    SELECT ${id}, u."id", lower(trim(u."email")), u."name", 'pending'
    FROM "User" u, json_each(${JSON.stringify(input.userIds)}) ids
    WHERE u."id" = ids.value AND u."status" = 'active' AND trim(coalesce(u."email", '')) <> ''
  `);

  const [{ n }] = await db
    .select({ n: sql<number>`count(*)` })
    .from(memberEmailRecipients)
    .where(eq(memberEmailRecipients.emailId, id));
  if (n === 0) {
    await db.delete(memberEmails).where(eq(memberEmails.id, id));
    return null;
  }
  await db.update(memberEmails).set({ recipientCount: n }).where(eq(memberEmails.id, id));
  return { id, recipientCount: n };
}

export async function getProgress(emailId: string): Promise<MemberEmailProgress> {
  const rows = await getDb()
    .select({ status: memberEmailRecipients.status, n: sql<number>`count(*)` })
    .from(memberEmailRecipients)
    .where(eq(memberEmailRecipients.emailId, emailId))
    .groupBy(memberEmailRecipients.status);
  const count = (status: string) => rows.find((r) => r.status === status)?.n ?? 0;
  const sent = count('sent');
  const failed = count('failed');
  const pending = count('pending') + count('sending');
  return { total: sent + failed + pending, sent, failed, pending };
}

export type SendBatchResult =
  | { ok: true; progress: MemberEmailProgress }
  | { ok: false; status: number; error: string };

/** Sends the next batch of a member email and returns how far it has got. */
export async function sendNextBatch(emailId: string): Promise<SendBatchResult> {
  const db = getDb();
  const email = await db.select().from(memberEmails).where(eq(memberEmails.id, emailId)).limit(1).then((r) => r[0]);
  if (!email) return { ok: false, status: 404, error: 'Email not found' };
  if (!isEmailConfigured()) {
    return { ok: false, status: 503, error: 'Email sending isn’t set up on this site yet (Gmail secrets missing).' };
  }

  // Claim the next recipients, so two open tabs can't send to the same person
  const now = new Date();
  const waiting = or(
    eq(memberEmailRecipients.status, 'pending'),
    and(eq(memberEmailRecipients.status, 'sending'), lt(memberEmailRecipients.sentAt, new Date(now.getTime() - STALE_CLAIM_MS).toISOString())),
  );
  const next = db
    .select({ email: memberEmailRecipients.email })
    .from(memberEmailRecipients)
    .where(and(eq(memberEmailRecipients.emailId, emailId), waiting))
    .limit(SEND_BATCH_SIZE);
  const batch = await db
    .update(memberEmailRecipients)
    .set({ status: 'sending', sentAt: now.toISOString() })
    .where(and(eq(memberEmailRecipients.emailId, emailId), waiting, inArray(memberEmailRecipients.email, next)))
    .returning({ email: memberEmailRecipients.email, name: memberEmailRecipients.name });

  if (batch.length > 0) {
    const [sender, branding] = await Promise.all([resolveSender('announcements'), getOrgContact()]);
    const sent: string[] = [];
    const failed: Array<{ email: string; error: string }> = [];
    for (const recipient of batch) {
      const { subject, html } = renderMemberEmail(email, recipient, branding);
      try {
        await sendEmailAs(sender, { to: recipient.email, subject, html });
        sent.push(recipient.email);
      } catch (error) {
        failed.push({ email: recipient.email, error: (error instanceof Error ? error.message : String(error)).slice(0, 300) });
      }
    }
    const doneAt = new Date().toISOString();
    if (sent.length > 0) {
      await db
        .update(memberEmailRecipients)
        .set({ status: 'sent', sentAt: doneAt, error: null })
        .where(and(eq(memberEmailRecipients.emailId, emailId), inArray(memberEmailRecipients.email, sent)));
    }
    for (const f of failed) {
      await db
        .update(memberEmailRecipients)
        .set({ status: 'failed', sentAt: doneAt, error: f.error })
        .where(and(eq(memberEmailRecipients.emailId, emailId), eq(memberEmailRecipients.email, f.email)));
    }
    if (failed.length > 0) console.error(`[member-email] ${failed.length} of ${batch.length} failed in ${emailId}:`, failed[0].error);
  }

  return { ok: true, progress: await getProgress(emailId) };
}

/** Puts failed recipients back in the queue, for "Retry failed". */
export async function retryFailed(emailId: string): Promise<number> {
  const rows = await getDb()
    .update(memberEmailRecipients)
    .set({ status: 'pending', error: null })
    .where(and(eq(memberEmailRecipients.emailId, emailId), eq(memberEmailRecipients.status, 'failed')))
    .returning({ email: memberEmailRecipients.email });
  return rows.length;
}

export type MemberEmailSummary = {
  id: string;
  subject: string;
  sentBy: string;
  createdAt: string;
} & MemberEmailProgress;

/** Most recent member emails with their delivery counts. */
export async function listMemberEmails(limit = 20): Promise<MemberEmailSummary[]> {
  const rows = await getDb()
    .select({
      id: memberEmails.id,
      subject: memberEmails.subject,
      sentBy: memberEmails.sentBy,
      createdAt: memberEmails.createdAt,
      total: sql<number>`count(${memberEmailRecipients.email})`,
      sent: sql<number>`coalesce(sum(case when ${memberEmailRecipients.status} = 'sent' then 1 else 0 end), 0)`,
      failed: sql<number>`coalesce(sum(case when ${memberEmailRecipients.status} = 'failed' then 1 else 0 end), 0)`,
    })
    .from(memberEmails)
    .leftJoin(memberEmailRecipients, eq(memberEmailRecipients.emailId, memberEmails.id))
    .groupBy(memberEmails.id)
    .orderBy(desc(memberEmails.createdAt))
    .limit(limit);
  return rows.map((r) => ({ ...r, pending: r.total - r.sent - r.failed }));
}

/** Failed recipients of one email, with the reason. */
export async function listFailedRecipients(emailId: string) {
  return getDb()
    .select({ email: memberEmailRecipients.email, name: memberEmailRecipients.name, error: memberEmailRecipients.error })
    .from(memberEmailRecipients)
    .where(and(eq(memberEmailRecipients.emailId, emailId), eq(memberEmailRecipients.status, 'failed')));
}

/** Sends the email to the admin only, filled in with their own name, to check it. */
export async function sendTestMemberEmail(message: { subject: string; body: string }, adminEmail: string): Promise<SendBatchResult> {
  if (!isEmailConfigured()) {
    return { ok: false, status: 503, error: 'Email sending isn’t set up on this site yet (Gmail secrets missing).' };
  }
  const admin = await getDb()
    .select({ name: users.name })
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1)
    .then((r) => r[0]);
  const [sender, branding] = await Promise.all([resolveSender('announcements'), getOrgContact()]);
  const { subject, html } = renderMemberEmail(message, { name: admin?.name ?? 'Admin' }, branding);
  try {
    await sendEmailAs(sender, { to: adminEmail, subject: `[Test] ${subject}`, html });
    return { ok: true, progress: { total: 1, sent: 1, failed: 0, pending: 0 } };
  } catch (error) {
    return { ok: false, status: 502, error: `Could not send the test email: ${error instanceof Error ? error.message : String(error)}` };
  }
}
