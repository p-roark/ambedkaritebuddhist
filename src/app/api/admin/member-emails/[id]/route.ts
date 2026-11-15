import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

// GET /api/admin/member-emails/:id — delivery progress and failed recipients
export async function GET(request: NextRequest, { params }: Params) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const { getProgress, listFailedRecipients } = await import('@/lib/member-emails-server');
  const progress = await getProgress(id);
  if (progress.total === 0) return NextResponse.json({ error: 'Email not found' }, { status: 404 });
  return NextResponse.json({ progress, failed: await listFailedRecipients(id) }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}
