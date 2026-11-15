import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

// POST /api/admin/member-emails/:id/send — send the next batch; the dashboard
// calls this repeatedly until nothing is pending
export async function POST(request: NextRequest, { params }: Params) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const { sendNextBatch } = await import('@/lib/member-emails-server');
  const result = await sendNextBatch(id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ progress: result.progress }, { status: 200 });
}
