import { NextRequest, NextResponse } from 'next/server';
import { validateProfileFields } from '@/lib/registration';
import { requireRegisteredUser } from '@/lib/registration-server';

export const dynamic = 'force-dynamic';

async function getRegisteredUserId() {
  const result = await requireRegisteredUser();
  if (!result.ok) return result;

  // Keep Google profile picture in sync
  const { current } = result;
  const freshImage = current.sessionImage;
  if (freshImage && current.user && freshImage !== current.user.image) {
    const [{ eq }, { getDb }, { users }] = await Promise.all([
      import('drizzle-orm'),
      import('@/db'),
      import('@/db/schema'),
    ]);
    await getDb().update(users).set({ image: freshImage, updatedAt: new Date().toISOString() }).where(eq(users.id, result.userId));
  }
  return result;
}

export async function GET(_request: NextRequest) {
  const registered = await getRegisteredUserId();
  if (!registered.ok) return registered.response;
  const { userId } = registered;

  const [{ eq }, { getDb }, { users }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();
  const profile = await db
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
      image: users.image,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((rows) => rows[0]);

  return NextResponse.json({ profile }, { status: 200 });
}

export async function PATCH(request: NextRequest) {
  const registered = await getRegisteredUserId();
  if (!registered.ok) return registered.response;
  const { userId } = registered;

  const body = (await request.json()) as {
    name?: string;
    phone?: string;
    altPhone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    residencyStatus?: string;
    education?: string;
    interests?: string;
    notes?: string;
  };

  // Registration fields stay mandatory after sign-up
  const parsed = validateProfileFields(body);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: 'Please correct the highlighted fields.', fieldErrors: parsed.errors },
      { status: 400 },
    );
  }

  const [{ eq }, { getDb }, { users }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();

  // A changed street address must come from the address search
  const previousAddress = await db
    .select({ addressLine1: users.addressLine1, city: users.city, province: users.province, addressVerifiedAt: users.addressVerifiedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((rows) => rows[0] ?? null);
  const { checkMemberAddress } = await import('@/lib/address-verification-server');
  const addressCheck = await checkMemberAddress(parsed.value, previousAddress, { allowUnverifiedUnchanged: true });
  if (!addressCheck.ok) {
    return NextResponse.json(
      { error: addressCheck.error, fieldErrors: { addressLine1: addressCheck.error } },
      { status: 400 },
    );
  }

  await db
    .update(users)
    .set({
      ...parsed.value,
      addressVerifiedAt: addressCheck.addressVerifiedAt,
      altPhone: String(body.altPhone ?? '').trim() || null,
      education: String(body.education ?? '').trim() || null,
      interests: String(body.interests ?? '').trim() || null,
      notes: String(body.notes ?? '').trim() || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, userId));

  return NextResponse.json({ ok: true }, { status: 200 });
}
