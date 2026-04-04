# Maintenance Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a maintenance mode toggle to the admin settings panel that redirects all non-admin users to a branded "under construction" page.

**Architecture:** New fields on the existing `OrganizationSettings` D1 singleton row hold the toggle and custom message. A new `src/middleware.ts` reads the JWT for admin status (no DB hit for admins) and queries D1 for non-admins to enforce the redirect. A standalone maintenance page renders the org name, logo, and custom message.

**Tech Stack:** Next.js App Router, NextAuth v5 (JWT), Drizzle ORM, Cloudflare D1, Tailwind CSS, `@opennextjs/cloudflare`

---

## File Map

| Action | File | What changes |
|---|---|---|
| Create | `migrations/0024_maintenance_mode.sql` | ALTER TABLE to add two columns |
| Modify | `src/db/schema.ts` | Add `maintenanceMode` and `maintenanceMessage` fields |
| Create | `src/middleware.ts` | Edge middleware: JWT admin check + D1 maintenance check |
| Create | `src/app/maintenance/page.tsx` | Branded maintenance page (server component) |
| Modify | `src/app/dashboard/page.tsx` | `OrgSettings` type, state, load, save, new UI card |
| Modify | `src/app/api/admin/members/route.ts` | New `updateMaintenanceMode` action in PATCH handler |

---

## Task 1: DB Migration

**Files:**
- Create: `migrations/0024_maintenance_mode.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- migrations/0024_maintenance_mode.sql
ALTER TABLE "OrganizationSettings" ADD COLUMN "maintenanceMode" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "OrganizationSettings" ADD COLUMN "maintenanceMessage" TEXT;
```

- [ ] **Step 2: Apply to local dev DB**

```bash
cd /workspace/ambedkaritebuddhist-auth
npx wrangler d1 execute ambedkaritebuddhist --local --file=migrations/0024_maintenance_mode.sql
```

Expected output: `🌀 Executing on local database ambedkaritebuddhist` with no errors.

- [ ] **Step 3: Commit**

```bash
git add migrations/0024_maintenance_mode.sql
git commit -m "feat: add maintenance mode columns to OrganizationSettings"
```

---

## Task 2: Schema Update

**Files:**
- Modify: `src/db/schema.ts` (around line 228 — after `description` field, before `updatedAt`)

- [ ] **Step 1: Add the two new fields to the schema**

In `src/db/schema.ts`, find the `organizationSettings` table definition. Replace the closing section so the table reads:

```ts
export const organizationSettings = sqliteTable('OrganizationSettings', {
  id:              text('id').primaryKey(),
  orgName:         text('orgName').notNull().default('Ambedkarite Buddhist Community of Canada'),
  shortName:       text('shortName').notNull().default('ABC Canada'),
  email:           text('email').notNull().default('info@ambedkaritebuddhist.ca'),
  phone:           text('phone'),
  altPhone:        text('altPhone'),
  addressLine1:    text('addressLine1'),
  addressLine2:    text('addressLine2'),
  city:            text('city'),
  province:        text('province'),
  postalCode:      text('postalCode'),
  country:         text('country').notNull().default('Canada'),
  website:         text('website'),
  description:     text('description'),
  maintenanceMode: integer('maintenanceMode').notNull().default(0),
  maintenanceMessage: text('maintenanceMessage'),
  updatedAt:       text('updatedAt').notNull().default(sql`(datetime('now'))`),
});
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /workspace/ambedkaritebuddhist-auth
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors related to `schema.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/db/schema.ts
git commit -m "feat: add maintenanceMode and maintenanceMessage to schema"
```

---

## Task 3: Middleware

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Create the middleware file**

```ts
// src/middleware.ts
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALWAYS_ALLOW = ['/auth/login', '/api/auth', '/maintenance', '/_next', '/favicon'];

