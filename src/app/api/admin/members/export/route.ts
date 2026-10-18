import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { toCsv } from '@/lib/csv';
import { PROVINCE_OPTIONS, RESIDENCY_STATUS_OPTIONS } from '@/lib/registration-config';

export const dynamic = 'force-dynamic';

const RESIDENCY_LABELS = new Map<string, string>(RESIDENCY_STATUS_OPTIONS.map((o) => [o.value, o.label]));
const PROVINCE_LABELS = new Map<string, string>(PROVINCE_OPTIONS.map((o) => [o.value, o.label]));

// GET /api/admin/members/export — all members (active and inactive) as CSV
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [{ and, asc, eq, isNotNull, ne, or }, { getDb }, { users }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);

  // Same membership rule as the dashboard member list
  const members = await getDb()
    .select()
    .from(users)
    .where(and(ne(users.role, 'STUDENT'), or(isNotNull(users.referredBy), eq(users.role, 'ADMIN'), eq(users.role, 'LEADER'))))
    .orderBy(asc(users.name));

  const header = [
    'Name', 'Email', 'Phone', 'Alternate phone', 'Address line 1', 'Address line 2', 'City', 'Province',
    'Postal code', 'Residency status', 'Role', 'Account status', 'Registration completed', 'Consent given',
    'Consent version', '18+ confirmed', 'Board / committee interest', 'Invite code', 'Joined', 'Education', 'Interests', 'Notes',
  ];
  const rows = members.map((m) => [
    m.name, m.email, m.phone, m.altPhone, m.addressLine1, m.addressLine2, m.city,
    m.province ? (PROVINCE_LABELS.get(m.province) ?? m.province) : null,
    m.postalCode,
    m.residencyStatus ? (RESIDENCY_LABELS.get(m.residencyStatus) ?? m.residencyStatus) : null,
    m.role, m.status, m.registrationCompletedAt, m.disclaimerAcceptedAt, m.disclaimerVersion,
    m.ageConfirmedAt, m.boardInterest ? 'Yes' : 'No', m.referredBy, m.createdAt, m.education, m.interests, m.notes,
  ]);

  console.log(`Admin ${admin.email} exported ${members.length} members`);
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(toCsv(header, rows), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="abcc-members-${date}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
