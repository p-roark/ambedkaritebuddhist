# Ambedkarite Buddhist Community Website - Claude Instructions

## Project Overview

This is a **nonprofit community website** for Ambedkarite Buddhists in Canada. The platform serves the community by providing event management, student support resources, donation/fundraising capabilities, membership management, and promoting the teachings of Dr. B.R. Ambedkar and Buddhism.

**Mission:** Build an inclusive digital home for Ambedkarite Buddhists in Canada that supports newcomers, celebrates community, and maintains transparency in nonprofit operations.

---

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **Database:** PostgreSQL (via Supabase or Neon)
- **ORM:** Prisma
- **Authentication:** NextAuth.js
- **Payments:** Stripe
- **Hosting:** Vercel
- **Package Manager:** pnpm

---

## Design System

### Color Palette
```typescript
// Primary Colors
const colors = {
  primary: {
    saffron: '#E8B20E',     // Golden Saffron (main CTA, headers)
    blue: '#2D4D9B',        // Ambedkarite Blue (secondary actions)
  },
  background: {
    white: '#FFFFFF',
    light: '#F6F6F6',
  },
  text: {
    dark: '#1F2937',
    medium: '#6B7280',
    light: '#9CA3AF',
  }
}
```

### Typography
- **Headings:** Inter (sans-serif, clean, modern)
- **Body:** Noto Sans (readable, supports multiple scripts)
- **Font Sizes:** Follow WCAG AA accessibility standards (minimum 16px for body)

### Design Principles
- **Mobile-first:** Prioritize mobile experience
- **Accessibility:** WCAG 2.1 AA compliance mandatory
- **Clean & Minimalist:** Buddhist aesthetic with breathing room
- **Card-based:** Use cards for events, goals, news items
- **Progress indicators:** Visual feedback for donations and goals

---

## Project Structure

```
ambedkaritebuddhist/
├── docs/                    # Documentation
│   └── architecture.md      # Tech stack & architecture reference
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── (public)/        # Public routes
│   │   ├── (admin)/         # Admin dashboard
│   │   └── api/             # API routes
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── features/        # Feature-specific components
│   │   └── layout/          # Layout components
│   ├── lib/                 # Utilities and helpers
│   ├── styles/              # Global styles
│   └── types/               # TypeScript types
├── prisma/                  # Database schema
└── public/                  # Static assets
```

---

## Development Guidelines

### Code Style
- Use TypeScript strictly - no `any` types
- Follow ESLint and Prettier configurations
- Use functional components with hooks
- Prefer named exports over default exports
- Keep components small and focused (< 200 lines)

