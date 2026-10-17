import { NextRequest, NextResponse } from 'next/server';
import { runInBackground } from '@/lib/background';
import { requireFeature } from '@/lib/feature-flags-server';
import { DISCLAIMER_VERSION } from '@/lib/registration-config';
import { normalizeInviteCode, normalizePostalCode, normalizeProvince, validateRegistration } from '@/lib/registration';
import { getCurrentUser } from '@/lib/registration-server';
import { pickDisplayName } from '@/lib/user-name';

export const dynamic = 'force-dynamic';

// GET /api/registration
// Returns the signed-in user's registration status and values to pre-fill the form.
export async function GET() {
  try {
    const current = await getCurrentUser();
    if (!current) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [{ eq }, { getDb }, { users }] = await Promise.all([
      import('drizzle-orm'),
      import('@/db'),
      import('@/db/schema'),
    ]);
    const db = getDb();
    const row = current.user
      ? await db
          .select({
            name: users.name,
            phone: users.phone,
            addressLine1: users.addressLine1,
            addressLine2: users.addressLine2,
            city: users.city,
            province: users.province,
            postalCode: users.postalCode,
            residencyStatus: users.residencyStatus,
          })
          .from(users)
          .where(eq(users.id, current.user.id))
          .limit(1)
          .then((rows) => rows[0] ?? null)
      : null;

    return NextResponse.json(
      {
        registrationStatus: current.registrationStatus,
        prefill: {
          name: pickDisplayName({ dbName: row?.name, sessionName: current.sessionName, email: current.email }),
          email: current.email,
          phone: row?.phone ?? '',
          addressLine1: row?.addressLine1 ?? '',
          addressLine2: row?.addressLine2 ?? '',
          city: row?.city ?? '',
          province: normalizeProvince(row?.province) ?? '',
          postalCode: normalizePostalCode(row?.postalCode) ?? row?.postalCode ?? '',
          residencyStatus: row?.residencyStatus ?? '',
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Get registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/registration
// Body: registration form fields + disclaimerAccepted + code (required for new members).
// Completes registration: consumes the invite code (if needed) and saves the profile.
export async function POST(request: NextRequest) {
  try {
    const current = await getCurrentUser();
    if (!current) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (current.registrationStatus === 'complete' && current.user) {
      return NextResponse.json({ ok: true, alreadyComplete: true }, { status: 200 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const parsed = validateRegistration(body);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: 'Please correct the highlighted fields.', fieldErrors: parsed.errors },
        { status: 400 },
      );
    }

    const [{ and, eq, sql }, { getDb }, { referralCodes, users }] = await Promise.all([
      import('drizzle-orm'),
      import('@/db'),
      import('@/db/schema'),
    ]);
    const db = getDb();

    // New members must present a valid invite code. The use is counted with a
    // single conditional UPDATE so concurrent sign-ups cannot exceed maxUses.
    let consumedCodeId: string | null = null;
    let referredBy = current.user?.referredBy ?? null;

    if (current.registrationStatus === 'invite_required') {
      const disabled = await requireFeature('memberRegistration');
      if (disabled) return disabled;
      const code = normalizeInviteCode(body.code);
      if (!code) {
        return NextResponse.json(
          { error: 'A valid invite link is required to register. Please use the link you received.' },
          { status: 400 },
        );
      }

      const consumed = await db
        .update(referralCodes)
        .set({ currentUses: sql`${referralCodes.currentUses} + 1` })
        .where(and(
          eq(referralCodes.code, code),
          eq(referralCodes.active, true),
          sql`${referralCodes.currentUses} < ${referralCodes.maxUses}`,
        ))
        .returning({ id: referralCodes.id });

      if (consumed.length === 0) {
        return NextResponse.json(
          { error: 'This invite link is no longer valid. Please contact us for a new one.' },
          { status: 400 },
        );
      }
      consumedCodeId = consumed[0].id;
      referredBy = code;
    }

    const now = new Date().toISOString();
    const fields = {
      ...parsed.value,
      referredBy,
      registrationCompletedAt: now,
      disclaimerAcceptedAt: now,
      disclaimerVersion: DISCLAIMER_VERSION,
      updatedAt: now,
    };

    try {
      if (current.user) {
        await db.update(users).set(fields).where(eq(users.id, current.user.id));
      } else {
        await db.insert(users).values({
          id: crypto.randomUUID(),
          email: current.email,
          passwordHash: '',
          role: 'MEMBER',
          image: current.sessionImage || null,
          emailVerified: now,
          createdAt: now,
          ...fields,
        });
      }
    } catch (error) {
      // Give the invite use back if the profile could not be saved
      if (consumedCodeId) {
        await db
          .update(referralCodes)
          .set({ currentUses: sql`MAX(${referralCodes.currentUses} - 1, 0)` })
          .where(eq(referralCodes.id, consumedCodeId))
          .catch(() => {});
      }
      throw error;
    }

    // Welcome email (new members only) and admin notice, sent after the response
    const isNewMember = current.registrationStatus === 'invite_required';
    const member = {
      name: parsed.value.name,
      email: current.email,
      city: parsed.value.city,
      province: parsed.value.province,
      residencyStatus: parsed.value.residencyStatus,
      inviteCode: referredBy,
    };
    const origin = request.nextUrl.origin;
    const { sendNewRegistrationAdminEmail, sendWelcomeEmail } = await import('@/lib/emails/registration');
    if (isNewMember) runInBackground('welcome email', sendWelcomeEmail({ member, origin }));
    runInBackground('new registration admin email', sendNewRegistrationAdminEmail({ member, isNewMember, origin }));

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('Complete registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
