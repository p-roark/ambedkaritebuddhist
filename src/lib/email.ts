const FROM_NAME = 'Ambedkarite Buddhist Community';
const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.send';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GMAIL_SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

// ─── Encoding helpers ─────────────────────────────────────────────────────────

function toBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  // Chunked to avoid "Maximum call stack size exceeded" on large buffers
  const CHUNK = 8192;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function encodeBase64Url(str: string): string {
  return toBase64Url(new TextEncoder().encode(str));
}

// ─── Gmail service-account auth ───────────────────────────────────────────────

async function buildServiceAccountJwt(
  serviceAccountEmail: string,
  privateKeyPem: string,
  senderEmail: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = encodeBase64Url(
    JSON.stringify({
      iss: serviceAccountEmail,
      sub: senderEmail,
      scope: GMAIL_SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );

  const signingInput = `${header}.${payload}`;

  // Normalize PEM — Cloudflare secrets often store \n as literal backslash-n
  const normalizedPem = privateKeyPem.replace(/\\n/g, '\n');
  const pemBody = normalizedPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');

  const keyBuffer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );

  return `${signingInput}.${toBase64Url(signature)}`;
}

async function getAccessToken(
  serviceAccountEmail: string,
  privateKeyPem: string,
  senderEmail: string,
): Promise<string> {
  const jwt = await buildServiceAccountJwt(serviceAccountEmail, privateKeyPem, senderEmail);

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[email] Failed to get Gmail access token: ${err}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function sendViaGmail(
  accessToken: string,
  senderEmail: string,
  { to, subject, html }: { to: string; subject: string; html: string },
): Promise<void> {
  const raw = [
    `From: ${FROM_NAME} <${senderEmail}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    html,
  ].join('\r\n');

  const encodedRaw = toBase64Url(new TextEncoder().encode(raw));

  const res = await fetch(GMAIL_SEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encodedRaw }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[email] Gmail API send failed: ${err}`);
  }
}

function getGmailConfig(): { serviceAccountEmail: string; privateKey: string; senderEmail: string } | null {
  const serviceAccountEmail = process.env.GMAIL_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GMAIL_PRIVATE_KEY;
  const senderEmail = process.env.GMAIL_SENDER_EMAIL ?? 'contact@ambedkaritebuddhist.ca';

  if (!serviceAccountEmail || !privateKey) {
    console.warn('[email] GMAIL_SERVICE_ACCOUNT_EMAIL or GMAIL_PRIVATE_KEY not set — email will be skipped');
    return null;
  }

  return { serviceAccountEmail, privateKey, senderEmail };
}

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAIL ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
}

// ─── Shared HTML helpers ──────────────────────────────────────────────────────

function layout(body: string): string {
  return `<div style="font-family:sans-serif;max-width:580px;margin:0 auto;color:#1F2937;padding:16px">
  <div style="background:#2D4D9B;padding:24px 32px;border-radius:12px 12px 0 0">
    <h1 style="color:#E8B20E;margin:0;font-size:20px">Ambedkarite Buddhist Community of Canada</h1>
  </div>
  <div style="background:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
    ${body}
    <p style="margin:32px 0 0;font-size:12px;color:#9CA3AF;border-top:1px solid #f3f4f6;padding-top:16px">
      Ambedkarite Buddhist Community of Canada &mdash; contact@ambedkaritebuddhist.ca
    </p>
  </div>
</div>`;
}

function ctaButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#E8B20E;color:#1F2937;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px">${label}</a>`;
}

function infoRow(label: string, value: string): string {
  return `<tr><td style="padding:6px 12px 6px 0;color:#6B7280;white-space:nowrap;font-size:14px">${label}</td><td style="padding:6px 0;font-weight:600;font-size:14px">${value}</td></tr>`;
}

function formatEventDate(date: string, time: string): string {
  try {
    const dt = new Date(`${date}T${time}`);
    return dt.toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) +
      ' at ' + dt.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' });
  } catch {
    return `${date} at ${time}`;
  }
}

// ─── Core send helper (shared by all public functions) ────────────────────────

async function send(to: string, subject: string, html: string): Promise<void> {
  const config = getGmailConfig();
  if (!config) return;
  const accessToken = await getAccessToken(config.serviceAccountEmail, config.privateKey, config.senderEmail);
  await sendViaGmail(accessToken, config.senderEmail, { to, subject, html });
}

// ─── Family invite ─────────────────────────────────────────────────────────────

