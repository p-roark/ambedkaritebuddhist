# Architecture & Technical Reference

> **For AI agents and developers:** This document describes how the website is built, deployed, and how all systems connect. Read this before making changes.

---

## Table of Contents

1. [Tech Stack Overview](#tech-stack-overview)
2. [Cloudflare Infrastructure](#cloudflare-infrastructure)
3. [Project Structure](#project-structure)
4. [Database (Cloudflare D1 + Drizzle ORM)](#database)
5. [Authentication (NextAuth.js v5)](#authentication)
6. [API Routes](#api-routes)
7. [Storage (Cloudflare R2)](#storage)
8. [Environment Variables](#environment-variables)
9. [Local Development](#local-development)
10. [Deployment](#deployment)
11. [Key Utilities & Patterns](#key-utilities--patterns)
12. [Database Schema Quick Reference](#database-schema-quick-reference)

---

## Tech Stack Overview

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js | ^16.0.10 | App Router, edge runtime |
| Language | TypeScript | ^5.3.3 | Strict mode enabled |
| Styling | Tailwind CSS | ^3.4.0 | + shadcn/ui components |
| ORM | Drizzle ORM | ^0.38.3 | Replaces Prisma (see below) |
| Database | Cloudflare D1 | — | SQLite at the edge |
| Auth | NextAuth.js | 5.0.0-beta.30 | JWT strategy, Google OAuth |
| Storage | Cloudflare R2 | — | Event images |
| Hosting | Cloudflare Pages | — | NOT Vercel (see below) |
| CF Adapter | @cloudflare/next-on-pages | ^1.13.7 | Converts Next.js for CF Pages |
| CLI | Wrangler | ^3.99.0 | Cloudflare dev & deploy |
| Package Manager | pnpm | — | Always use pnpm |
| Testing | Vitest + Playwright | ^1.0.0 | Unit + E2E |

> **Important:** `prisma/schema.prisma` and `prisma/seed.ts` exist in the repo but are **legacy/unused**. The active ORM is **Drizzle** with schema at `src/db/schema.ts` and migrations in `migrations/`.

> **Important:** `CLAUDE.md` mentions Vercel as the host. The actual deployment target is **Cloudflare Pages** (configured via `wrangler.toml`). All API routes use `export const runtime = 'edge'`.

---

## Cloudflare Infrastructure

The site runs entirely on Cloudflare's edge network. There is no traditional Node.js server.

### Services Used

| Service | Binding Name | Purpose |
|---|---|---|
| Cloudflare Pages | — | Hosts the Next.js application |
| Cloudflare D1 | `DB` | SQLite database (primary datastore) |
| Cloudflare R2 | `EVENT_IMAGES` | Object storage for event images |

### wrangler.toml

```toml
name = "ambedkaritebuddhist"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = ".vercel/output/static"

[[d1_databases]]
binding = "DB"
database_name = "ambedkaritebuddhist"
database_id = "c1eda722-53f9-4bf5-93ab-bbdb5e98631b"
migrations_dir = "migrations"

[[r2_buckets]]
binding = "EVENT_IMAGES"
bucket_name = "ambedkaritebuddhist-images"
```

- `nodejs_compat` flag is required for modules that use Node.js APIs
- The `pages_build_output_dir` points to the next-on-pages adapter output
- Bindings (`DB`, `EVENT_IMAGES`) are injected by Cloudflare at runtime — never imported statically

### Accessing Cloudflare Bindings

Bindings are accessed via the request context, not as global imports. Use these helpers:

**D1 database:**
```ts
// src/db/index.ts
import { getDb } from '@/db'

// Inside an API route handler:
const db = getDb(request)  // or getDb(context)
```

**R2 bucket:**
```ts
// src/lib/r2.ts
import { getEventImagesBucket } from '@/lib/r2'

const bucket = getEventImagesBucket(request)
```

### Edge Runtime

Every API route must declare:
```ts
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
```

This ensures the route runs on Cloudflare Workers (not Node.js) and always fetches fresh data.

---

## Project Structure

```
ambedkaritebuddhist/
├── src/
│   ├── app/
│   │   ├── (public)/           # Public pages: home, about, events, contact, etc.
│   │   ├── (auth)/             # Auth pages: /auth/login
│   │   ├── (admin)/            # Admin dashboard: /dashboard
│   │   ├── profile/            # User profile page
│   │   └── api/                # All API routes (edge runtime)
│   │       ├── auth/[...nextauth]/
│   │       ├── events/
│   │       ├── admin/
│   │       ├── profile/
│   │       ├── referral/
│   │       ├── contact/
│   │       └── me/
│   ├── components/
│   │   ├── auth/               # MembershipGate component
│   │   ├── layout/             # Header, Navigation, Footer
│   │   ├── providers/          # SessionProvider wrapper
│   │   ├── sections/           # Page section components (Hero, EventsPreview, etc.)
│   │   └── ui/                 # shadcn/ui components (Button, Card)
│   ├── db/
│   │   ├── index.ts            # Drizzle client factory — getDb()
│   │   └── schema.ts           # Complete Drizzle ORM schema (source of truth)
│   ├── lib/
│   │   ├── auth.ts             # NextAuth configuration
│   │   ├── admin-auth.ts       # requireAdmin() helper
│   │   ├── r2.ts               # R2 bucket access
│   │   ├── referral.ts         # Referral code logic
│   │   ├── user-name.ts        # Display name helpers
│   │   ├── constants.ts        # App-wide constants
│   │   └── utils.ts            # General utilities
│   ├── styles/
│   │   ├── globals.css
│   │   └── variables.css
│   ├── types/                  # TypeScript types
│   └── env.d.ts                # CloudflareEnv interface (DB, EVENT_IMAGES bindings)
├── migrations/                 # Drizzle Kit SQL migrations (0001–0010)
├── prisma/                     # LEGACY — do not use
├── public/
│   └── images/
│       ├── backgrounds/        # 7 hero background images
│       └── events/covers/      # Event cover images (static)
├── docs/                       # Documentation
├── wrangler.toml               # Cloudflare Pages + D1 + R2 config
├── drizzle.config.ts           # Drizzle Kit config (points to D1)
├── next.config.js              # Next.js config with CF dev platform setup
├── tailwind.config.ts          # Design tokens (colors, fonts, spacing)
└── .env.example                # Required environment variables
```

---

## Database

### Technology

- **Cloudflare D1** — managed SQLite database running at the edge
- **Drizzle ORM** — type-safe query builder (no runtime schema generation)
- **Drizzle Kit** — migration generator and studio

### Schema Location

`src/db/schema.ts` — this is the single source of truth for the database schema.

### Tables

| Table | Purpose |
|---|---|
| `users` | Registered users with profile info, role, referral tracking |
| `accounts` | NextAuth OAuth accounts (Google) |
| `sessions` | NextAuth sessions (unused with JWT strategy) |
| `verificationTokens` | Email verification tokens |
| `referralCodes` | Referral codes with owner, max uses, current uses |
| `events` | Events with pricing, images, status, archived flag |
| `eventRegistrations` | User registrations including family/guest details, payment |
| `familyMembers` | Family members attached to a user account |
| `contactMessages` | Contact form submissions with admin status |

### Migrations

Migrations live in `migrations/` as plain SQL files. They are applied using Drizzle Kit:

```bash
pnpm db:migrate:local    # Apply to local miniflare D1
pnpm db:migrate:remote   # Apply to production D1
```

To generate a new migration after editing `src/db/schema.ts`:
```bash
pnpm db:generate
```

Current migrations: `0001_init.sql` through `0010_contact_messages.sql`.

### Using the Database in API Routes

```ts
import { getDb } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const db = getDb(request)
  const result = await db.select().from(users).where(eq(users.email, 'x@x.com'))
  return Response.json(result)
}
```

---

## Authentication

### Technology

- **NextAuth.js v5 (beta)** — `next-auth@5.0.0-beta.30`
- **Strategy:** JWT (no database sessions — `jwt` strategy is required for edge runtime)
- **Providers:** Google OAuth (optional, requires env vars) + Credentials (email/password)

### Configuration

`src/lib/auth.ts` — full NextAuth config with:

- **signIn callback:** Validates Google provider email
- **jwt callback:** Fetches user role and membership from D1 and adds to token
- **session callback:** Maps JWT token fields to the `session.user` object

### Session Shape

```ts
session.user = {
  id: string
  email: string
  name: string
  image?: string
  role: 'ADMIN' | 'LEADER' | 'MEMBER' | 'STUDENT'
}
```

### Admin Authorization

Use `requireAdmin()` from `src/lib/admin-auth.ts` in any admin API route:

```ts
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(request: Request) {
  const admin = await requireAdmin(request)
  if (!admin) return new Response('Unauthorized', { status: 401 })

  // admin.email is available
}
```

Admin status is determined by:
1. `ADMIN_EMAIL` environment variable match, OR
2. `role = 'ADMIN'` in the `users` D1 table

### Auth Routes

- Sign-in page: `/auth/login`
- NextAuth handler: `/api/auth/[...nextauth]`
- No register page yet (placeholder directory exists at `src/app/(auth)/auth/register/`)

---

## API Routes

All routes in `src/app/api/` use `export const runtime = 'edge'` and `export const dynamic = 'force-dynamic'`.

### Public (No Auth Required)

| Method | Path | Description |
|---|---|---|
| GET | `/api/events` | List non-archived events with registration counts |
| POST | `/api/contact/messages` | Submit contact form |
| POST | `/api/referral/verify` | Verify and apply a referral code |

### Authenticated (Requires Session)

| Method | Path | Description |
|---|---|---|
| GET | `/api/profile` | Get current user's profile |
| PATCH | `/api/profile` | Update profile fields |
| GET | `/api/profile/family` | List user's family members |
| POST | `/api/events/[id]/register` | Register for an event |
| GET | `/api/me/status` | Get current user status and role |

### Admin Only (Requires ADMIN Role)

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/events` | List all events |
| POST | `/api/admin/events` | Create new event |
| PATCH | `/api/admin/events` | Update event status or archived flag |
| GET | `/api/admin/events/[id]` | Get single event details |
| POST | `/api/admin/events/[id]/images` | Upload images to R2 for event |
| DELETE | `/api/admin/events/[id]` | Delete event |
| GET | `/api/admin/members` | List all registered members |
| GET | `/api/admin/messages` | List contact form submissions |
| GET | `/api/admin/referral-codes` | List referral codes |
| POST | `/api/admin/referral-codes` | Create a new referral code |

### Special

| Method | Path | Description |
|---|---|---|
| GET | `/api/events/image` | Retrieve event image from R2 |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth.js handler |

---

## Storage

### Cloudflare R2

Used to store event images uploaded through the admin panel.

- **Binding name:** `EVENT_IMAGES`
- **Bucket name:** `ambedkaritebuddhist-images`
- **Access helper:** `src/lib/r2.ts` → `getEventImagesBucket(request)`

Event image keys are stored as a JSON array string in the `events.eventImages` column.

```ts
// Parse image keys from DB
import { parseEventImageKeys } from '@/lib/r2'
const keys = parseEventImageKeys(event.eventImages) // string[]
```

Images are served via the `/api/events/image` route which proxies from R2.

---

## Environment Variables

See `.env.example` for the full list. Key variables:

```env
# NextAuth (required)
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<min 32 chars, random string>

# Cloudflare — used by Drizzle Kit for migrations (not at runtime)
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_DATABASE_ID=c1eda722-53f9-4bf5-93ab-bbdb5e98631b
CLOUDFLARE_D1_TOKEN=

# Admin bootstrap
ADMIN_EMAIL=pankaj9um@gmail.com
ADMIN_PASSWORD=admin123
ADMIN_REFERRAL_CODE=BHIM-ABC-7K2M

# Google OAuth (optional)
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
```

**At runtime on Cloudflare Pages:**
- `DB` and `EVENT_IMAGES` bindings are injected by Cloudflare — no env var needed
- All other secrets (NEXTAUTH_SECRET, ADMIN_EMAIL, etc.) are set in the Cloudflare Pages dashboard under Settings → Environment Variables

---

## Local Development

### Setup

```bash
pnpm install
```

### Run Dev Server

```bash
pnpm dev          # Standard Next.js dev server (limited CF bindings)
pnpm pages:dev    # Wrangler dev server (full CF bindings, recommended)
```

`pnpm pages:dev` uses miniflare under the hood and provides local D1 and R2 access.

### Local Database

```bash
pnpm db:migrate:local    # Apply migrations to local D1
pnpm db:studio           # Open Drizzle Studio (visual DB browser)
```

### Code Quality

```bash
pnpm lint          # ESLint
pnpm lint:fix      # Auto-fix ESLint
pnpm format        # Prettier
pnpm type-check    # TypeScript compiler check
pnpm test          # Vitest unit tests
```

---

## Deployment

### Build Process

```bash
pnpm pages:build    # Runs next-on-pages adapter → outputs to .vercel/output/static
```

The `@cloudflare/next-on-pages` adapter converts the Next.js build output into a format Cloudflare Pages can deploy.

### Deploy

Deployment is automatic via Cloudflare Pages CI/CD:
- **`dev` branch** → staging environment
- **`main` branch** → production environment

To deploy manually:
```bash
pnpm pages:deploy   # (if configured in package.json)
```

### Production Database Migrations

```bash
pnpm db:migrate:remote   # Runs migrations against production D1
```

Always run migrations before deploying schema-breaking changes.

---

## Key Utilities & Patterns

### Referral Codes (`src/lib/referral.ts`)

Format: `BHIM-XXX-YYYY` (e.g., `BHIM-ABC-7K2M`)

```ts
import { generateReferralCode, isValidReferralCodeFormat } from '@/lib/referral'

const code = generateReferralCode()
const isValid = isValidReferralCodeFormat('BHIM-ABC-7K2M') // true
```

### Display Names (`src/lib/user-name.ts`)

Smart name resolution from multiple sources:
```ts
import { pickDisplayName } from '@/lib/user-name'
const name = pickDisplayName(user) // Picks best available name
```

### Image Paths (`src/lib/image-path.ts`, `src/lib/event-images.ts`)

Helpers for resolving event cover images and R2-stored gallery images.

### Constants (`src/lib/constants.ts`)

App-wide constants — check here before hardcoding values.

---

## Database Schema Quick Reference

### User Roles

```ts
type UserRole = 'ADMIN' | 'LEADER' | 'MEMBER' | 'STUDENT'
```

Default role on registration: `MEMBER`

### Event Status

```ts
type EventStatus = 'Upcoming' | 'Registration Started' | 'Event Ended'
```

### Contact Message Status

```ts
type MessageStatus = 'PENDING' | 'RESOLVED'
```

### Payment Status

Stored as string in `eventRegistrations.paymentStatus`:
- `'pending'`
- `'paid'`
- `'free'`

### JSON Columns

The following columns store JSON-encoded data as strings (D1/SQLite limitation):

| Table | Column | Type |
|---|---|---|
| `events` | `eventImages` | `string[]` — array of R2 object keys |
| `eventRegistrations` | `selectedFamilyMemberIds` | `number[]` — family member IDs |
| `eventRegistrations` | `nonMemberGuestDetails` | `object` — guest name/email/phone |

Always parse these with `JSON.parse()` and validate before use.

---

## Common Gotchas

1. **Don't import Cloudflare bindings at module level.** Always retrieve them inside a request handler using `getDb(request)` or `getEventImagesBucket(request)`.

2. **Every API route needs `runtime = 'edge'` and `dynamic = 'force-dynamic'`.** Without these, the route may not run correctly on Cloudflare Pages.

3. **Prisma is NOT used.** The `prisma/` directory is legacy. All database work goes through `src/db/schema.ts` (Drizzle).

4. **The host is Cloudflare Pages, not Vercel.** `CLAUDE.md` mentions Vercel historically, but `wrangler.toml` and the build process target Cloudflare Pages.

5. **JWT sessions only.** NextAuth is configured with `strategy: 'jwt'` because Cloudflare's edge runtime doesn't support database-backed sessions without extra complexity.

6. **Migrations must be run manually for production.** Run `pnpm db:migrate:remote` before deploying any schema changes.

7. **pnpm is the package manager.** Never use npm or yarn.
