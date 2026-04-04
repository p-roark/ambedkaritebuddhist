import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId, requireAdmin } from '@/lib/admin-auth';
import { pickDisplayName } from '@/lib/user-name';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const isAdmin = await requireAdmin(request);

  const { searchParams } = new URL(request.url);

  // Leadership resource: admin-only
  if (searchParams.get('resource') === 'leadership') {
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const [{ asc, eq }, { getDb }, { leadershipRoles, users }] = await Promise.all([
      import('drizzle-orm'),
      import('@/db'),
      import('@/db/schema'),
    ]);
    const db = getDb();
    const rows = await db
      .select({
        id: leadershipRoles.id,
        roleName: leadershipRoles.roleName,
        displayOrder: leadershipRoles.displayOrder,
        userId: leadershipRoles.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(leadershipRoles)
      .leftJoin(users, eq(leadershipRoles.userId, users.id))
      .orderBy(asc(leadershipRoles.displayOrder));
    return NextResponse.json({ roles: rows }, { status: 200 });
  }

  // Family members for a specific user: admin or coordinator
  if (searchParams.get('resource') === 'family-members') {
    const targetUserId = searchParams.get('userId');
    if (!targetUserId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
    const [{ asc, eq }, { getDb }, { eventCoordinators, familyMembers }] = await Promise.all([
      import('drizzle-orm'),
      import('@/db'),
      import('@/db/schema'),
    ]);
    if (!isAdmin) {
      const userId = await getAuthenticatedUserId(request);
      if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      const db = getDb();
      const coord = await db
        .select({ eventId: eventCoordinators.eventId })
        .from(eventCoordinators)
        .where(eq(eventCoordinators.userId, userId))
        .limit(1)
        .then((rows) => rows[0]);
      if (!coord) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const db = getDb();
    const members = await db
      .select()
      .from(familyMembers)
      .where(eq(familyMembers.userId, targetUserId))
      .orderBy(asc(familyMembers.name));
    return NextResponse.json({ familyMembers: members }, { status: 200 });
  }

  // Also allow coordinators (any user who coordinates at least one event)
  const [{ and, eq, isNotNull, ne, or }, { getDb }, { eventCoordinators, users }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  if (!isAdmin) {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const db = getDb();
    const coord = await db
      .select({ eventId: eventCoordinators.eventId })
      .from(eventCoordinators)
      .where(eq(eventCoordinators.userId, userId))
      .limit(1)
      .then((rows) => rows[0]);
    if (!coord) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getDb();
  const members = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      joinedAt: users.createdAt,
    })
    .from(users)
    .where(
      and(
        ne(users.role, 'STUDENT'),
        or(
          isNotNull(users.referredBy),
          eq(users.role, 'ADMIN'),
          eq(users.role, 'LEADER'),
        ),
      ),
    );

  const normalizedMembers = members.map((member) => ({
    ...member,
    name: pickDisplayName({
      dbName: member.name,
      email: member.email,
    }),
  }));

  return NextResponse.json({ members: normalizedMembers }, { status: 200 });
}

export async function PATCH(request: NextRequest) {
  const token = await requireAdmin(request);
  if (!token) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = (await request.json()) as {
    action?: 'setRole' | 'deactivateMember' | 'activateMember' | 'leadershipCreate' | 'leadershipUpdate' | 'leadershipDelete' | 'updateOrgSettings' | 'updateMaintenanceMode';
    userId?: string;
    role?: 'ADMIN' | 'MEMBER';
    // leadership fields
    id?: string;
    roleName?: string;
    displayOrder?: number;
    // org settings fields
    orgName?: string;
    shortName?: string;
    email?: string;
    phone?: string;
    altPhone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
    website?: string;
    description?: string;
    // maintenance mode fields
    maintenanceMode?: boolean;
    maintenanceMessage?: string | null;
  };

  const { action } = body;
  if (!action) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const [{ asc, eq }, { getDb }, { leadershipRoles, organizationSettings, users }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();
  const now = new Date().toISOString();

  // ---- Leadership actions ----
  if (action === 'leadershipCreate') {
    if (!body.roleName?.trim()) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }
    const existing = await db
      .select({ displayOrder: leadershipRoles.displayOrder })
      .from(leadershipRoles)
      .orderBy(asc(leadershipRoles.displayOrder));
    const nextOrder = existing.length > 0 ? (existing[existing.length - 1].displayOrder + 1) : 0;
    const id = crypto.randomUUID();
    await db.insert(leadershipRoles).values({
      id,
      roleName: body.roleName.trim(),
      displayOrder: nextOrder,
      createdAt: now,
      updatedAt: now,
    });
    return NextResponse.json({ id }, { status: 201 });
  }

  if (action === 'leadershipUpdate') {
    if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const patch: Record<string, unknown> = { updatedAt: now };
    if (body.roleName !== undefined) patch.roleName = body.roleName.trim();
    if ('userId' in body) patch.userId = (body as { userId?: string | null }).userId ?? null;
    if (body.displayOrder !== undefined) patch.displayOrder = body.displayOrder;
    await db.update(leadershipRoles).set(patch).where(eq(leadershipRoles.id, body.id));
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (action === 'updateOrgSettings') {
    await db
      .update(organizationSettings)
      .set({
        orgName: String(body.orgName ?? '').trim() || 'Ambedkarite Buddhist Community of Canada',
        shortName: String(body.shortName ?? '').trim() || 'ABC Canada',
        email: String(body.email ?? '').trim() || 'info@ambedkaritebuddhist.ca',
        phone: String(body.phone ?? '').trim() || null,
        altPhone: String(body.altPhone ?? '').trim() || null,
        addressLine1: String(body.addressLine1 ?? '').trim() || null,
        addressLine2: String(body.addressLine2 ?? '').trim() || null,
        city: String(body.city ?? '').trim() || null,
        province: String(body.province ?? '').trim() || null,
        postalCode: String(body.postalCode ?? '').trim() || null,
        country: String(body.country ?? '').trim() || 'Canada',
        website: String(body.website ?? '').trim() || null,
        description: String(body.description ?? '').trim() || null,
        updatedAt: now,
      })
      .where(eq(organizationSettings.id, 'main'));
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (action === 'updateMaintenanceMode') {
    await db
      .update(organizationSettings)
      .set({
        maintenanceMode: body.maintenanceMode ? 1 : 0,
        maintenanceMessage: String(body.maintenanceMessage ?? '').trim() || null,
        updatedAt: now,
      })
      .where(eq(organizationSettings.id, 'main'));
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (action === 'leadershipDelete') {
    if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    await db.delete(leadershipRoles).where(eq(leadershipRoles.id, body.id));
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // ---- Member actions ----
  const { userId, role } = body;
  if (!userId) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const targetUser = await db
    .select({ email: users.email, role: users.role, status: users.status })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (targetUser.email.toLowerCase() === String(token.email).toLowerCase()) {
    return NextResponse.json({ error: 'Admin cannot modify their own account' }, { status: 400 });
  }

  if (action === 'setRole') {
    if (role !== 'ADMIN' && role !== 'MEMBER') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    await db
      .update(users)
      .set({ role, updatedAt: now })
      .where(eq(users.id, userId));

    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (action === 'deactivateMember') {
    if (targetUser.role === 'ADMIN') {
      return NextResponse.json({ error: 'Admins cannot deactivate other admins' }, { status: 400 });
    }
    await db
      .update(users)
      .set({
        status: 'inactive',
        activationRequestCount: 0,
        activationRequestStatus: 'none',
        updatedAt: now,
      })
      .where(eq(users.id, userId));
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (action === 'activateMember') {
    await db
      .update(users)
      .set({
        status: 'active',
        activationRequestCount: 0,
        activationRequestStatus: 'none',
        updatedAt: now,
      })
      .where(eq(users.id, userId));
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