export async function sendFamilyInviteEmail({
  to,
  inviterName,
  relationship,
  inviteCode,
}: {
  to: string;
  inviterName: string;
  relationship: string;
  inviteCode: string;
}): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://ambedkaritebuddhist.ca';
  const magicLink = `${baseUrl}/family/accept-invite?code=${inviteCode}`;

  await send(
    to,
    `${inviterName} has added you as a family member`,
    layout(`
      <h2 style="margin:0 0 16px;font-size:18px">You've been added as a family member</h2>
      <p style="margin:0 0 12px;color:#374151">
        <strong>${inviterName}</strong> has added you as their <strong>${relationship}</strong>
        in the Ambedkarite Buddhist Community of Canada.
      </p>
      <p style="margin:0 0 24px;color:#374151">
        Click the button below to link your account and view your shared family profile.
      </p>
      ${ctaButton(magicLink, 'Accept &amp; Link Account')}
      <p style="margin:24px 0 0;font-size:13px;color:#6B7280">
        Or enter this code manually on your profile page:<br/>
        <code style="background:#f3f4f6;padding:4px 8px;border-radius:4px;font-size:13px">${inviteCode}</code>
      </p>
      <p style="margin:16px 0 0;font-size:12px;color:#9CA3AF">
        This invite expires in 30 days. If you did not expect this email, you can safely ignore it.
      </p>
    `),
  );
}

// ─── Event registration ───────────────────────────────────────────────────────

export interface EventEmailInfo {
  title: string;
  date: string;
  time: string;
  location: string;
}

export async function sendEventRegistrationEmail({
  to,
  userName,
  event,
  adultsCount,
  childrenCount,
  totalAmount,
  isPaid,
  paymentInstructions,
}: {
  to: string;
  userName: string;
  event: EventEmailInfo;
  adultsCount: number;
  childrenCount: number;
  totalAmount: number;
  isPaid: boolean;
  paymentInstructions?: string | null;
}): Promise<void> {
  const attendeeSummary = [
    adultsCount > 0 ? `${adultsCount} adult${adultsCount > 1 ? 's' : ''}` : '',
    childrenCount > 0 ? `${childrenCount} child${childrenCount > 1 ? 'ren' : ''}` : '',
  ].filter(Boolean).join(', ');

  const paymentSection = isPaid
    ? `<div style="margin:24px 0;padding:16px;background:#fef9ec;border:1px solid #E8B20E;border-radius:8px">
        <p style="margin:0 0 8px;font-weight:600;color:#1F2937">Payment required: $${totalAmount}</p>
        ${paymentInstructions
          ? `<p style="margin:0;color:#374151;font-size:14px;white-space:pre-line">${paymentInstructions}</p>`
          : `<p style="margin:0;color:#6B7280;font-size:14px">An admin will follow up with payment details shortly.</p>`}
      </div>`
    : `<p style="margin:16px 0 0;color:#374151">This is a free event. Your spot has been reserved.</p>`;

  await send(
    to,
    `Registration received: ${event.title}`,
    layout(`
      <h2 style="margin:0 0 8px;font-size:18px">Registration received!</h2>
      <p style="margin:0 0 20px;color:#374151">Hi ${userName}, your registration for <strong>${event.title}</strong> has been received. We'll confirm your spot shortly.</p>
      <table style="border-collapse:collapse;margin-bottom:8px">
        ${infoRow('Event', event.title)}
        ${infoRow('Date & Time', formatEventDate(event.date, event.time))}
        ${infoRow('Location', event.location)}
        ${infoRow('Attendees', attendeeSummary)}
      </table>
      ${paymentSection}
      <p style="margin:24px 0 0;font-size:13px;color:#6B7280">
        If you have any questions, reply to this email or contact us at contact@ambedkaritebuddhist.ca.
      </p>
    `),
  );
}

export async function sendEventPaymentConfirmedEmail({
  to,
  userName,
  event,
  paidAmount,
}: {
  to: string;
  userName: string;
  event: EventEmailInfo;
  paidAmount: number;
}): Promise<void> {
  await send(
    to,
    `Payment confirmed: ${event.title}`,
    layout(`
      <h2 style="margin:0 0 8px;font-size:18px">Payment confirmed — you're all set!</h2>
      <p style="margin:0 0 20px;color:#374151">Hi ${userName}, your payment has been received and your registration for <strong>${event.title}</strong> is now confirmed.</p>
      <table style="border-collapse:collapse;margin-bottom:8px">
        ${infoRow('Event', event.title)}
        ${infoRow('Date & Time', formatEventDate(event.date, event.time))}
        ${infoRow('Location', event.location)}
        ${infoRow('Amount Paid', `$${paidAmount}`)}
      </table>
      <p style="margin:24px 0 0;font-size:13px;color:#6B7280">
        We look forward to seeing you there!
      </p>
    `),
  );
}

