import { Resend } from 'resend';

const FROM_ADDRESS = 'contact@ambedkaritebuddhist.org';

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — email will be skipped');
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
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
}) {
  const resend = getResend();
  if (!resend) return;

  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://ambedkaritebuddhist.org';
  const magicLink = `${baseUrl}/family/accept-invite?code=${inviteCode}`;

  await resend.emails.send({
    from: `Ambedkarite Buddhist Community <${FROM_ADDRESS}>`,
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
