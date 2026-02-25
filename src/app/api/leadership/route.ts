import { NextResponse } from 'next/server';
import { asc, eq, isNotNull } from 'drizzle-orm';
import { getDb } from '@/db';
import { leadershipRoles, users } from '@/db/schema';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET() {
  const db = getDb();

  const rows = await db
    .select({
      id: leadershipRoles.id,
      roleName: leadershipRoles.roleName,
      displayOrder: leadershipRoles.displayOrder,
      userId: leadershipRoles.userId,
      userName: users.name,
      userEmail: users.email,
      userPhone: users.phone,
      userJoinedAt: users.createdAt,
    })
    .from(leadershipRoles)
    .leftJoin(users, eq(leadershipRoles.userId, users.id))
    .where(isNotNull(leadershipRoles.userId))
    .orderBy(asc(leadershipRoles.displayOrder));

  return NextResponse.json({ roles: rows }, { status: 200 });
}