export async function sendEventRegistrationAdminEmail({
  event,
  registrantName,
  registrantEmail,
  adultsCount,
  childrenCount,
  totalAmount,
  isPaid,
}: {
  event: EventEmailInfo;
  registrantName: string;
  registrantEmail: string;
  adultsCount: number;
  childrenCount: number;
  totalAmount: number;
  isPaid: boolean;
}): Promise<void> {
  const adminEmails = getAdminEmails();
  if (!adminEmails.length) return;

  const attendeeSummary = [
    adultsCount > 0 ? `${adultsCount} adult${adultsCount > 1 ? 's' : ''}` : '',
    childrenCount > 0 ? `${childrenCount} child${childrenCount > 1 ? 'ren' : ''}` : '',
  ].filter(Boolean).join(', ');

  const html = layout(`
    <h2 style="margin:0 0 16px;font-size:18px">New event registration</h2>
    <table style="border-collapse:collapse;margin-bottom:8px">
      ${infoRow('Event', event.title)}
      ${infoRow('Date', formatEventDate(event.date, event.time))}
      ${infoRow('Registrant', registrantName)}
      ${infoRow('Email', registrantEmail)}
      ${infoRow('Attendees', attendeeSummary)}
      ${isPaid ? infoRow('Amount Due', `$${totalAmount}`) : infoRow('Payment', 'Free event')}
    </table>
  `);

  await Promise.all(
    adminEmails.map((adminEmail) =>
      send(adminEmail, `New registration: ${registrantName} for ${event.title}`, html),
    ),
  );
}

// ─── Donations ────────────────────────────────────────────────────────────────

export async function sendDonationReceivedEmail({
  to,
  donorName,
  amountCents,
  objectiveTitle,
}: {
  to: string;
  donorName: string;
  amountCents: number;
  objectiveTitle?: string | null;
}): Promise<void> {
  const amountFormatted = `$${(amountCents / 100).toFixed(2)}`;
  const forLine = objectiveTitle
    ? `<p style="margin:0 0 8px;color:#374151">Campaign: <strong>${objectiveTitle}</strong></p>`
    : '';

  await send(
    to,
    'Thank you for your donation',
    layout(`
      <h2 style="margin:0 0 8px;font-size:18px">Thank you, ${donorName}!</h2>
      <p style="margin:0 0 16px;color:#374151">We've received your donation of <strong>${amountFormatted}</strong> to the Ambedkarite Buddhist Community of Canada.</p>
      ${forLine}
      <p style="margin:0 0 16px;color:#374151">Your contribution will be reviewed and confirmed by our team. You'll receive a confirmation email once it's processed.</p>
      <p style="margin:0;font-size:13px;color:#6B7280">
        For questions about your donation, contact us at contact@ambedkaritebuddhist.ca.
      </p>
    `),
  );
}

export async function sendDonationConfirmedEmail({
  to,
  donorName,
  amountCents,
  objectiveTitle,
}: {
  to: string;
  donorName: string;
  amountCents: number;
  objectiveTitle?: string | null;
}): Promise<void> {
  const amountFormatted = `$${(amountCents / 100).toFixed(2)}`;
  const forLine = objectiveTitle
    ? `<p style="margin:0 0 8px;color:#374151">Campaign: <strong>${objectiveTitle}</strong></p>`
    : '';

  await send(
    to,
    'Your donation has been confirmed',
    layout(`
      <h2 style="margin:0 0 8px;font-size:18px">Donation confirmed — thank you!</h2>
      <p style="margin:0 0 16px;color:#374151">Hi ${donorName}, your donation of <strong>${amountFormatted}</strong> has been confirmed. Your generosity supports our community's work.</p>
      ${forLine}
      <p style="margin:0;font-size:13px;color:#6B7280">
        Please keep this email as your receipt. For questions, contact us at contact@ambedkaritebuddhist.ca.
      </p>
    `),
  );
}

