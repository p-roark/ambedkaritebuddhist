const FROM_NAME = 'Ambedkarite Buddhist Community';
const FROM_ADDRESS = 'contact@ambedkaritebuddhist.org';
const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.send';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GMAIL_SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

// Convert ArrayBuffer or Uint8Array to base64url string
function toBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  // Process in chunks to avoid "Maximum call stack size exceeded" on large buffers
  const CHUNK = 8192;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// base64url-encode a plain string (UTF-8 safe)
function encodeBase64Url(str: string): string {
  return toBase64Url(new TextEncoder().encode(str));
}

// Sign and return a JWT using the service account private key (RS256)
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

// Exchange a signed JWT for a short-lived Gmail access token
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

// Build a raw RFC 2822 message and send it via the Gmail API
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
  const senderEmail = process.env.GMAIL_SENDER_EMAIL ?? FROM_ADDRESS;

  if (!serviceAccountEmail || !privateKey) {
    console.warn('[email] GMAIL_SERVICE_ACCOUNT_EMAIL or GMAIL_PRIVATE_KEY not set — email will be skipped');
    return null;
  }

  return { serviceAccountEmail, privateKey, senderEmail };
}

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
  const config = getGmailConfig();
  if (!config) return;

  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://ambedkaritebuddhist.org';
  const magicLink = `${baseUrl}/family/accept-invite?code=${inviteCode}`;

  const accessToken = await getAccessToken(config.serviceAccountEmail, config.privateKey, config.senderEmail);

  await sendViaGmail(accessToken, config.senderEmail, {
    to,
    subject: `${inviterName} has added you as a family member`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1F2937">
        <div style="background:#2D4D9B;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#E8B20E;margin:0;font-size:20px">Ambedkarite Buddhist Community of Canada</h1>
        </div>
        <div style="background:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
          <h2 style="margin:0 0 16px;font-size:18px">You've been added as a family member</h2>
          <p style="margin:0 0 12px;color:#374151">
            <strong>${inviterName}</strong> has added you as their <strong>${relationship}</strong>
            in the Ambedkarite Buddhist Community of Canada.
          </p>
          <p style="margin:0 0 24px;color:#374151">
            Click the button below to link your account and view your shared family profile.
          </p>
          <a href="${magicLink}"
             style="display:inline-block;background:#E8B20E;color:#1F2937;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px">
            Accept &amp; Link Account
          </a>
          <p style="margin:24px 0 0;font-size:13px;color:#6B7280">
            Or enter this code manually on your profile page:<br/>
            <code style="background:#f3f4f6;padding:4px 8px;border-radius:4px;font-size:13px">${inviteCode}</code>
          </p>
          <p style="margin:16px 0 0;font-size:12px;color:#9CA3AF">
            This invite expires in 30 days. If you did not expect this email, you can safely ignore it.
          </p>
        </div>
      </div>
    `,
  });
}
