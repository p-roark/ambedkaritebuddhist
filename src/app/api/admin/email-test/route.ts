import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { sendTestEmail } from '@/lib/email';
import { isEmailPurpose } from '@/lib/email-senders';

export const dynamic = 'force-dynamic';

// POST /api/admin/email-test — body: { purpose? }
// Sends a test email to the signed-in admin only, from the purpose's sender
// (or the organization email when no purpose is given).
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as { purpose?: unknown };
  if (body.purpose !== undefined && body.purpose !== null && !isEmailPurpose(body.purpose)) {
    return NextResponse.json({ error: 'Unknown email purpose' }, { status: 400 });
  }
  const purpose = isEmailPurpose(body.purpose) ? body.purpose : undefined;

  const result = await sendTestEmail(admin.email, admin.email, { purpose });
  console.log(`Admin ${admin.email} sent a test email (${purpose ?? 'default'}): ${result.ok ? 'accepted by Gmail' : `failed at ${result.stage}`}`);
  return NextResponse.json(result, { status: 200 });
}
