import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { parseTemplate } from '@/lib/member-email';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

// PUT /api/admin/email-templates/:id { name, subject, body } — edit a template
export async function PUT(request: NextRequest, { params }: Params) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = parseTemplate(await request.json().catch(() => ({})));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { id } = await params;
  const [{ eq }, { getDb }, { emailTemplates }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const updated = await getDb()
    .update(emailTemplates)
    .set({ ...parsed.value, updatedBy: admin.email, updatedAt: new Date().toISOString() })
    .where(eq(emailTemplates.id, id))
    .returning();
  if (updated.length === 0) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  return NextResponse.json({ template: updated[0] }, { status: 200 });
}

// DELETE /api/admin/email-templates/:id — emails already sent keep their own copy of the text
export async function DELETE(request: NextRequest, { params }: Params) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const [{ eq }, { getDb }, { emailTemplates }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const deleted = await getDb().delete(emailTemplates).where(eq(emailTemplates.id, id)).returning({ id: emailTemplates.id });
  if (deleted.length === 0) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  return NextResponse.json({ ok: true }, { status: 200 });
}
