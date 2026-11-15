import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { parseTemplate } from '@/lib/member-email';

export const dynamic = 'force-dynamic';

// GET /api/admin/email-templates — all templates, by name
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [{ asc }, { getDb }, { emailTemplates }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const templates = await getDb().select().from(emailTemplates).orderBy(asc(emailTemplates.name));
  return NextResponse.json({ templates }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}

// POST /api/admin/email-templates { name, subject, body } — add a template
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = parseTemplate(await request.json().catch(() => ({})));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const [{ getDb }, { emailTemplates }] = await Promise.all([import('@/db'), import('@/db/schema')]);
  const now = new Date().toISOString();
  const template = { id: crypto.randomUUID(), ...parsed.value, updatedBy: admin.email, createdAt: now, updatedAt: now };
  await getDb().insert(emailTemplates).values(template);
  return NextResponse.json({ template }, { status: 201 });
}
