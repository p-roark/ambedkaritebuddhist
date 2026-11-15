import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { checkMemberEmail } from '@/lib/member-email';

export const dynamic = 'force-dynamic';

// GET /api/admin/member-emails — recent emails to members with delivery counts
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { listMemberEmails } = await import('@/lib/member-emails-server');
  return NextResponse.json({ emails: await listMemberEmails() }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}

// POST /api/admin/member-emails { subject, body, templateId?, userIds } — create
// the email and its recipient list; sending then happens in batches via
// POST /api/admin/member-emails/:id/send
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const text = typeof body.body === 'string' ? body.body.replace(/\r\n/g, '\n').trim() : '';
  const check = checkMemberEmail(subject, text);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

  const { MAX_RECIPIENTS, createMemberEmail } = await import('@/lib/member-emails-server');
  const userIds = Array.isArray(body.userIds)
    ? [...new Set(body.userIds.filter((id): id is string => typeof id === 'string' && id.length > 0 && id.length <= 64))]
    : [];
  if (userIds.length === 0) return NextResponse.json({ error: 'Please choose at least one member.' }, { status: 400 });
  if (userIds.length > MAX_RECIPIENTS) {
    return NextResponse.json({ error: `Please choose at most ${MAX_RECIPIENTS} members per email.` }, { status: 400 });
  }

  const created = await createMemberEmail({
    subject,
    body: text,
    templateId: typeof body.templateId === 'string' ? body.templateId : null,
    userIds,
    sentBy: admin.email,
  });
  if (!created) {
    return NextResponse.json({ error: 'None of the chosen members can receive email (inactive or no address).' }, { status: 400 });
  }
  console.log(`Admin ${admin.email} created member email ${created.id} to ${created.recipientCount} members`);
  return NextResponse.json(created, { status: 201 });
}