export default auth(async (req) => {
  const { pathname } = req.nextUrl;

  // Always allow auth, maintenance, and Next.js internals
  if (ALWAYS_ALLOW.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Admins pass through — role is in the JWT, no DB hit
  const role = (req.auth as { user?: { role?: string } } | null)?.user?.role;
  if (role === 'ADMIN') return NextResponse.next();

  // Check maintenance mode from D1 for all other users
  try {
    const [{ eq }, { getDb }, { organizationSettings }] = await Promise.all([
      import('drizzle-orm'),
      import('@/db'),
      import('@/db/schema'),
    ]);

    const db = getDb();
    const rows = await db
      .select({ maintenanceMode: organizationSettings.maintenanceMode })
      .from(organizationSettings)
      .where(eq(organizationSettings.id, 'main'))
      .limit(1);

    if (rows[0]?.maintenanceMode === 1) {
      return NextResponse.redirect(new URL('/maintenance', req.url));
    }
  } catch {
    // D1 unavailable — fail open (don't block the site)
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.ico$).*)'],
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /workspace/ambedkaritebuddhist-auth
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add maintenance mode middleware"
```

---

## Task 4: Maintenance Page

**Files:**
- Create: `src/app/maintenance/page.tsx`

The page is a server component. It fetches `orgName` and `maintenanceMessage` directly from D1. The logo is the static asset at `/images/logo.png`.

- [ ] **Step 1: Create the maintenance page**

```tsx
// src/app/maintenance/page.tsx
import Image from 'next/image';

export const runtime = 'edge';

const DEFAULT_MESSAGE = "We're currently performing scheduled maintenance. We'll be back shortly — thank you for your patience.";

async function getMaintenanceInfo(): Promise<{ orgName: string; message: string }> {
  try {
    const [{ eq }, { getDb }, { organizationSettings }] = await Promise.all([
      import('drizzle-orm'),
      import('@/db'),
      import('@/db/schema'),
    ]);
    const db = getDb();
    const rows = await db
      .select({ orgName: organizationSettings.orgName, maintenanceMessage: organizationSettings.maintenanceMessage })
      .from(organizationSettings)
      .where(eq(organizationSettings.id, 'main'))
      .limit(1);

    const row = rows[0];
    return {
      orgName: row?.orgName ?? 'Ambedkarite Buddhist Community of Canada',
      message: row?.maintenanceMessage ?? DEFAULT_MESSAGE,
    };
  } catch {
    return { orgName: 'Ambedkarite Buddhist Community of Canada', message: DEFAULT_MESSAGE };
  }
}

export default async function MaintenancePage() {
  const { orgName, message } = await getMaintenanceInfo();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2D4D9B] to-[#7F56D9] p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full px-10 py-12 flex flex-col items-center text-center gap-6">
        <Image
          src="/images/logo.png"
          alt={`${orgName} logo`}
          width={80}
          height={80}
          className="rounded-xl"
          priority
        />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{orgName}</h1>
          <p className="text-sm font-semibold text-[#2D4D9B] uppercase tracking-widest">Under Maintenance</p>
        </div>
        <div className="w-12 h-px bg-gray-200" />
        <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
        <p className="text-xs text-gray-400 mt-2">☸ Please check back soon</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /workspace/ambedkaritebuddhist-auth
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/maintenance/page.tsx
git commit -m "feat: add maintenance page"
```

---

## Task 5: API Handler

**Files:**
- Modify: `src/app/api/admin/members/route.ts` (around line 122 — body type, and after line 211 — new action block)

- [ ] **Step 1: Add `updateMaintenanceMode` to the body type union**

Find the `body` type declaration in the `PATCH` handler (around line 122). It currently reads:

```ts
const body = (await request.json()) as {
  action?: 'setRole' | 'deactivateMember' | 'activateMember' | 'leadershipCreate' | 'leadershipUpdate' | 'leadershipDelete' | 'updateOrgSettings';
```

Change the `action` union to add `'updateMaintenanceMode'`:

```ts
const body = (await request.json()) as {
  action?: 'setRole' | 'deactivateMember' | 'activateMember' | 'leadershipCreate' | 'leadershipUpdate' | 'leadershipDelete' | 'updateOrgSettings' | 'updateMaintenanceMode';
```

- [ ] **Step 2: Add the handler block after the `updateOrgSettings` block**

Find the closing of the `updateOrgSettings` block (around line 211, ends with `return NextResponse.json({ ok: true }, { status: 200 });`). Add the new block immediately after:

```ts
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
```

Note: `body.maintenanceMode` and `body.maintenanceMessage` need to be in the body type. Extend it to include:

```ts
  maintenanceMode?: boolean;
  maintenanceMessage?: string | null;
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /workspace/ambedkaritebuddhist-auth
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/members/route.ts
git commit -m "feat: add updateMaintenanceMode API action"
```

---

## Task 6: Settings UI

**Files:**
- Modify: `src/app/dashboard/page.tsx`

This task has four sub-changes in the same file: (a) extend `OrgSettings` type, (b) extend `emptyOrgSettings` and state, (c) extend `loadOrgSettings`, (d) add save handler, (e) add UI card.

- [ ] **Step 1: Extend the `OrgSettings` type** (line 12)

Replace:

```ts
type OrgSettings = {
  orgName: string;
  shortName: string;
  email: string;
  phone: string;
  altPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  website: string;
  description: string;
};
```

With:

```ts
type OrgSettings = {
  orgName: string;
  shortName: string;
  email: string;
  phone: string;
  altPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  website: string;
  description: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
};
```

- [ ] **Step 2: Extend `emptyOrgSettings` and add maintenance state** (around line 163)

Replace:

```ts
  const emptyOrgSettings: OrgSettings = { orgName: '', shortName: '', email: '', phone: '', altPhone: '', addressLine1: '', addressLine2: '', city: '', province: '', postalCode: '', country: 'Canada', website: '', description: '' };
  const [orgSettingsForm, setOrgSettingsForm] = useState<OrgSettings>(emptyOrgSettings);
  const [orgSettingsSaving, setOrgSettingsSaving] = useState(false);
  const [orgSettingsMessage, setOrgSettingsMessage] = useState('');
```

With:

```ts
  const emptyOrgSettings: OrgSettings = { orgName: '', shortName: '', email: '', phone: '', altPhone: '', addressLine1: '', addressLine2: '', city: '', province: '', postalCode: '', country: 'Canada', website: '', description: '', maintenanceMode: false, maintenanceMessage: '' };
  const [orgSettingsForm, setOrgSettingsForm] = useState<OrgSettings>(emptyOrgSettings);
  const [orgSettingsSaving, setOrgSettingsSaving] = useState(false);
  const [orgSettingsMessage, setOrgSettingsMessage] = useState('');
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
```

- [ ] **Step 3: Extend `loadOrgSettings` to include new fields** (around line 177)

Replace the `setOrgSettingsForm({...})` call inside `loadOrgSettings`:

```ts
    setOrgSettingsForm({
      orgName: s.orgName ?? '',
      shortName: s.shortName ?? '',
      email: s.email ?? '',
      phone: s.phone ?? '',
      altPhone: s.altPhone ?? '',
      addressLine1: s.addressLine1 ?? '',
      addressLine2: s.addressLine2 ?? '',
      city: s.city ?? '',
      province: s.province ?? '',
      postalCode: s.postalCode ?? '',
      country: s.country ?? 'Canada',
      website: s.website ?? '',
      description: s.description ?? '',
      maintenanceMode: Number(s.maintenanceMode) === 1,
      maintenanceMessage: s.maintenanceMessage ?? '',
    });
```

- [ ] **Step 4: Add `handleSaveMaintenanceSettings` handler** (insert after `handleSaveOrgSettings`, around line 508)

```ts
  const handleSaveMaintenanceSettings = async () => {
    setMaintenanceSaving(true);
    setMaintenanceMessage('');
    const res = await fetch('/api/admin/members', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateMaintenanceMode',
        maintenanceMode: orgSettingsForm.maintenanceMode,
        maintenanceMessage: orgSettingsForm.maintenanceMessage,
      }),
    });
    setMaintenanceSaving(false);
    setMaintenanceMessage(res.ok ? 'Maintenance settings saved.' : 'Failed to save maintenance settings.');
    if (res.ok) await loadOrgSettings();
  };
```

- [ ] **Step 5: Add the Maintenance Mode card to the settings tab UI**

In the settings tab (`activeTab === 'settings'`), after the closing `</div>` of the org details card (line 1620), inside the `<div className="space-y-6">` wrapper, add:

```tsx
            {/* Maintenance Mode Card */}
            <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              {/* Card header */}
              <div className="px-8 py-6 bg-gradient-to-r from-orange-500 to-red-500 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-white font-bold text-xl leading-tight">Maintenance Mode</h2>
                  <p className="text-white/70 text-sm mt-0.5">Control site access during maintenance windows</p>
                </div>
              </div>

              <div className="bg-white px-8 py-8 space-y-6">
                {/* Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-800">Enable Maintenance Mode</p>
                    <p className="text-xs text-gray-500 mt-0.5">When enabled, only admins can access the site</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={orgSettingsForm.maintenanceMode}
                    onClick={() => setOrgSettingsForm((prev) => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${orgSettingsForm.maintenanceMode ? 'bg-orange-500' : 'bg-gray-200'}`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${orgSettingsForm.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>

                {/* Warning */}
                {orgSettingsForm.maintenanceMode && (
                  <div className="flex items-start gap-3 rounded-xl bg-orange-50 border border-orange-200 px-4 py-3">
                    <svg className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-xs font-semibold text-orange-700">Site will be inaccessible to all non-admin users. Admins can still log in via /auth/login.</p>
                  </div>
                )}

                {/* Custom message */}
                {orgSettingsForm.maintenanceMode && (
                  <div>
                    <div className="border-t border-gray-100 mb-6" />
                    <label className="block">
                      <span className="block text-sm font-semibold text-gray-700 mb-1.5">Custom Message <span className="font-normal text-gray-400">(optional)</span></span>
                      <textarea
                        rows={3}
                        placeholder="We're currently performing scheduled maintenance. We'll be back shortly — thank you for your patience."
                        value={orgSettingsForm.maintenanceMessage}
                        onChange={(e) => setOrgSettingsForm((prev) => ({ ...prev, maintenanceMessage: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 bg-gray-50 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/25 focus:border-orange-400 transition resize-none"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Card footer */}
              <div className="bg-gray-50 border-t border-gray-100 px-8 py-5 flex items-center justify-between">
                <div>
                  {maintenanceMessage && (
                    <p className={`text-sm font-semibold ${maintenanceMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
                      {maintenanceMessage.includes('Failed') ? '✗ ' : '✓ '}{maintenanceMessage}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleSaveMaintenanceSettings}
                  disabled={maintenanceSaving}
                  className="px-7 py-2.5 text-sm font-bold text-white rounded-xl disabled:opacity-50 transition shadow-sm hover:shadow-md"
                  style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)' }}
                >
                  {maintenanceSaving ? 'Saving…' : 'Save Settings'}
                </button>
              </div>
            </div>
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd /workspace/ambedkaritebuddhist-auth
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: add maintenance mode UI card to settings tab"
```

---

## Task 7: Manual Verification

- [ ] **Step 1: Start local dev server**

```bash
cd /workspace/ambedkaritebuddhist-auth
npx wrangler pages dev --compatibility-date=2024-09-23 .open-next
```

Or if using Next.js dev mode:
```bash
pnpm dev
```

- [ ] **Step 2: Verify maintenance page renders**

Visit `http://localhost:3000/maintenance` (or the wrangler port). Should show:
- Logo at top
- Org name
- Default message (no custom message set yet)
- No header/nav/footer

- [ ] **Step 3: Log in as admin and verify settings card appears**

1. Go to `http://localhost:3000/auth/login`
2. Log in with admin Google account
3. Go to Dashboard → Settings tab
4. Scroll below org details card
5. Should see orange "Maintenance Mode" card with toggle OFF by default

- [ ] **Step 4: Enable maintenance mode and verify redirect**

1. Toggle ON in the settings card
2. Enter a custom message e.g. "Site is down for upgrades. Back at 3pm."
3. Click "Save Settings"
4. Open an incognito window, visit `http://localhost:3000`
5. Should redirect to `/maintenance` showing org name + custom message
6. Visit `http://localhost:3000/auth/login` in incognito — should NOT redirect (login page is always allowed)

- [ ] **Step 5: Verify admin stays through**

1. While maintenance is ON, visit any page as the logged-in admin
2. Should NOT be redirected to `/maintenance`

- [ ] **Step 6: Disable and confirm site is accessible again**

1. Toggle OFF, save
2. Reload incognito window
3. Homepage should load normally

- [ ] **Step 7: Final commit if any fixes were needed**

```bash
git add -p
git commit -m "fix: maintenance mode manual test fixes"
```

---

## Task 8: Push

- [ ] **Step 1: Push branch**

```bash
cd /workspace/ambedkaritebuddhist-auth
git push -u origin feat/auth-system
```

- [ ] **Step 2: Apply migration to production D1 (when ready to deploy)**

```bash
npx wrangler d1 execute ambedkaritebuddhist-prod --remote --file=migrations/0024_maintenance_mode.sql
```

Expected: `🌀 Executing on remote database ambedkaritebuddhist-prod` with no errors.
