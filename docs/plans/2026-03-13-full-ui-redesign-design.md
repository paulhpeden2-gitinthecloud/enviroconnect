# Full UI Redesign — Design Document

**Date:** 2026-03-13
**Status:** Approved
**Inspirations:** Devin (60%), Upstream (40%), "Contact the Park" GSAP scroll experience
**Design System:** Evergreen Exchange (`evergreen-design-system.md`)

---

## 1. Foundation Changes

### Color Palette Migration
Replace current navy/green/cream with Evergreen "Steel Blue + Moss" system:

| Role | Old | New |
|------|-----|-----|
| Primary | Navy `#1B2A4A` | Steel Blue `#1C3144` |
| Secondary | Navy Light `#243759` | Ocean Blue `#2B4C6F` |
| Accent | Green `#2D5F2D` | Moss Green `#4A7C59` |
| Background | Cream `#F8F6F1` | Cloud `#F0F4F8` |
| Surface | White | White `#FFFFFF` |
| Border | Cream Dark `#EDE9E0` | Mist `#D5DDE5` |
| Text | `#1B2A4A` | Deep Navy `#0F1D2B` |

Plus extended palette: hover states, focus ring, danger/warning/info/success semantics.

### Typography Migration
- **Headings:** Science Gothic → **DM Sans** (600, 700) via Google Fonts
- **Body:** Electrolize → **Source Sans 3** (400, 500, 600) via Google Fonts
- **Monospace (new):** JetBrains Mono (400) for data values, IDs
- Remove local `@font-face` declarations, add Google Fonts `<link>` in `app/layout.tsx`

### Icons
- Replace inline SVGs with **Lucide React** (`lucide-react` package)
- Consistent 20px size, 1.5px stroke weight

### Dark Mode
- Keep `html.dark` class toggle mechanism
- Define dark overrides for Evergreen palette in `globals.css`

### CSS Variables
Rebuild `@theme inline` block in `globals.css` with full Evergreen variable set including spacing, radius, and shadow tokens.

---

## 2. Navigation — Hybrid Approach

### Public Pages (landing, about, directory, vendor profile)
**Floating pill navbar** (Devin-style):
- `fixed top-4 left-1/2 -translate-x-1/2`, `max-w-5xl`, `rounded-full`
- `backdrop-blur-md bg-primary/80` with glassmorphism effect
- Left: "EnviroConnect" wordmark (DM Sans 700)
- Center: nav links with subtle active dot indicator
- Right: Sign In (ghost) + Get Started (Moss Green pill)
- More opaque on scroll (opacity transition)
- Mobile: hamburger → slide-out panel

### Authenticated App Pages (dashboards, messages, meetings, RFQ)
**Sidebar + top bar** (Upstream-style):
- Left sidebar: 240px, white bg, Mist border-right
- Nav items with Lucide icons: Dashboard, Directory, RFQs, Messages, Meetings
- Active: Sage Wash bg + Moss Green left border + Moss Green text
- Collapsed (< 1024px): 64px icons-only
- Top bar: 56px, page title left, notifications + chat + avatar right
- Mobile (< 768px): sidebar → bottom tab bar (5 icons)

### Layout Switch
`app/layout.tsx` conditionally renders:
- Unauthenticated / public routes → floating navbar + footer
- Authenticated app routes → sidebar + top bar (no footer)

---

## 3. Landing Page — GSAP Cinematic Scroll

### Dependencies
- Add `gsap` npm package (with ScrollTrigger plugin)
- Landing page is standalone `"use client"` component with its own GSAP setup
- Rest of app keeps framer-motion

### Section 1: Hero Scroll
- Full viewport (`100vh`), fixed Mt. Rainier background image
- Floating pill navbar overlays the top
- Text container starts hidden above viewport, **scrubs down** on scroll:
  - Main: "ENVIROCONNECT" (centered, uppercase, very large, DM Sans 700)
  - Left: tagline about PNW environmental compliance
  - Right: CTA pills (Browse Vendors + Get Started)
- Custom cursor (desktop only): semi-transparent white circle, scale-up on link hover

### Section 2: Split-Screen Collapse ("Built for the PNW")
- 50/50 split, pinned during scroll (`pin: true`, `scrub: true`)
- **Left (Cloud bg):** "Built for the" → "Pacific Northwest" (extra-large bold) → body text
- **Right (Mt. Rainier image):** Giant white overlay: **"25+"** + "Pre-vetted Vendors"
- **On scroll:**
  - Left column collapses rightward into narrow strip (content clips)
  - Right image expands to fill viewport
  - Number counter scrubs 25 → 8 (service categories)
  - Compass/leaf motif fades in
- Mobile: simplified — no split collapse, just fade transitions

### Section 3: How It Works
- Cloud bg, 4 horizontal cards
- GSAP staggered scroll-triggered fade-ups
- Evergreen card styling: white, Mist border, shadow-md, Lucide icons

