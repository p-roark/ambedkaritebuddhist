# 🪷 Ambedkarite Buddhist Community Website – Requirements & Specification

## 1. Executive Summary

This document defines the comprehensive requirements for the **Ambedkarite Buddhist Community Website** — a nonprofit digital platform serving the Ambedkarite Buddhist community in Canada. The platform supports community engagement, student assistance, event management, fundraising, and promotes the principles of Dr. B.R. Ambedkar and Buddhist teachings.

**Project Type:** Nonprofit Community Platform
**Primary Goal:** Build an inclusive digital home for Ambedkarite Buddhists in Canada
**Target Launch:** Q2 2025

---

## 2. Project Objectives

- **Community Building:** Create a central digital hub for Ambedkarite Buddhists across Canada
- **Student Support:** Provide comprehensive resources for Indian students coming to Canada
- **Financial Transparency:** Maintain public accountability for nonprofit operations and donations
- **Event Management:** Facilitate community gatherings, celebrations, and educational events
- **Cultural Preservation:** Promote and preserve Ambedkarite Buddhist teachings and values

---

## 3. User Personas

### 3.1 Primary Users
- **New Students:** Indian students (primarily from Maharashtra) moving to Canada for education
- **Established Members:** Existing community members and families in Canada
- **Community Leaders:** Board members, volunteers, and event organizers

### 3.2 Secondary Users
- **Potential Donors:** Individuals and organizations interested in supporting the cause
- **General Public:** People interested in learning about Ambedkarite Buddhism and Dr. B.R. Ambedkar
- **Mentors:** Community members willing to guide newcomers

### 3.3 Admin Users
- Website administrators
- Content managers
- Financial officers
- Event coordinators

---

## 4. Key Features

### 4.1 Public Information
- Home page showcasing mission, vision, and upcoming highlights.
- About section describing the nonprofit, history, and leadership.

### 4.2 Events
- Event listing with details (date, location, description).
- Online **event registration** (form submission + confirmation).
- Gallery for **past events** with YouTube video embeds and image uploads.
- Admin dashboard for creating/updating events.

### 4.3 Donations & Goals
- List of **short-term and long-term goals** (e.g., Building a Vihara).
- Display of goal progress (progress bars, donation totals).
- Secure online donation flow (one-time or recurring).
- Each goal can accept donations individually.

### 4.4 Membership
- Free membership through referral system only
- Online sign-up with valid referral link
- Member tracking and management
- Referral link generation for existing members
- Member authentication and personalized dashboards
- Role-based access and features:
  1. Regular Members:
     - Personal profile management
     - Event registration
     - Referral link generation
     - Resource access
  2. Student Members:
     - All regular member features
     - Student resources section
     - Mentorship program access
     - Career resources
  3. Family Group Members:
     - All regular member features
     - Family member management
     - Family event registrations
     - Children's program access
  4. Community Leaders:
     - All regular member features
     - Event management
     - Content moderation
     - Member approval rights
     - Analytics access

### 4.5 Student Support
- Resources for:
  - Students **moving to Canada** (immigration, housing, banking info).
  - Students **already in Canada** (career support, volunteering, mentorship).
- Mentor sign-up form and student resource listings.

### 4.6 Media Gallery
- Upload or link to event photos and videos.
- YouTube video previews embedded.
- Gallery grid with lightbox viewer.

### 4.7 Donations and Financial Transparency
- Donation progress bars for each goal.
- Downloadable annual reports and financial summaries.

---

## 5. Nonprofit Management Features

- Public display of board members, key contacts.
- Ability to manage financial goals and fundraising campaigns.
- Optional newsletter subscription.

---

## 6. Design & Branding

### 6.1 Theme
- Inspired by **Buddhist and Ambedkarite colors**:
  - **Primary:** `#E8B20E` (Golden Saffron)
  - **Secondary:** `#2D4D9B` (Ambedkarite Blue)
  - **Background:** `#FFFFFF` / `#F6F6F6`
- Clean, minimalist, modern aesthetic with spiritual undertones.

### 6.2 Typography
- **Headings:** Inter
- **Body:** Noto Sans
- Accessible font sizes (WCAG AA compliant).

### 6.3 Components
- Rounded buttons with hover effects.
- Card-based layout for events, goals, and news.
- Progress bars with percentage and goal text.
- Sticky navigation bar for quick access.

---

## 7. Pages and Structure

