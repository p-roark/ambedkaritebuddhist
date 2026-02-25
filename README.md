# Ambedkarite Buddhist Community Website

A full-stack community platform for Ambedkarite Buddhists in Canada. Features event management, membership, donations, student resources, and a contact system — built entirely on Cloudflare's edge infrastructure.

**Organization:** Ambedkarite Buddhist Organization Canada (Nonprofit)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, edge runtime) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Cloudflare D1 (SQLite) via Drizzle ORM |
| Auth | NextAuth.js v5 (JWT + Google OAuth) |
| Storage | Cloudflare R2 (event images) |
| Hosting | Cloudflare Pages |
| Package Manager | pnpm |

> For full architecture details see [docs/architecture.md](docs/architecture.md).

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Cloudflare account with D1 and R2 configured

### Install

```bash
pnpm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

Key variables:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<min 32 chars>
ADMIN_EMAIL=your@email.com
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_DATABASE_ID=
CLOUDFLARE_D1_TOKEN=
```

### Run Locally

```bash
pnpm pages:dev    # Recommended — runs wrangler dev with full CF bindings
```

Or for standard Next.js dev (limited Cloudflare binding support):

```bash
pnpm dev
```

---

## Database

This project uses **Cloudflare D1** (SQLite) with **Drizzle ORM**.

```bash
# Apply migrations to local database
pnpm db:migrate:local

# Apply migrations to production
pnpm db:migrate:remote

# Generate a new migration after editing src/db/schema.ts
pnpm db:generate

# Open Drizzle Studio (visual DB browser)
pnpm db:studio
```

Schema is defined in `src/db/schema.ts`.

---

## Build & Deploy

```bash
# Build for Cloudflare Pages
pnpm pages:build

# Type check
pnpm type-check

# Lint
pnpm lint

# Format
pnpm format
```

Deployment is automatic via Cloudflare Pages CI/CD:
- `dev` branch → staging
- `main` branch → production

---

## Testing

```bash
pnpm test          # Unit tests (Vitest)
pnpm test:watch    # Watch mode
```

---

## Project Structure

```
src/
├── app/
│   ├── (public)/     # Public pages
│   ├── (auth)/       # Login page
│   ├── (admin)/      # Admin dashboard
│   ├── profile/      # User profile
│   └── api/          # Edge API routes
├── components/       # UI, layout, sections
├── db/               # Drizzle client + schema
└── lib/              # Auth, R2, utilities
migrations/           # SQL migration files
docs/                 # Architecture documentation
```

---

## Contributing

- Use TypeScript strictly — no `any` types
- Follow kebab-case for files, PascalCase for components
- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
- All API routes require `export const runtime = 'edge'`
- Use `pnpm` — never npm or yarn
- Run `pnpm lint` and `pnpm type-check` before committing

---

## Resources

- [Architecture & Technical Reference](docs/architecture.md)
- [Next.js Docs](https://nextjs.org/docs)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [NextAuth.js v5 Docs](https://authjs.dev)
- [shadcn/ui](https://ui.shadcn.com)
