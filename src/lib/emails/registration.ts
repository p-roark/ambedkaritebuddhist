import { sendEmail } from '@/lib/email';
import { getOrgContact, resolveSender } from '@/lib/email-senders-server';
import { ctaButton, escapeHtml, infoRow, layout, paragraph } from '@/lib/email-templates';
import { PROVINCE_OPTIONS, RESIDENCY_STATUS_OPTIONS } from '@/lib/registration-config';

type RegisteredMember = {
  name: string;
  email: string;
  city: string | null;
  province: string | null;
  residencyStatus: string | null;
  inviteCode: string | null;
};

const labelFor = (options: ReadonlyArray<{ value: string; label: string }>, value: string | null) =>
  (value && options.find((o) => o.value === value)?.label) || value || '—';

/** Welcome email to a member who has just completed registration. */
export async function sendWelcomeEmail({ member, origin }: { member: RegisteredMember; origin: string }) {
  const branding = await getOrgContact();
  return sendEmail('registrations', {
    to: member.email,
    subject: `Welcome to ${branding.orgName}`,
    html: layout(
      branding,
      `<h2 style="margin:0 0 16px;font-size:18px">Welcome, ${escapeHtml(member.name)}! 🪷</h2>
      ${paragraph(`Your registration with ${branding.orgName} is complete. Thank you for joining our community.`)}
      ${paragraph('You can view or update your details at any time on your profile page.')}
      <p style="margin:24px 0">${ctaButton(`${origin}/profile`, 'View your profile')}</p>
      ${paragraph('Jai Bhim!')}`,
    ),
  });
}

/**
 * Notice that a member completed the registration form, sent to the
 * Registrations address in Settings → Email (or the organization email when
 * that is blank).
 */
export async function sendNewRegistrationAdminEmail({
  member,
  isNewMember,
  origin,
}: {
  member: RegisteredMember;
  isNewMember: boolean;
  origin: string;
}) {
  const { address: recipient } = await resolveSender('registrations');
  const branding = await getOrgContact();
  const location = [member.city, labelFor(PROVINCE_OPTIONS, member.province)].filter((v) => v && v !== '—').join(', ') || '—';
  const heading = isNewMember ? 'New member registered' : 'Existing member completed registration';

  return sendEmail('registrations', {
    to: recipient,
    subject: `${heading}: ${member.name}`,
    html: layout(
      branding,
      `<h2 style="margin:0 0 16px;font-size:18px">${escapeHtml(heading)}</h2>
      <table style="border-collapse:collapse;margin-bottom:16px">
        ${infoRow('Name', member.name)}
        ${infoRow('Email', member.email)}
        ${infoRow('Location', location)}
        ${infoRow('Residency status', labelFor(RESIDENCY_STATUS_OPTIONS, member.residencyStatus))}
        ${infoRow('Invite code', member.inviteCode ?? '—')}
      </table>
      <p style="margin:0">${ctaButton(`${origin}/dashboard`, 'Open the dashboard')}</p>`,
    ),
  });
}