### Section 4: Why EnviroConnect + Services
- 3-column feature cards with Lucide icons in Sage Wash circles
- Service tags: Cloud bg, Ocean Blue text, Mist border (Evergreen spec)
- GSAP scroll fade-ups

### Section 5: Stats (Devin-style staggered)
- Masonry-style varying-height cards
- Mix of Steel Blue bg (white text) + Cloud bg + one Moss Green gradient card
- GSAP counter animation on viewport entry

### Section 6: Vendor CTA + Footer
- Steel Blue bg, centered CTA with Moss Green pill button
- Footer: Steel Blue bg, 4-column layout, Moss Green top accent border

---

## 4. Directory & Vendor Profile Pages

### Directory Grid
- Cloud bg, search/filter bar with Evergreen input styling
- VendorCard: white surface, Mist border, shadow-md, hover → shadow-lg + border Slate Light
- Service tags: Cloud chip bg, Ocean Blue text
- Endorsement badges: Sage Wash bg, Moss Green text
- Star ratings: Moss Green stars

### Vendor Profile (detail page)
- No hero image banner (keep it clean)
- White surface card with company info, Mist border
- Tab navigation for sections (Upstream-style): Overview, Reviews, RFQs
- Contact info, services, certifications in structured card sections
- Action buttons (Endorse, Message, Schedule Meeting) in top-right cluster

---

## 5. Authenticated App Pages (Sidebar Layout)

### Dashboards (Vendor + Facility Manager)
- Sidebar layout with top bar
- Content area: Cloud bg
- Section cards: white surface, Mist border, Evergreen shadow-md
- Status badges: Evergreen status indicators (green/amber/red dots + wash backgrounds)
- RFQ/proposal/meeting lists: clean rows with subtle hover, Mist border dividers

### Messages Page
- Sidebar layout
- Conversation list (left pane) + Chat thread (right pane)
- Restyle with Evergreen: Mist borders, Cloud bg on list, white bg on chat

### Meetings Page
- Sidebar layout
- Tab navigation: Action Needed / Upcoming / Past
- MeetingCard: Evergreen card styling + status badges

### RFQ Pages (Board, Detail, New)
- Sidebar layout
- RFQ board: card grid with Evergreen styling
- Detail page: structured sections with tab nav
- New RFQ form: Evergreen input styling

### About Page
- Public layout (floating navbar + footer)
- Restyle with Evergreen colors/typography
- Keep FAQ accordion (framer-motion)

### Onboarding
- Centered card layout, Evergreen styling
- Minimal — just role selection + company input

---

## 6. Component Restyling Summary

| Component | Key Changes |
|-----------|-------------|
| Navbar | Split into FloatingNavbar (public) + Sidebar + TopBar (auth) |
| Footer | Evergreen colors, Moss Green top border |
| ScrollReveal | Keep for non-landing pages (framer-motion) |
| VendorCard | Evergreen card style, Lucide icons, new tag colors |
| RfqCard | Evergreen card style, status badges |
| MeetingCard | Evergreen card style, calendar link styling |
| EndorseButton | Moss Green accent |
| EndorsementBadge | Sage Wash bg, Moss Green text |
| StarRating | Moss Green stars |
| ReviewModal | Evergreen inputs, buttons |
| NotificationBell | Evergreen dropdown styling |
| ChatIcon | Match NotificationBell styling |
| PdfUpload | Evergreen drag-and-drop zone |
| MeetingRequestModal | Evergreen modal + inputs |
| TimeSlotPicker | Evergreen inputs + accent colors |
| Skeletons | Cloud/Mist pulse colors |
| ThemeToggle | Restyle for new palette |

---

## 7. Files Affected

### New Files
- `components/layout/FloatingNavbar.tsx` — public pages navbar
- `components/layout/Sidebar.tsx` — authenticated pages sidebar
- `components/layout/TopBar.tsx` — authenticated pages top bar
- `components/layout/AppShell.tsx` — sidebar + topbar wrapper
- `components/landing/HeroScroll.tsx` — GSAP hero section
- `components/landing/SplitCollapse.tsx` — GSAP split-screen section
- `components/landing/StatsGrid.tsx` — Devin-style staggered stats
- `components/landing/CustomCursor.tsx` — custom cursor component

### Modified Files (all existing pages + components)
- `app/globals.css` — complete rebuild of theme variables
- `app/layout.tsx` — conditional layout rendering
- `app/page.tsx` — complete rewrite with GSAP sections
- All 15 page files — Evergreen color/typography/spacing updates
- All 27 component files — Evergreen restyling

### New Dependencies
- `gsap` (with ScrollTrigger)
- `lucide-react`

### Removed
- Local font files can remain (fallback) but primary loading switches to Google Fonts
