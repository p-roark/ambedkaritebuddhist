import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

// POST /api/admin/member-emails/:id/retry — queue failed recipients again
export async function POST(request: NextRequest, { params }: Params) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const { retryFailed } = await import('@/lib/member-emails-server');
  return NextResponse.json({ requeued: await retryFailed(id) }, { status: 200 });
}
