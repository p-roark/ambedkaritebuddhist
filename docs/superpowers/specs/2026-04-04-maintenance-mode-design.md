# Maintenance Mode — Design Spec

**Date:** 2026-04-04  
**Status:** Approved  
**Scope:** Add maintenance mode to the admin settings panel, enforced via Next.js middleware

---

## Overview

Admins can toggle a maintenance mode flag from the Settings page. When enabled, all non-admin users are redirected to a branded "under construction" page with a custom message. Admins retain full access by logging in directly via `/auth/login`.

---

## 1. Data Layer

**Table:** `OrganizationSettings` (existing singleton row, `id = 'main'`)

Two new columns:

| Column | Type | Default | Notes |
|---|---|---|---|
| `maintenanceMode` | `INTEGER` (0/1) | `0` | SQLite boolean |
| `maintenanceMessage` | `TEXT` | `NULL` | Custom message; falls back to default if null |

**Migration:** `migrations/0023_maintenance_mode.sql`

```sql
ALTER TABLE "OrganizationSettings" ADD COLUMN "maintenanceMode" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "OrganizationSettings" ADD COLUMN "maintenanceMessage" TEXT;
```

**Schema update:** `src/db/schema.ts` — add both fields to the `organizationSettings` table definition.

---

## 2. Middleware

**New file:** `src/middleware.ts`

Uses NextAuth's `auth()` wrapper and `getCloudflareContext()` from `@opennextjs/cloudflare`.

**Logic per request:**

1. **Always bypass** (no auth or maintenance check):
   - `/auth/login`
   - `/api/auth/*`
   - `/maintenance`
   - `/_next/*`
   - `/favicon*`

2. **Admin check (JWT only, no DB):**
   - If `req.auth?.user?.role === 'ADMIN'` → `NextResponse.next()`

3. **Maintenance check (D1 query, non-admins only):**
   - Query `OrganizationSettings.maintenanceMode` where `id = 'main'`
   - If `1` → `NextResponse.redirect('/maintenance')`
   - If `0` → `NextResponse.next()`

**Matcher config:** All routes except `_next/static`, `_next/image`, and image files.

**Bundle note:** Use dynamic imports for `drizzle-orm`, `@/db`, and `@/db/schema` inside the middleware handler — consistent with the lazy-import pattern used across all edge API routes.

---

## 3. Maintenance Page

**New file:** `src/app/maintenance/page.tsx`

- Server component — no auth required, always accessible
- Fetches `OrganizationSettings` directly from D1 (server-side, no API hop)
- Displays:
  - Site logo (static asset from `public/` directory, same as used in the site header)
  - Org name (from `OrganizationSettings.orgName`)
  - `maintenanceMessage` (or default: *"We're currently performing maintenance. Please check back soon."*)
- Standalone layout — no site header, nav, or footer
- Matches site visual style: centered card, blue/purple gradient background

---

## 4. Settings UI

**File:** `src/app/dashboard/page.tsx`

A new card added below the existing org details card, visible only to admins (same guard as rest of Settings tab).

**Card contents:**
- Section heading: "Maintenance Mode"
- Toggle switch — ON/OFF
- Warning text shown when toggle is ON: *"Site will be inaccessible to all non-admin users."*
- Custom message textarea — only visible when toggle is ON; optional
- Save button with loading state ("Saving…")
- Green success / red error status message

**Data flow:**
- `loadOrgSettings()` already fetches from `/api/events?resource=org-settings` — extend to include `maintenanceMode` and `maintenanceMessage`
- Save: PATCH to `/api/admin/members` with `action: 'updateMaintenanceMode'`, payload `{ maintenanceMode, maintenanceMessage }`
- Handler added to `src/app/api/admin/members/route.ts` (existing admin-guarded PATCH handler)

---

## 5. API Handler

**File:** `src/app/api/admin/members/route.ts`

New action in the existing PATCH handler:

```ts
if (action === 'updateMaintenanceMode') {
  await db.update(organizationSettings).set({
    maintenanceMode: body.maintenanceMode ? 1 : 0,
    maintenanceMessage: String(body.maintenanceMessage ?? '').trim() || null,
    updatedAt: now,
  }).where(eq(organizationSettings.id, 'main'));
  return NextResponse.json({ ok: true });
}
```

Already admin-guarded by the `requireAdmin()` check at the top of the handler.

---

## 6. GET Endpoint Update

**File:** `src/app/api/events/route.ts`

The `org-settings` resource response already returns the full `OrganizationSettings` row — no changes needed once the schema is updated.

---

## Access Flow Summary

```
Non-admin user hits any page
  → middleware checks JWT → not ADMIN
  → middleware queries D1 → maintenanceMode = 1
  → redirect to /maintenance
  → sees branded page with custom message

Admin user hits any page
  → middleware checks JWT → role = ADMIN
  → let through (no D1 hit)

Admin wants to log in during maintenance
  → goes to /auth/login (always bypassed by middleware)
  → logs in normally
  → redirected to dashboard with full access
```

---

## Out of Scope

- No maintenance mode for specific pages only — it's all-or-nothing
- No scheduled maintenance windows — toggle is manual
- No email notifications to members when maintenance mode is toggled
