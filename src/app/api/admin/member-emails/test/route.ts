import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { checkMemberEmail } from '@/lib/member-email';

export const dynamic = 'force-dynamic';

// POST /api/admin/member-emails/test { subject, body } — send it to yourself first
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const text = typeof body.body === 'string' ? body.body.replace(/\r\n/g, '\n').trim() : '';
  const check = checkMemberEmail(subject, text);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

  const { sendTestMemberEmail } = await import('@/lib/member-emails-server');
  const result = await sendTestMemberEmail({ subject, body: text }, admin.email);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ sentTo: admin.email }, { status: 200 });
}