export async function sendDonationAdminEmail({
  donorName,
  donorEmail,
  amountCents,
  objectiveTitle,
  message,
}: {
  donorName: string;
  donorEmail: string;
  amountCents: number;
  objectiveTitle?: string | null;
  message?: string | null;
}): Promise<void> {
  const adminEmails = getAdminEmails();
  if (!adminEmails.length) return;

  const amountFormatted = `$${(amountCents / 100).toFixed(2)}`;

  const html = layout(`
    <h2 style="margin:0 0 16px;font-size:18px">New donation received</h2>
    <table style="border-collapse:collapse;margin-bottom:8px">
      ${infoRow('Donor', donorName)}
      ${infoRow('Email', donorEmail)}
      ${infoRow('Amount', amountFormatted)}
      ${objectiveTitle ? infoRow('Campaign', objectiveTitle) : ''}
      ${message ? infoRow('Message', message) : ''}
    </table>
    <p style="margin:16px 0 0;font-size:13px;color:#6B7280">Log in to the admin panel to confirm this donation.</p>
  `);

  await Promise.all(
    adminEmails.map((adminEmail) =>
      send(adminEmail, `New donation: ${amountFormatted} from ${donorName}`, html),
    ),
  );
}

// ─── Contact form ─────────────────────────────────────────────────────────────

export async function sendContactAcknowledgmentEmail({
  to,
  name,
  subject,
}: {
  to: string;
  name: string;
  subject: string;
}): Promise<void> {
  await send(
    to,
    `We received your message: ${subject}`,
    layout(`
      <h2 style="margin:0 0 8px;font-size:18px">Message received!</h2>
      <p style="margin:0 0 16px;color:#374151">Hi ${name}, thank you for reaching out. We've received your message about <strong>${subject}</strong> and will get back to you within 2–3 business days.</p>
      <p style="margin:0;font-size:13px;color:#6B7280">
        If your matter is urgent, you can also reach us directly at contact@ambedkaritebuddhist.ca.
      </p>
    `),
  );
}

export async function sendContactAdminEmail({
  name,
  email,
  phone,
  subject,
  message,
}: {
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
}): Promise<void> {
  const adminEmails = getAdminEmails();
  if (!adminEmails.length) return;

  const html = layout(`
    <h2 style="margin:0 0 16px;font-size:18px">New contact message</h2>
    <table style="border-collapse:collapse;margin-bottom:16px">
      ${infoRow('From', name)}
      ${infoRow('Email', email)}
      ${phone ? infoRow('Phone', phone) : ''}
      ${infoRow('Subject', subject)}
    </table>
    <p style="margin:0 0 8px;font-weight:600;font-size:14px">Message:</p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;font-size:14px;color:#374151;white-space:pre-line">${message}</div>
    <p style="margin:16px 0 0;font-size:13px;color:#6B7280">Log in to the admin panel to view and respond to this message.</p>
  `);

  await Promise.all(
    adminEmails.map((adminEmail) =>
      send(adminEmail, `New message: ${subject} — from ${name}`, html),
    ),
  );
}

// ─── Account activation ────────────────────────────────────────────────────────

export async function sendActivationRequestAdminEmail({
  userName,
  userEmail,
  requestNumber,
}: {
  userName: string;
  userEmail: string;
  requestNumber: number;
}): Promise<void> {
  const adminEmails = getAdminEmails();
  if (!adminEmails.length) return;

  const html = layout(`
    <h2 style="margin:0 0 16px;font-size:18px">Account activation request</h2>
    <table style="border-collapse:collapse;margin-bottom:8px">
      ${infoRow('Member', userName)}
      ${infoRow('Email', userEmail)}
      ${infoRow('Request #', String(requestNumber))}
    </table>
    <p style="margin:16px 0 0;font-size:13px;color:#6B7280">Log in to the admin panel to approve or reject this request.</p>
  `);

  await Promise.all(
    adminEmails.map((adminEmail) =>
      send(adminEmail, `Activation request from ${userName}`, html),
    ),
  );
}

export async function sendActivationDecisionEmail({
  to,
  userName,
  accepted,
}: {
  to: string;
  userName: string;
  accepted: boolean;
}): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://ambedkaritebuddhist.ca';

  if (accepted) {
    await send(
      to,
      'Your account has been reactivated',
      layout(`
        <h2 style="margin:0 0 8px;font-size:18px">Account reactivated!</h2>
        <p style="margin:0 0 24px;color:#374151">Hi ${userName}, your account activation request has been approved. You can now sign in and access all community features.</p>
        ${ctaButton(`${baseUrl}/`, 'Sign In')}
      `),
    );
  } else {
    await send(
      to,
      'Account activation request update',
      layout(`
        <h2 style="margin:0 0 8px;font-size:18px">Activation request not approved</h2>
        <p style="margin:0 0 16px;color:#374151">Hi ${userName}, unfortunately your account activation request was not approved at this time.</p>
        <p style="margin:0;font-size:13px;color:#6B7280">
          If you believe this is an error, please contact us at contact@ambedkaritebuddhist.ca.
        </p>
      `),
    );
  }
}
