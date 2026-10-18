import { sendEmail } from '@/lib/email';
import { getOrgContact } from '@/lib/email-senders-server';
import { ctaButton, escapeHtml, layout, paragraph } from '@/lib/email-templates';

/** One-time sign-in link email. Returns false when email isn't configured. */
export async function sendSignInLinkEmail({ to, url }: { to: string; url: string }) {
  const branding = await getOrgContact();
  return sendEmail('signIn', {
    to,
    subject: `Your sign-in link for ${branding.orgName}`,
    html: layout(
      branding,
      `<h2 style="margin:0 0 16px;font-size:18px">Sign in to ${escapeHtml(branding.orgName)}</h2>
      ${paragraph('Use the button below to sign in. The link works once and expires in 15 minutes.')}
      <p style="margin:24px 0">${ctaButton(url, 'Sign in')}</p>
      ${paragraph('If you didn’t ask to sign in, you can ignore this email — nobody can sign in without this link.')}`,
    ),
  });
}