| Page | Description |
|------|--------------|
| **Home** | Hero banner, highlights (events, goals, videos), quick links, donate CTA |
| **About** | Mission, vision, leadership, community story |
| **Events** | Upcoming & past events, registration forms |
| **Donations & Goals** | List of financial and community goals with donation options |
| **Membership** | Membership tiers, payment flow, renewals |
| **Student Support** | Tabs for newcomers and current students, mentor form |
| **Media** | Image gallery, video previews, filters |
| **Contact** | Contact form, email, address, social links |

---

## 8. Functional Requirements

### 8.1 Core
- Responsive design (mobile-first).
- Secure login for admins.
- Form validation and submission handling.
- Payment integration (Stripe/PayPal).
- YouTube embed support for media.

### 8.2 Optional Future Additions
- Multi-chapter support (e.g., Calgary Chapter, Vancouver Chapter).
- Organization registration system with fees.
- Blog or News section.

---

## 9. Technical Requirements

### 9.1 Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Frontend Framework** | Next.js 14+ (React) | SSR/SSG for SEO, performance, and modern DX |
| **UI Framework** | Tailwind CSS + shadcn/ui | Rapid development with accessible components |
| **Backend** | Next.js API Routes / Node.js | Unified stack, serverless-ready |
| **Database** | PostgreSQL (via Supabase/Neon) | Relational data integrity, nonprofit needs |
| **ORM** | Prisma | Type-safe database access |
| **Authentication** | NextAuth.js | Secure admin authentication |
| **Payments** | Stripe | Donation processing only (membership is free) |
| **Media Storage** | Cloudinary | Image optimization and CDN |
| **Email** | Resend / SendGrid | Transactional emails and receipts |
| **Hosting** | Vercel | Optimized for Next.js, free tier for nonprofits |
| **CMS (Phase 2)** | Payload CMS / Strapi | Content management for non-technical admins |

### 9.2 Development Tools
- **Version Control:** Git + GitHub
- **Package Manager:** pnpm (fast, disk-efficient)
- **Linting:** ESLint + Prettier
- **Testing:** Vitest + React Testing Library
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry (error tracking), Vercel Analytics

### 9.3 Security Requirements
- HTTPS enforcement
- Rate limiting on forms and API endpoints
- SQL injection prevention (via Prisma)
- XSS protection
- CSRF tokens for forms
- PCI compliance for payment processing (via Stripe)
- Regular dependency audits
- Environment variable protection

### 9.4 Performance Requirements
- Lighthouse score > 90 across all metrics
- First Contentful Paint (FCP) < 1.5s
- Time to Interactive (TTI) < 3.5s
- Core Web Vitals passing
- Image lazy loading and optimization
- Code splitting and dynamic imports

---

## 10. Donations & Membership Logic

- Each donation linked to a specific goal (e.g., "Build the Vihara").
- Real-time progress calculation = (Total donations / Target goal).
- Membership referral system:
  - Each existing member can generate limited referral links
  - New members can only join with valid referral links
  - Referral tracking and analytics
  - Admin approval workflow for new members
- Donation receipts generated automatically.

---

## 11. Accessibility & Compliance

- WCAG 2.1 Level AA compliance.
- High-contrast color ratios.
- Keyboard navigable menus.
- Proper alt-text for images.

---

## 12. Deliverables

### 12.1 Design Deliverables
- [x] Requirements specification document
- [ ] Penpot design file with complete mockups
- [ ] Component library in Penpot
- [ ] Responsive layouts (Desktop, Tablet, Mobile)
- [ ] Design system documentation (colors, typography, spacing)
- [ ] Asset export package (icons, images, logos)

### 12.2 Development Deliverables
- [ ] Next.js application with all core features
- [ ] Admin dashboard for content management
- [ ] Database schema and migrations
- [ ] API documentation
- [ ] Deployment configuration
- [ ] Testing suite
- [ ] User documentation
- [ ] Technical documentation

### 12.3 Documentation
- [ ] User manual for admins
- [ ] API documentation
- [ ] Deployment guide
- [ ] Maintenance guide
- [ ] Contributing guidelines

---

## 13. Licensing & Attribution

- All images/videos must respect Creative Commons or original copyrights.
- Project code to be open-sourced under MIT or GPL license (to be confirmed).

---

## 15. Contact

**Project Lead:** Pankaj Patil  
**Community:** Ambedkarite Buddhist Organization Canada (Nonprofit)  
**Email:** pankaj9um@gmail.com  
**Design Collaboration:** Penpot  

---
