import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/profile/family/accept-invite?code=XXX
// Returns invite details so the landing page can show context before confirming.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });

  const [{ eq }, { getDb }, { familyMembers, users }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();

  const invite = await db
    .select({
      id: familyMembers.id,
      name: familyMembers.name,
      relationship: familyMembers.relationship,
      inviteStatus: familyMembers.inviteStatus,
      inviteExpiresAt: familyMembers.inviteExpiresAt,
      ownerName: users.name,
    })
    .from(familyMembers)
    .innerJoin(users, eq(users.id, familyMembers.userId))
    .where(eq(familyMembers.inviteCode, code))
    .limit(1)
    .then(r => r[0]);

  if (!invite) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });

  if (invite.inviteStatus === 'accepted') {
    return NextResponse.json({ error: 'This invite has already been accepted' }, { status: 409 });
  }

  if (invite.inviteExpiresAt && new Date(invite.inviteExpiresAt) < new Date()) {
    return NextResponse.json({ error: 'This invite has expired' }, { status: 410 });
  }

  return NextResponse.json({
    memberName: invite.name,
    relationship: invite.relationship,
    ownerName: invite.ownerName,
  });
}

// POST /api/profile/family/accept-invite
// Body: { code: string }
// Links the authenticated user's account to the family member record.
export async function POST(request: NextRequest) {
  const { auth } = await import('@/lib/auth');
  const session = await auth();
  const sessionEmail = String(session?.user?.email ?? '').trim().toLowerCase();
  if (!sessionEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [{ eq }, { getDb }, { familyMembers, users }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();

  // Resolve current user ID
  const currentUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, sessionEmail))
    .limit(1)
    .then(r => r[0]);
  if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = (await request.json()) as { code?: string };
  const code = String(body.code ?? '').trim();
  if (!code) return NextResponse.json({ error: 'Missing invite code' }, { status: 400 });

  const invite = await db
    .select({
      id: familyMembers.id,
      userId: familyMembers.userId,
      inviteStatus: familyMembers.inviteStatus,
      inviteExpiresAt: familyMembers.inviteExpiresAt,
    })
    .from(familyMembers)
    .where(eq(familyMembers.inviteCode, code))
    .limit(1)
    .then(r => r[0]);

  if (!invite) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });

  if (invite.inviteStatus === 'accepted') {
    return NextResponse.json({ error: 'This invite has already been accepted' }, { status: 409 });
  }

  if (invite.inviteExpiresAt && new Date(invite.inviteExpiresAt) < new Date()) {
    return NextResponse.json({ error: 'This invite has expired' }, { status: 410 });
  }

  // Prevent linking to your own family record
  if (invite.userId === currentUser.id) {
    return NextResponse.json({ error: 'You cannot link to your own family record' }, { status: 400 });
  }

  await db
    .update(familyMembers)
    .set({
      linkedUserId: currentUser.id,
      inviteStatus: 'accepted',
      updatedAt: new Date().toISOString(),
    })
    .where(eq(familyMembers.id, invite.id));

  return NextResponse.json({ ok: true });
}
