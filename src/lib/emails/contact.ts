import { sendEmail } from '@/lib/email';
import { getOrgContact, resolveSender } from '@/lib/email-senders-server';
import { ctaButton, escapeHtml, infoRow, layout, multilineText } from '@/lib/email-templates';

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  /** Sent while signed in to this member account */
  isMember: boolean;
};

/** Link that opens the dashboard on this message (sign-in first if needed). */
export function messageDashboardUrl(origin: string, messageId: string): string {
  return `${origin.replace(/\/+$/, '')}/dashboard?tab=messages&message=${encodeURIComponent(messageId)}`;
}

/**
 * Notice of a new Contact Us message, sent to the Contact messages address in
 * Settings → Email (or the organization email when that is blank). Replying
 * to the email goes to the person who wrote in.
 */
export async function sendContactMessageNotice({ message, origin }: { message: ContactMessage; origin: string }) {
  const [branding, { address: recipient }] = await Promise.all([getOrgContact(), resolveSender('contact')]);
  const replySubject = `Re: ${message.subject}`;
  const mailto = `mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(replySubject)}`;

  return sendEmail('contact', {
    to: recipient,
    replyTo: message.email,
    subject: `New message: ${message.subject}`,
    html: layout(
      branding,
      `<h2 style="margin:0 0 16px;font-size:18px">New message from the Contact Us page</h2>
      <table style="border-collapse:collapse;margin-bottom:16px">
        ${infoRow('From', message.name)}
        ${infoRow('Email', message.email)}
        ${infoRow('Phone', message.phone || '—')}
        ${infoRow('Member', message.isMember ? 'Yes (sent while signed in)' : 'No')}
        ${infoRow('Subject', message.subject)}
      </table>
      ${multilineText(message.message)}
      <p style="margin:24px 0 8px">
        ${ctaButton(messageDashboardUrl(origin, message.id), 'Open in Messages')}${ctaButton(mailto, `Reply to ${message.name}`, 'secondary')}
      </p>
      <p style="margin:0;font-size:13px;color:#6B7280">Mark it resolved in Messages once it has been answered, so other admins know it’s handled. Replying to this email goes straight to ${escapeHtml(message.email)}.</p>`,
    ),
  });
}
