import { NextRequest, NextResponse } from 'next/server';
import { isValidEmailAddress } from '@/lib/email-senders';
import { isFeatureEnabled, requireFeature } from '@/lib/feature-flags-server';
import { normalizeInviteCode, safeCallbackUrl } from '@/lib/registration';

export const dynamic = 'force-dynamic';

// Same reply whether or not a link was sent, so this form can't be used to
// find out who is a member.
const SENT = { ok: true };

/** The invite code in a /join?code=… callback, if any. */
function inviteCodeFrom(callbackUrl: string): string | null {
  if (!callbackUrl.startsWith('/join')) return null;
  return normalizeInviteCode(new URL(callbackUrl, 'http://local').searchParams.get('code'));
}

// POST /api/sign-in-link  { email, callbackUrl }
// Emails a one-time sign-in link to an existing account, or to anyone signing
// in from a valid invite link (so they can register).
export async function POST(request: NextRequest) {
  const disabled = await requireFeature('emailSignIn');
  if (disabled) return disabled;

  const body = (await request.json().catch(() => ({}))) as { email?: unknown; callbackUrl?: unknown };
  const email = String(body.email ?? '').trim().toLowerCase();
  if (!isValidEmailAddress(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }
  const callbackUrl = safeCallbackUrl(typeof body.callbackUrl === 'string' ? body.callbackUrl : null);

  try {
    const [{ and, eq, sql }, { getDb }, { referralCodes, users }] = await Promise.all([
      import('drizzle-orm'),
      import('@/db'),
      import('@/db/schema'),
    ]);
    const db = getDb();

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then((rows) => rows[0]);

    let allowed = Boolean(existing);
    if (!allowed) {
      const code = inviteCodeFrom(callbackUrl);
      if (code && (await isFeatureEnabled('memberRegistration'))) {
        const invite = await db
          .select({ code: referralCodes.code })
          .from(referralCodes)
          .where(and(
            eq(referralCodes.code, code),
            eq(referralCodes.active, true),
            sql`${referralCodes.currentUses} < ${referralCodes.maxUses}`,
          ))
          .limit(1)
          .then((rows) => rows[0]);
        allowed = Boolean(invite);
      }
    }
    if (!allowed) return NextResponse.json(SENT, { status: 200 });

    const { buildSignInUrl, createSignInLink } = await import('@/lib/email-sign-in');
    const ip = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const link = await createSignInLink(email, ip);
    if (!link.ok) {
      return NextResponse.json(
        { error: 'Too many sign-in links were requested. Please check your inbox or try again in 15 minutes.' },
        { status: 429 },
      );
    }

    // Sent after the response, so replies take the same time whether or not
    // the email belongs to a member
    const [{ runInBackground }, { sendSignInLinkEmail }] = await Promise.all([
      import('@/lib/background'),
      import('@/lib/emails/sign-in'),
    ]);
    const url = buildSignInUrl(request.nextUrl.origin, email, link.token, callbackUrl);
    runInBackground(
      'sign-in link email',
      sendSignInLinkEmail({ to: email, url }).then((sent) => {
        if (!sent) console.error('[sign-in-link] Email is not configured; link not sent');
      }),
    );
    return NextResponse.json(SENT, { status: 200 });
  } catch (error) {
    console.error('Sign-in link error:', error);
    return NextResponse.json({ error: 'Could not send a sign-in link. Please try again.' }, { status: 500 });
  }
}
