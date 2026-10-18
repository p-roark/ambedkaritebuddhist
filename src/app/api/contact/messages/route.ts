import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      phone?: string;
      subject?: string;
      message?: string;
    };

    // Messages from signed-in users are linked to their account and always use
    // their sign-in email, so they can't be sent in someone else's name.
    const { auth } = await import('@/lib/auth');
    const sessionEmail = String((await auth())?.user?.email ?? '').trim().toLowerCase();

    const name = String(body.name ?? '').trim();
    const email = sessionEmail || String(body.email ?? '').trim().toLowerCase();
    const phone = String(body.phone ?? '').trim();
    const subject = String(body.subject ?? '').trim();
    const message = String(body.message ?? '').trim();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Name, email, subject, and message are required.' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const [{ eq }, { getDb }, { contactMessages, users }] = await Promise.all([
      import('drizzle-orm'),
      import('@/db'),
      import('@/db/schema'),
    ]);
    const db = getDb();
    const userId = sessionEmail
      ? await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, sessionEmail))
          .limit(1)
          .then((rows) => rows[0]?.id ?? null)
      : null;
    await db.insert(contactMessages).values({
      id: crypto.randomUUID(),
      name,
      email,
      phone: phone || null,
      subject,
      message,
      status: 'PENDING',
      userId,
      adminNote: null,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('no such table: ContactMessage')) {
      return NextResponse.json(
        { error: 'Contact messages table is missing. Run D1 migrations and redeploy.' },
        { status: 500 },
      );
    }
    console.error('Contact message create error:', error);
    return NextResponse.json({ error: 'Failed to submit message' }, { status: 500 });
  }
}
