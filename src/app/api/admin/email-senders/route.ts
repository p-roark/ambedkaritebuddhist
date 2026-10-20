import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { EMAIL_PURPOSE_KEYS, EMAIL_PURPOSES, isEmailPurpose, isValidEmailAddress } from '@/lib/email-senders';

export const dynamic = 'force-dynamic';

async function load() {
  const [{ eq }, { getDb }, { emailSenders, organizationSettings }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();
  const [rows, org] = await Promise.all([
    db.select().from(emailSenders),
    db.select({ email: organizationSettings.email }).from(organizationSettings).where(eq(organizationSettings.id, 'main')).limit(1).then((r) => r[0]),
  ]);
  const byPurpose = new Map(rows.map((row) => [row.purpose, row]));
  return {
    defaultAddress: org?.email ?? null,
    senders: EMAIL_PURPOSE_KEYS.map((purpose) => {
      const row = byPurpose.get(purpose);
      return {
        purpose,
        ...EMAIL_PURPOSES[purpose],
        address: row?.address ?? null,
        updatedBy: row?.updatedBy ?? null,
        updatedAt: row?.updatedAt ?? null,
      };
    }),
  };
}

// GET /api/admin/email-senders — default (organization) address + address per purpose
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json(await load(), { status: 200 });
}

// PUT /api/admin/email-senders — body: { purpose, address } (blank address = use the organization email)
export async function PUT(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as { purpose?: unknown; address?: unknown };
  if (!isEmailPurpose(body.purpose)) return NextResponse.json({ error: 'Unknown email purpose' }, { status: 400 });
  const address = typeof body.address === 'string' ? body.address.trim().toLowerCase() : '';
  if (address && !isValidEmailAddress(address)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  const [{ eq }, { getDb }, { emailSenders }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();
  if (!address) {
    await db.delete(emailSenders).where(eq(emailSenders.purpose, body.purpose));
  } else {
    const values = { address, updatedBy: admin.email, updatedAt: new Date().toISOString() };
    await db.insert(emailSenders).values({ purpose: body.purpose, ...values }).onConflictDoUpdate({ target: emailSenders.purpose, set: values });
  }

  console.log(`Admin ${admin.email} set the ${body.purpose} sender to ${address || 'the organization email'}`);
  return NextResponse.json(await load(), { status: 200 });
}
