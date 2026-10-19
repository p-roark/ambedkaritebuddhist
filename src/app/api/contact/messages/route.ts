import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MAX_LENGTH = { name: 200, subject: 200, message: 5000, phone: 40 };
// Limits so the form can't be used to flood the inbox
const HOUR_MS = 60 * 60_000;
const MAX_MESSAGES_PER_EMAIL_PER_HOUR = 5;
/** Above this many messages in an hour, they're still saved but not emailed. */
const MAX_NOTICE_EMAILS_PER_HOUR = 30;

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

    if (name.length > MAX_LENGTH.name || subject.length > MAX_LENGTH.subject || message.length > MAX_LENGTH.message || phone.length > MAX_LENGTH.phone) {
      return NextResponse.json(
        { error: `Please keep the subject under ${MAX_LENGTH.subject} characters and the message under ${MAX_LENGTH.message}.` },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const hourAgo = new Date(Date.now() - HOUR_MS).toISOString();
    const [{ and, count, eq, gt }, { getDb }, { contactMessages, users }] = await Promise.all([
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

    const [recentFromEmail] = await db
      .select({ n: count() })
      .from(contactMessages)
      .where(and(eq(contactMessages.email, email), gt(contactMessages.createdAt, hourAgo)));
    if (recentFromEmail.n >= MAX_MESSAGES_PER_EMAIL_PER_HOUR) {
      return NextResponse.json(
        { error: 'You have sent several messages recently. Please wait a while before sending another.' },
        { status: 429 },
      );
    }

    const id = crypto.randomUUID();
    await db.insert(contactMessages).values({
      id,
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

    // Email the Contact messages address (after the response is sent)
    const [recentAll] = await db
      .select({ n: count() })
      .from(contactMessages)
      .where(and(eq(contactMessages.type, 'CONTACT'), gt(contactMessages.createdAt, hourAgo)));
    if (recentAll.n <= MAX_NOTICE_EMAILS_PER_HOUR) {
      const [{ runInBackground }, { sendContactMessageNotice }] = await Promise.all([
        import('@/lib/background'),
        import('@/lib/emails/contact'),
      ]);
      runInBackground(
        'contact message email',
        sendContactMessageNotice({
          message: { id, name, email, phone: phone || null, subject, message, isMember: Boolean(userId) },
          origin: request.nextUrl.origin,
        }),
      );
    } else {
      console.warn(`[contact] ${recentAll.n} messages in the last hour; saved without emailing`);
    }

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
