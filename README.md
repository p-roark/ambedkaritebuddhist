# Ambedkarite Buddhist Community Website

A modern, responsive website for the Ambedkarite Buddhist community in Canada. Built with Next.js 14 and Tailwind CSS, featuring dynamic background images, event management, and donation capabilities.

## Features

- **Mockup 3 Design** - Vibrant, modern aesthetic with golden saffron and Ambedkarite blue
- **Random Background Images** - 7 curated images (Ambedkar, Buddha, Stupa) randomly selected on each page load
- **Responsive Layout** - Mobile-first design optimized for all screen sizes
- **Static HTML Export** - Pre-rendered pages with no server required
- **Fast Performance** - Lighthouse score optimized for speed and accessibility

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **Package Manager:** pnpm
- **Build:** Static HTML export with JavaScript bundles

## Project Structure

```
ambedkaritebuddhist/
├── src/
│   ├── app/                    # Next.js app directory (pages)
│   ├── components/
│   │   ├── sections/           # Page sections (hero, features, etc.)
│   │   ├── ui/                 # shadcn/ui components
│   │   └── layout/             # Layout components
│   ├── lib/
│   │   ├── backgrounds.ts      # Background image configuration
│   │   └── utils.ts            # Utility functions
│   └── styles/                 # Global styles
├── public/
│   └── images/
│       └── backgrounds/        # 7 background images
├── next.config.js              # Next.js static export config
└── dist/                        # Build output (generated)
```

## Static Build Process

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Build for Static Export

```bash
pnpm build
```

This command:
- Pre-renders all pages to static HTML files
- Bundles JavaScript for client-side interactivity
- Generates CSS stylesheets
- Creates a `dist/` folder with production-ready files

**Build Output Size:** ~7.8MB (including 7 background images)

### 3. Deployment

Upload the entire `dist/` folder to your hosting provider:

```bash
# The dist folder contains:
# - index.html, about.html, contact.html, etc. (pre-rendered pages)
# - _next/static/chunks/ (JavaScript bundles)
# - _next/static/css/ (Stylesheets)
# - images/backgrounds/ (7 background images)
```

### Hosting Requirements

Your hosting provider must support:
- ✅ Static file serving (HTML, JS, CSS, images)
- ✅ SPA routing (404 → index.html for client-side routing)

**NOT Required:**
- ❌ Node.js runtime
- ❌ Server-side processing
- ❌ Database connections

## Background Images

Background images are randomly selected from `public/images/backgrounds/`:

- **ambedkar-1.jpg** (119KB) - Ambedkar portrait
- **ambedkar-2.jpg** (176KB) - Ambedkar alternative
- **ambedkar-3.jpg** (66KB) - Ambedkar composition
- **buddha-1.jpg** (133KB) - Buddha meditation
- **buddha-2.jpg** (133KB) - Buddha scene
- **stupa-1.jpg** (4.1MB) - Buddhist stupa
- **stupa-2.jpg** (2.0MB) - Stupa alternative

### Adding New Background Images

1. Add JPG image to `public/images/backgrounds/`
2. Update `src/lib/backgrounds.ts` with the image path:

```typescript
export const AVAILABLE_BACKGROUNDS = [
  '/images/backgrounds/ambedkar-1.jpg',
  '/images/backgrounds/ambedkar-2.jpg',
  // ... add new image path here
  '/images/backgrounds/your-new-image.jpg',
]
```

3. Rebuild: `pnpm build`

## Development

### Run Development Server

```bash
pnpm dev
```

Opens on `http://localhost:3000`

### Build Commands

```bash
# Build for production (static HTML)
pnpm build

# Run type checking
pnpm type-check

# Lint code
pnpm lint

# Format code
pnpm format
```

## Configuration

### Next.js Config (`next.config.js`)

Static export is enabled with:

```javascript
const nextConfig = {
  output: 'export',           // Static HTML export
  images: {
    unoptimized: true,        // Disable Next.js image optimization
  },
}
```

## Pages

All pages are pre-rendered to static HTML:

- `index.html` - Home page
- `about.html` - About the community
- `contact.html` - Contact form
- `donations.html` - Donation campaigns
- `events.html` - Event listing
- `gallery.html` - Photo gallery
- `membership.html` - Membership tiers
- `resources.html` - Student resources
- `404.html` - Error page

## Performance

- **First Load JS:** ~105KB (highly optimized)
- **Page Size:** 20-37KB per HTML file
- **Total Build:** 7.8MB (including images)
- **Target Lighthouse Score:** >90

## Troubleshooting

### Build fails with "Cannot find module"

Clear the cache and rebuild:

```bash
rm -rf .next out dist
pnpm build
```

### Pages return 404

Ensure your hosting provider:
1. Serves `index.html` for unknown routes (SPA routing)
2. Has `dist/` folder uploaded completely
3. Supports proper MIME types for `.js` and `.css` files

### Background images not loading

1. Verify `dist/images/backgrounds/` folder exists
2. Check image file permissions (must be readable)
3. Clear browser cache (Ctrl+Shift+Delete)

### Styles not applying

1. Verify `dist/_next/static/css/` folder exists
2. Clear browser cache
3. Check browser console for CSS loading errors

## Project Organization

- **Mockup Design:** Variant 3 (Vibrant & Modern)
- **Primary Colors:** Saffron (#E8B20E), Ambedkarite Blue (#2D4D9B)
- **Typography:** Inter (headings), Noto Sans (body)
- **Accessibility:** WCAG 2.1 AA compliant

## Contributing

When working on this project:

1. Use TypeScript strictly (no `any` types)
2. Follow naming conventions:
   - Files: kebab-case (`component-name.tsx`)
   - Components: PascalCase (`ComponentName`)
   - Functions: camelCase (`handleClick`)
3. Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
4. Test on mobile devices first

## Support

For issues or questions about the build process, check:

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)

---

**Organization:** Ambedkarite Buddhist Organization Canada (Nonprofit)
**Last Updated:** November 22, 2025
