import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { requireFeature } from '@/lib/feature-flags-server';
import { sameAddress } from '@/lib/address-search';
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
      ageConfirmedAt: users.ageConfirmedAt,
      addressVerifiedAt: users.addressVerifiedAt,
      boardInterest: users.boardInterest,
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
      // An address typed by an admin isn't confirmed by the address search
      addressVerifiedAt:
        existing.addressLine1 && existing.city && existing.province &&
        parsed.value.addressLine1 && parsed.value.city && parsed.value.province &&
        sameAddress(
          { addressLine1: parsed.value.addressLine1, city: parsed.value.city, province: parsed.value.province },
          { addressLine1: existing.addressLine1, city: existing.city, province: existing.province },
        )
          ? existing.addressVerifiedAt
          : null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, id));

  console.log(`Admin ${admin.email} updated member ${id}`);
  return NextResponse.json({ member: await loadMember(id) }, { status: 200 });
}

// DELETE /api/admin/members/:id — permanently deletes a deactivated member.
// Behind the "Delete deactivated members" switch. Their sign-in sessions,
// family members, event registrations and coordinator assignments are deleted
// with them; invite codes they created move to the deleting admin so shared
// links keep working; their messages stay, unlinked from the account.
export async function DELETE(request: NextRequest, { params }: Params) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const disabled = await requireFeature('memberDeletion');
  if (disabled) return disabled;

  const { id } = await params;
  const member = await loadMember(id);
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  if (member.email.toLowerCase() === admin.email.toLowerCase()) {
    return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 });
  }
  if (member.role === 'ADMIN') {
    return NextResponse.json({ error: 'Admins cannot be deleted. Change their role to Member first.' }, { status: 400 });
  }
  if (member.status === 'active') {
    return NextResponse.json({ error: 'Deactivate this member before deleting them.' }, { status: 400 });
  }

  const [{ eq }, { getDb }, { contactMessages, referralCodes, users }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();
  const adminRow = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, admin.email))
    .limit(1)
    .then((rows) => rows[0]);
  if (!adminRow) return NextResponse.json({ error: 'Your admin account was not found.' }, { status: 400 });

  await db.update(referralCodes).set({ ownerId: adminRow.id }).where(eq(referralCodes.ownerId, id));
  await db.update(contactMessages).set({ userId: null }).where(eq(contactMessages.userId, id));
  await db.delete(users).where(eq(users.id, id));

  console.log(`Admin ${admin.email} deleted member ${id} (${member.email})`);
  return NextResponse.json({ ok: true }, { status: 200 });
}
