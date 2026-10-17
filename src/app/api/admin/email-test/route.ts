import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { sendTestEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// POST /api/admin/email-test — sends a test email to the signed-in admin only
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const result = await sendTestEmail(admin.email, admin.email);
  console.log(`Admin ${admin.email} sent a test email: ${result.ok ? 'delivered to Gmail' : `failed at ${result.stage}`}`);
  return NextResponse.json(result, { status: 200 });
}
