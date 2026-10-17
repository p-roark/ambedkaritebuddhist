import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { validateProfileUpdate } from '@/lib/registration';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

async function loadMember(id: string) {
  const [{ eq }, { getDb }, { users }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  return getDb()
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      altPhone: users.altPhone,
      addressLine1: users.addressLine1,
      addressLine2: users.addressLine2,
      city: users.city,
      province: users.province,
      postalCode: users.postalCode,
      residencyStatus: users.residencyStatus,
      education: users.education,
      interests: users.interests,
      notes: users.notes,
      role: users.role,
      status: users.status,
      referredBy: users.referredBy,
      registrationCompletedAt: users.registrationCompletedAt,
      disclaimerAcceptedAt: users.disclaimerAcceptedAt,
      disclaimerVersion: users.disclaimerVersion,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1)
    .then((rows) => rows[0] ?? null);
}

// GET /api/admin/members/:id — every stored detail of one member
export async function GET(request: NextRequest, { params }: Params) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const member = await loadMember(id);
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  return NextResponse.json({ member }, { status: 200 });
}

// PATCH /api/admin/members/:id — admin edit of a member's profile details.
// Email (the Google sign-in identity), role and status are not editable here.
export async function PATCH(request: NextRequest, { params }: Params) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const existing = await loadMember(id);
  if (!existing) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = validateProfileUpdate(body, { requireComplete: Boolean(existing.registrationCompletedAt) });
  if (!parsed.ok) {
    return NextResponse.json(
      { error: 'Please correct the highlighted fields.', fieldErrors: parsed.errors },
      { status: 400 },
    );
  }

  const optionalText = (key: string) => (typeof body[key] === 'string' ? body[key].trim() || null : null);

  const [{ eq }, { getDb }, { users }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  await getDb()
    .update(users)
    .set({
      ...parsed.value,
      altPhone: optionalText('altPhone'),
      education: optionalText('education'),
      interests: optionalText('interests'),
      notes: optionalText('notes'),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, id));

  console.log(`Admin ${admin.email} updated member ${id}`);
  return NextResponse.json({ member: await loadMember(id) }, { status: 200 });
}
