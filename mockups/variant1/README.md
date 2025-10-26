# Ambedkarite Buddhist Community Website - Variant 1 (Modern Minimalist)

## Overview
This is a complete, fully clickable HTML mockup for the Ambedkarite Buddhist Community Canada website, featuring a modern minimalist design with clean, spacious layouts and card-based components.

## Design Style
- **Aesthetic**: Modern Minimalist
- **Layout**: Clean, spacious with lots of white space
- **Components**: Card-based design
- **Interactions**: Smooth animations and transitions
- **Approach**: Contemporary aesthetic with Buddhist and Ambedkarite elements

## Color Scheme
- **Primary Color**: `#E8B20E` (Saffron/Golden)
- **Secondary Color**: `#2D4D9B` (Ambedkarite Blue)
- **Background**: `#FFFFFF` / `#F6F6F6`
- **Text**: `#1a1a1a` (Dark) / `#666666` (Light)

## Typography
- **Headings**: Inter (Google Fonts)
- **Body Text**: Noto Sans (Google Fonts)
- **Accessible**: WCAG AA compliant font sizes

## Pages Included

### 1. index.html - Home Page
- Hero section with call-to-action buttons
- Community statistics
- Upcoming events preview (3 cards)
- Donation goals with progress bars
- Mission statement
- Call-to-action section

### 2. about.html - About Us
- Mission and vision cards
- Community story with imagery
- Core values (4 cards)
- Leadership team profiles (6 members with photos)
- Join community CTA

### 3. events.html - Events Listing
- Filter buttons (All, Religious, Cultural, Educational, Social, Online)
- Event cards with mock data (9 events)
- Past events section (4 cards)
- Event organization CTA

### 4. event-detail.html - Single Event Page
- Event header with date, time, location
- Detailed event description
- Schedule and what to bring
- Registration form with validation
- Related events section
- Social sharing buttons

### 5. donations.html - Donations Page
- Impact statistics
- 4 donation goals with progress bars:
  - Build the Vihara ($125K/$500K - 25%)
  - Student Support Fund ($18K/$25K - 72%)
  - Annual Events ($8.5K/$20K - 42%)
  - Educational Resources ($3.2K/$10K - 32%)
- Comprehensive donation form
- Amount selection buttons
- Financial transparency section

### 6. membership.html - Membership
- Free membership system overview
- Community benefits showcase (4 cards)
- Referral-based registration system:
  - Referral link validation
  - New member application form
  - Community guidelines acceptance
- For existing members:
  - Referral link generation dashboard
  - Referral tracking interface
  - Referred members status
- How the referral system works
- FAQ section

### 7. students.html - Student Support
- Tab navigation system:
  - **Moving to Canada**: Pre-arrival checklist, immigration, housing, banking, phone/internet, healthcare
  - **Current Students**: Career development, co-op/internships, networking, financial aid, mental health
  - **Mentorship Program**: Mentor profiles, application forms
- Resource cards with detailed information
- Essential links and resources

### 8. gallery.html - Photo Gallery
- Filter system (All, Events, Religious, Cultural, Community)
- 20 gallery images in responsive grid
- Lightbox functionality with keyboard navigation
- Video section with 6 video cards
- Event albums section
- Fully interactive image viewer

### 9. contact.html - Contact Page
- Contact information cards (Email, Phone, Location)
- Contact form with subject selection
- Map placeholder with styling
- Office hours
- Regional chapters (6 locations)
- FAQ section
- Social media links

## Key Features

### Navigation
- Sticky navigation bar with scroll effect
- Mobile-responsive hamburger menu
- Active page highlighting
- Smooth transitions

### Interactive Elements
- Hover effects on all cards and buttons
- Progress bar animations on scroll
- Tab switching (Students page)
- Filter functionality (Events, Gallery)
- Lightbox gallery with keyboard controls
- Form validation with success messages
- Smooth scrolling to anchors

### Forms
All forms include:
- Client-side validation
- Required field indicators
- Success messages
- Accessible labels and inputs
- Mobile-friendly layouts

### Responsive Design
- Mobile-first approach
- Breakpoint at 768px
- Flexible grid layouts (CSS Grid)
- Responsive typography
- Collapsible navigation on mobile
- Touch-friendly buttons and links

### Mock Data

#### Events
6+ events with varied categories:
- Religious: Buddha Purnima, Dhammachakra Pravartan Din
- Cultural: Dr. Ambedkar Jayanti, Cultural Festival
- Educational: Student Orientation, Career Workshop, Buddhism Study Circle
- Social: Community Picnic, Networking Meetup

#### Leadership Team
6 placeholder members with roles:
- President, Vice President, Treasurer, Secretary, Student Affairs, Communications

#### Regional Chapters
- Toronto (Main Office)
- Vancouver, Calgary, Montreal, Ottawa
- Start New Chapter option

### Technologies Used
- HTML5
- CSS3 (with CSS Variables)
- Vanilla JavaScript (no frameworks)
- Google Fonts (Inter, Noto Sans)
- Picsum Photos for placeholder images

## File Structure
```
variant1/
├── css/
│   └── styles.css          # Complete CSS with utilities
├── js/
│   └── main.js             # Interactive functionality
├── index.html              # Home page
├── about.html              # About us
├── events.html             # Events listing
├── event-detail.html       # Single event
├── donations.html          # Donations & goals
├── membership.html         # Membership tiers
├── students.html           # Student support (3 tabs)
├── gallery.html            # Photo gallery
├── contact.html            # Contact form
└── README.md               # This file
```

## JavaScript Features
- Mobile navigation toggle
- Sticky navbar on scroll
- Tab functionality
- Filter system for events and gallery
- Lightbox with keyboard navigation (←, →, ESC)
- Form validation
- Progress bar animations (Intersection Observer)
- Smooth scrolling
- Donation amount selection
- Active page highlighting
- Fade-in animations on scroll

## Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Graceful degradation for older browsers

## Performance Features
- CSS animations with GPU acceleration
- Lazy-loading friendly structure
- Optimized images (via Picsum CDN)
- Minimal JavaScript dependencies
- Efficient CSS with custom properties

## Accessibility Features
- Semantic HTML5 elements
- ARIA labels on interactive elements
- Keyboard navigation support
- High contrast ratios
- Focus indicators
- Alt text for images
- Form labels properly associated

## Future Enhancements
When converting to production:
1. Replace Picsum images with real photos
2. Implement backend for forms
3. Add payment gateway integration (Stripe)
4. Implement real authentication
5. Add CMS for content management
6. Set up email notifications
7. Add analytics tracking
8. Implement real map integration
9. Add blog/news section
10. Set up member portal

## Testing Checklist
- ✅ All navigation links work
- ✅ Forms validate correctly
- ✅ Filters work on Events and Gallery pages
- ✅ Tabs switch correctly on Students page
- ✅ Lightbox opens/closes/navigates
- ✅ Mobile menu toggles
- ✅ Progress bars animate
- ✅ All buttons have hover effects
- ✅ Responsive on mobile/tablet/desktop
- ✅ Smooth scrolling works

## Notes
- This is a static mockup for design review and user testing
- All forms show success messages but don't submit data
- Payment buttons are placeholders
- Map is a styled placeholder
- Video thumbnails are static images
- All links between pages are functional
- External links (Canada.ca, etc.) are placeholders

## Author
Created for the Ambedkarite Buddhist Community Canada
Design: Modern Minimalist (Variant 1)
Date: 2025

---

**To view the mockup**: Open `index.html` in a web browser and navigate through all pages using the navigation menu.