### Naming Conventions
- **Files:** kebab-case for files (`user-profile.tsx`)
- **Components:** PascalCase (`UserProfile`)
- **Functions:** camelCase (`handleSubmit`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_UPLOAD_SIZE`)

### Component Structure
```tsx
// 1. Imports
import { useState } from 'react'
import { Button } from '@/components/ui/button'

// 2. Types
interface ComponentProps {
  title: string
}

// 3. Component
export function Component({ title }: ComponentProps) {
  // 4. Hooks
  const [state, setState] = useState()

  // 5. Handlers
  const handleClick = () => {}

  // 6. Render
  return <div>{title}</div>
}
```

### Git Commit Conventions
Use conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Test additions or updates
- `chore:` Build process or auxiliary tool changes

Example: `feat: add event registration form`

---

## Key Features to Implement

### 1. Events System
- Event listing (upcoming and past)
- Event registration forms with validation
- Admin CRUD for events
- Image galleries per event
- YouTube video embeds

### 2. Donations & Goals
- Goal-based fundraising campaigns
- Real-time progress tracking
- Stripe integration for payments
- Donation receipts via email
- Transparent financial reporting

### 3. Membership Management
- Tiers: Student, Individual, Family, Lifetime
- Online registration and payment
- Renewal reminders (automated emails)
- Member dashboard
- Admin tracking and export

### 4. Student Support
- Resource pages (moving to Canada, career support)
- Mentor registration system
- Resource categorization and search
- Downloadable guides

### 5. Media Gallery
- Image upload with Cloudinary
- YouTube video embeds
- Gallery grid with lightbox
- Filterable by event/category

### 6. Admin Dashboard
- Content management for all sections
- User and membership management
- Financial reports and analytics
- Event management interface

---

## Build & Deployment

### Development
```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run linting
pnpm lint

# Run type checking
pnpm type-check

# Run tests
pnpm test
```

### Environment Variables
Required environment variables:
```env
# Database
DATABASE_URL=

# NextAuth
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# Stripe
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email
EMAIL_SERVER=
EMAIL_FROM=
```

### Deployment
- **Hosting:** Vercel (automatic deployments from main branch)
- **Database:** Managed PostgreSQL (Supabase/Neon)
- **CDN:** Vercel Edge Network + Cloudinary for images

---

## Important Considerations

### Cultural Sensitivity
- This project honors Dr. B.R. Ambedkar and Buddhist principles
- Use respectful language when referring to community and teachings
- Include appropriate symbols (lotus 🪷, dhamma wheel ☸️) tastefully
- Maintain dignity and respect in all content

### Accessibility (Critical)
- All interactive elements must be keyboard navigable
- Color contrast ratios must meet WCAG AA standards
- All images must have descriptive alt text
- Forms must have proper labels and error messages
- Test with screen readers

### Security
- Never commit secrets or API keys
- Validate all user inputs (client and server side)
- Use Prisma to prevent SQL injection
- Implement rate limiting on forms
- Secure admin routes with NextAuth.js

### Performance
- Optimize images (use Next.js Image component)
- Lazy load components and images
- Implement proper caching strategies
- Monitor Core Web Vitals
- Target Lighthouse score > 90

---

## Testing Strategy

### Unit Tests
- Test utility functions
- Test form validation logic
- Test data transformation functions

### Integration Tests
- Test API routes
- Test database operations
- Test authentication flows

### E2E Tests
- Test critical user journeys (donation flow, registration)
- Test admin workflows
- Test across different devices/browsers

---

## Documentation Standards

- Keep [docs/architecture.md](docs/architecture.md) updated as the tech stack evolves
- Document all API endpoints
- Add JSDoc comments to complex functions
- Maintain a CHANGELOG.md for version tracking
- Create user guides for admin features

---

## When Working on This Project

1. **Always reference** [docs/architecture.md](docs/architecture.md) for tech stack and architecture details
2. **Prioritize accessibility** - it's not optional
3. **Mobile-first approach** - design and test on mobile first
4. **Ask for clarification** if cultural or community-specific aspects are unclear
5. **Write tests** for critical features (payments, registrations)
6. **Document as you go** - don't defer documentation
7. **Consider nonprofit constraints** - prefer free/low-cost solutions
8. **Think long-term** - code will be maintained by community volunteers

---

## Useful Commands

```bash
# Database
pnpm prisma:migrate     # Run migrations
pnpm prisma:studio      # Open Prisma Studio
pnpm prisma:generate    # Generate Prisma client

# Development
pnpm dev                # Start dev server
pnpm build              # Build for production
pnpm start              # Start production server

# Code Quality
pnpm lint               # Run ESLint
pnpm lint:fix           # Fix ESLint issues
pnpm format             # Format with Prettier
pnpm type-check         # TypeScript type checking

# Testing
pnpm test               # Run all tests
pnpm test:watch         # Run tests in watch mode
pnpm test:coverage      # Generate coverage report
```

---

## Resources

- **Architecture:** [docs/architecture.md](docs/architecture.md)
- **Next.js Docs:** https://nextjs.org/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com
- **Prisma:** https://www.prisma.io/docs
- **Stripe:** https://stripe.com/docs

---

## Contact

**Project Lead:** Pankaj Patil
**Email:** pankaj9um@gmail.com
**Organization:** Ambedkarite Buddhist Organization Canada (Nonprofit)

---

## License

To be determined (MIT or GPL recommended for nonprofit open source)
