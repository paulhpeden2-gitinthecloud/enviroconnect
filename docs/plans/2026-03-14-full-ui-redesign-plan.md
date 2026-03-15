# Full UI Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the entire EnviroConnect UI using the Evergreen Design System, GSAP cinematic landing page, hybrid navigation (floating pill for public, sidebar for authenticated), and Lucide icons.

**Architecture:** Wave-based incremental approach. Each wave leaves the app in a building state. Wave 1 swaps foundations (colors, fonts, icons, CSS). Wave 2 rebuilds navigation. Wave 3 rebuilds the landing page with GSAP. Wave 4 restyles all remaining pages/components.

**Tech Stack:** Next.js 14, Tailwind CSS v4, GSAP + ScrollTrigger, framer-motion, Lucide React, Google Fonts (DM Sans, Source Sans 3, JetBrains Mono)

**Reference files:**
- Design system: `evergreen-design-system.md`
- Design doc: `docs/plans/2026-03-13-full-ui-redesign-design.md`
- GSAP scroll spec: `design_v2`

---

## Wave 1: Foundation (Colors, Fonts, Icons, CSS Variables)

### Task 1: Install new dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install gsap and lucide-react**

Run: `cd "/Users/blueenvironmental/Documents/ACTIVE WORK/industrial_network_app/enviroconnect" && npm install gsap lucide-react`

**Step 2: Verify installation**

Run: `cd "/Users/blueenvironmental/Documents/ACTIVE WORK/industrial_network_app/enviroconnect" && node -e "require('gsap'); require('lucide-react'); console.log('OK')"`

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add gsap and lucide-react dependencies"
```

---

### Task 2: Rebuild globals.css with Evergreen theme

**Files:**
- Modify: `app/globals.css`

**Step 1: Replace entire globals.css**

Replace the full file. Key changes:
- Remove `@font-face` declarations for Science Gothic and Electrolize
- Rebuild `@theme inline` block with all Evergreen CSS variables (colors, spacing, radius, shadows)
- Map Tailwind utility names: `primary` (Steel Blue), `primary-light` (Ocean Blue), `accent` (Moss Green), `accent-hover` (Moss Dark), `accent-surface` (Sage Wash), `cloud` (Cloud bg), `surface` (white), `mist` (border), `mist-hover` (border hover), `text-deep` (Deep Navy), `slate-custom` (Slate), `danger`, `warning`, `info`
- Keep `html.dark` block but update colors for new palette
- Update heading/body font rules to use new `--font-heading` (DM Sans) and `--font-body` (Source Sans 3)
- Add `--font-mono` (JetBrains Mono)

```css
@import "tailwindcss";

@theme inline {
  /* Core colors */
  --color-primary: #1C3144;
  --color-primary-hover: #152736;
  --color-primary-light: #2B4C6F;
  --color-accent: #4A7C59;
  --color-accent-hover: #3D6649;
  --color-accent-surface: #E8F0E3;
  --color-cloud: #F0F4F8;
  --color-surface: #FFFFFF;
  --color-text-deep: #0F1D2B;
  --color-slate-custom: #6E8CA0;
  --color-mist: #D5DDE5;
  --color-mist-hover: #B0C1CE;
  --color-focus-ring: #93C5FD;

  /* Semantic */
  --color-danger: #B91C1C;
  --color-danger-surface: #FEF2F2;
  --color-warning: #D97706;
  --color-warning-surface: #FFFBEB;
  --color-info: #2563EB;
  --color-info-surface: #EFF6FF;
  --color-success: #4A7C59;
  --color-success-surface: #E8F0E3;

  /* Legacy aliases (keep during migration to avoid breaking pages) */
  --color-navy: #1C3144;
  --color-navy-light: #2B4C6F;
  --color-green: #4A7C59;
  --color-green-light: #3D6649;
  --color-cream: #F0F4F8;
  --color-cream-dark: #D5DDE5;

  /* Fonts */
  --font-heading: "DM Sans", system-ui, sans-serif;
  --font-body: "Source Sans 3", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(15, 29, 43, 0.05);
  --shadow-md: 0 2px 8px rgba(15, 29, 43, 0.08);
  --shadow-lg: 0 4px 16px rgba(15, 29, 43, 0.10);
  --shadow-xl: 0 8px 32px rgba(15, 29, 43, 0.12);
}

/* Dark mode */
html.dark {
  --color-primary: #0F1A2E;
  --color-primary-light: #1C3144;
  --color-accent: #5AA96A;
  --color-accent-hover: #4A9E4A;
  --color-accent-surface: #1A2E1A;
  --color-cloud: #111827;
  --color-surface: #1F2937;
  --color-text-deep: #E8E8E8;
  --color-slate-custom: #94A3B8;
  --color-mist: #374151;
  --color-mist-hover: #4B5563;

  /* Legacy aliases */
  --color-navy: #0F1A2E;
  --color-navy-light: #1C3144;
  --color-green: #5AA96A;
  --color-green-light: #4A9E4A;
  --color-cream: #111827;
  --color-cream-dark: #374151;
}

body {
  background: var(--color-cloud);
  color: var(--color-text-deep);
  font-family: var(--font-body);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}
```

**Step 2: Verify build**

Run: `cd "/Users/blueenvironmental/Documents/ACTIVE WORK/industrial_network_app/enviroconnect" && npm run build`
Expected: Build passes (legacy aliases keep existing classes working)

**Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style: rebuild globals.css with Evergreen design system"
```

---

### Task 3: Add Google Fonts to layout.tsx

**Files:**
- Modify: `app/layout.tsx`

**Step 1: Add Google Fonts link tags**

Add `<link>` tags in the `<head>` for DM Sans, Source Sans 3, and JetBrains Mono. In Next.js App Router, add these inside `<html><head>` or use Next.js `metadata` approach.

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@600;700&family=Source+Sans+3:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>
          <Navbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "style: add Google Fonts (DM Sans, Source Sans 3, JetBrains Mono)"
```

---

## Wave 2: Navigation — Hybrid Layout

### Task 4: Create FloatingNavbar component

**Files:**
- Create: `components/layout/FloatingNavbar.tsx`

**Step 1: Build the floating pill navbar**

Client component with glassmorphism effect. Features:
- `fixed top-4 left-1/2 -translate-x-1/2 z-50` positioning
- `max-w-5xl w-[95%]` container, `rounded-full`
- `backdrop-blur-md bg-primary/80 border border-white/10` glassmorphism
- Left: "EnviroConnect" wordmark link (DM Sans 700, white)
- Center: nav links (Find Vendors, RFQs, About) with active dot indicator using `usePathname()`
- Right: conditional auth — Sign In (ghost) + Sign Up (Moss Green pill) OR Dashboard link + Sign Out
- Opacity increases on scroll (listen to `window.scrollY`)
- Mobile: hamburger → slide-down panel (not full sheet)
- Import icons from `lucide-react`: `Menu`, `X`

**Step 2: Verify build**

Run: `npm run build`
Expected: PASS (component exists but isn't used yet)

**Step 3: Commit**

```bash
git add components/layout/FloatingNavbar.tsx
git commit -m "feat: add FloatingNavbar component with glassmorphism"
```

---

### Task 5: Create Sidebar component

**Files:**
- Create: `components/layout/Sidebar.tsx`

**Step 1: Build the sidebar nav**

Client component. Features:
- 240px wide, `bg-surface border-r border-mist`, full height `h-screen fixed left-0 top-0`
- Logo at top: "EnviroConnect" wordmark
- Nav items with Lucide icons: `LayoutDashboard` (Dashboard), `Search` (Directory), `FileText` (RFQs), `MessageSquare` (Messages), `Calendar` (Meetings)
- Active state: `bg-accent-surface text-accent border-l-3 border-accent`
- Use `usePathname()` to determine active
- Collapsed mode: below `lg` breakpoint, show 64px icons-only sidebar
- Mobile (below `md`): hide sidebar entirely (bottom tab bar handles it)
- ThemeToggle at bottom of sidebar

**Step 2: Verify build**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add components/layout/Sidebar.tsx
git commit -m "feat: add Sidebar component for authenticated layout"
```

---

### Task 6: Create TopBar component

**Files:**
- Create: `components/layout/TopBar.tsx`

**Step 1: Build the top bar**

Client component. Features:
- `h-14 bg-surface border-b border-mist` sticky at top
- Left: page title (passed as prop or derived from pathname)
- Right: `NotificationBell`, `ChatIcon`, user avatar (Clerk), `ThemeToggle`
- Mobile hamburger to toggle sidebar visibility

**Step 2: Verify build**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add components/layout/TopBar.tsx
git commit -m "feat: add TopBar component for authenticated layout"
```

---

### Task 7: Create AppShell wrapper

**Files:**
- Create: `components/layout/AppShell.tsx`

**Step 1: Build the shell that wraps sidebar + topbar + content**

Client component combining Sidebar + TopBar + children:
```
[Sidebar 240px][TopBar + Content area]
```
- Content area: `ml-60 lg:ml-60 md:ml-16` (adjusts for sidebar width)
- `min-h-screen bg-cloud`
- Mobile: no margin (sidebar becomes bottom tabs)
- Bottom tab bar component for mobile (5 icons matching sidebar)

**Step 2: Verify build**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add components/layout/AppShell.tsx
git commit -m "feat: add AppShell layout wrapper (sidebar + topbar)"
```

---

### Task 8: Create conditional layout in layout.tsx

**Files:**
- Modify: `app/layout.tsx`
- Create: `components/layout/LayoutSwitch.tsx`

**Step 1: Create LayoutSwitch component**

Client component that reads auth state + pathname to decide layout:
- Public routes (`/`, `/about`, `/directory`, `/directory/[id]`, `/sign-in`, `/sign-up`): FloatingNavbar + children + Footer
- Authenticated app routes (`/dashboard/**`, `/messages`, `/meetings`, `/rfq/**`, `/onboarding`): AppShell wrapping children (no footer)
- Use `useUser()` from Clerk + `usePathname()` to determine which layout

**Step 2: Update layout.tsx**

Replace the static Navbar/Footer with `<LayoutSwitch>{children}</LayoutSwitch>` inside Providers.

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@600;700&family=Source+Sans+3:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>
          <LayoutSwitch>{children}</LayoutSwitch>
        </Providers>
      </body>
    </html>
  );
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: PASS — all pages render with correct layout

**Step 4: Commit**

```bash
git add components/layout/LayoutSwitch.tsx app/layout.tsx
git commit -m "feat: conditional layout — floating nav (public) vs sidebar (auth)"
```

---

## Wave 3: Landing Page — GSAP Cinematic Scroll

### Task 9: Create CustomCursor component

**Files:**
- Create: `components/landing/CustomCursor.tsx`

**Step 1: Build custom cursor**

Client component:
- `cursor: none` on body when mounted (restore on unmount)
- Semi-transparent white circle (`w-8 h-8 rounded-full border border-white/50 bg-white/10`)
- Smooth follow using GSAP `quickTo` on mousemove
- Scale up (1.5x) when hovering `a`, `button` elements
- Desktop only: hide on touch devices (check `window.matchMedia('(hover: hover)')`)
- `pointer-events-none` and `fixed z-[9999]`

**Step 2: Commit**

```bash
git add components/landing/CustomCursor.tsx
git commit -m "feat: add custom cursor component for landing page"
```

---

### Task 10: Create HeroScroll component

**Files:**
- Create: `components/landing/HeroScroll.tsx`

**Step 1: Build the GSAP hero scroll section**

Client component. Per `design_v2` spec — Section 1:
- Full viewport `100vh`, fixed background image (Mt. Rainier — use `/images/hero-bg.jpg`)
- FloatingNavbar overlays (already handled by layout)
- Text container positioned over sky area, initially `translateY(-100%)`
- GSAP ScrollTrigger `scrub: true` slides text down into viewport on scroll
- Content:
  - Main: "ENVIROCONNECT" (centered, uppercase, DM Sans 700, very large `text-6xl md:text-8xl`, white with optional gradient on key word)
  - Left column: tagline text
  - Right column: "Browse Vendors" (Moss Green pill) + "Get Started" (ghost outline pill) CTAs
- Use `useRef` + `useEffect` for GSAP setup, cleanup on unmount
- `gsap.registerPlugin(ScrollTrigger)` at top

**Step 2: Verify build**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add components/landing/HeroScroll.tsx
git commit -m "feat: add GSAP HeroScroll landing section"
```

---

### Task 11: Create SplitCollapse component

**Files:**
- Create: `components/landing/SplitCollapse.tsx`

**Step 1: Build the split-screen collapse section**

Client component. Per `design_v2` spec — Section 2:
- 50/50 split layout, `min-h-screen`
- Left (Cloud bg): "Built for the" (subheader) → "Pacific Northwest" (extra-large bold) → body paragraph
- Right (Mt. Rainier image bg): giant white text "25+" with "Pre-vetted Vendors"
- ScrollTrigger `pin: true`, `scrub: true`:
  - Left column translates right and shrinks to narrow strip (content clips via `overflow: hidden`)
  - Right image expands leftward to fill viewport
  - Number counter scrubs 25 → 8 using GSAP `snap` or `onUpdate` callback
  - Text morphs from "Pre-vetted Vendors" to "Service Categories"
  - Compass/leaf SVG icon fades in below number
- Use refs for all animated elements

**Step 2: Verify build**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add components/landing/SplitCollapse.tsx
git commit -m "feat: add GSAP SplitCollapse landing section"
```

---

### Task 12: Create StatsGrid component

**Files:**
- Create: `components/landing/StatsGrid.tsx`

**Step 1: Build Devin-style staggered stats grid**

Client component:
- Masonry-ish layout with cards at varying heights using CSS grid with `grid-auto-rows`
- Stats: "8+" Service Categories, "PNW-Wide" Coverage, "Free" For Facility Managers, "Direct" No Middlemen, "25+" Pre-vetted Vendors
- Card variants:
  - Steel Blue bg + white text (primary)
  - Cloud bg + Deep Navy text (light)
  - Moss Green gradient bg + white text (accent)
- GSAP counter animation: numbers count up from 0 when card enters viewport
- Each card: large bold number/value + small descriptive text + category label at bottom
- Stagger fade-in on scroll

**Step 2: Commit**

```bash
git add components/landing/StatsGrid.tsx
git commit -m "feat: add Devin-style StatsGrid landing section"
```

---

### Task 13: Rebuild landing page (app/page.tsx)

**Files:**
- Modify: `app/page.tsx`

**Step 1: Rewrite the landing page**

Compose the new landing page from the GSAP sections + restyled content sections:

```tsx
"use client";
import { CustomCursor } from "@/components/landing/CustomCursor";
import { HeroScroll } from "@/components/landing/HeroScroll";
import { SplitCollapse } from "@/components/landing/SplitCollapse";
import { StatsGrid } from "@/components/landing/StatsGrid";
import { ScrollReveal } from "@/components/layout/ScrollReveal";
import Link from "next/link";
// + Lucide icons for features
```

Sections in order:
1. `<CustomCursor />` (desktop only)
2. `<HeroScroll />` — GSAP hero
3. Trust bar — horizontal stats strip (Cloud bg)
4. `<SplitCollapse />` — GSAP split collapse
5. How It Works — 4 cards, Evergreen styling, ScrollReveal
6. Why EnviroConnect — 3-col feature cards with Lucide icons in Sage Wash circles
7. Services Covered — tag grid with Evergreen tag styling
8. `<StatsGrid />` — Devin staggered stats
9. Vendor CTA — Steel Blue bg, Moss Green pill CTA
10. (Footer rendered by layout)

All feature icons replaced with Lucide imports: `MapPin`, `Shield`, `CheckCircle`, `Users`, `FileText`.

**Step 2: Verify build**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: rebuild landing page with GSAP cinematic scroll"
```

---

## Wave 4: Restyle All Remaining Pages & Components

### Task 14: Restyle Footer

**Files:**
- Modify: `components/layout/Footer.tsx`

**Step 1: Update Footer to Evergreen palette**

- `bg-primary` (Steel Blue) instead of `bg-navy`
- `border-t-2 border-accent` (Moss Green top border)
- Text colors: white headings, `text-slate-custom` for links, hover white
- Copyright: `text-slate-custom`
- Keep same 4-column structure

**Step 2: Commit**

```bash
git add components/layout/Footer.tsx
git commit -m "style: restyle Footer with Evergreen design system"
```

---

### Task 15: Restyle VendorCard

**Files:**
- Modify: `components/vendor/VendorCard.tsx`

**Step 1: Update to Evergreen card pattern**

- `bg-surface border border-mist rounded-lg` (8px radius)
- `shadow-md` default, hover: `shadow-lg border-mist-hover`
- Service tags: `bg-cloud text-primary-light border border-mist` (Evergreen service category tag)
- Endorsement badge: already uses EndorsementBadge (update that separately)
- Star rating: Moss Green stars (update StarRating)
- Company name: `text-text-deep` (DM Sans via heading class)
- Area text: `text-slate-custom`
- Description: `text-text-deep` at body-small size

**Step 2: Commit**

```bash
git add components/vendor/VendorCard.tsx
git commit -m "style: restyle VendorCard with Evergreen design system"
```

---

### Task 16: Restyle Directory page

**Files:**
- Modify: `app/directory/DirectoryClient.tsx`
- Modify: `app/directory/page.tsx`

**Step 1: Update DirectoryClient**

- Search/filter bar: `bg-cloud border-b border-mist`
- Inputs: `border-mist rounded-md focus:border-primary-light focus:ring-2 focus:ring-focus-ring/40` (Evergreen input spec)
- Clear filters: `text-accent hover:text-accent-hover`
- Pagination: `border-mist` buttons, `hover:bg-cloud`
- Count text: `text-slate-custom`

**Step 2: Update directory page.tsx header if any**

**Step 3: Commit**

```bash
git add app/directory/DirectoryClient.tsx app/directory/page.tsx
git commit -m "style: restyle Directory page with Evergreen design system"
```

---

### Task 17: Restyle Vendor Profile page

**Files:**
- Modify: `app/directory/[id]/page.tsx`

**Step 1: Update vendor profile detail page**

- Card surfaces: `bg-surface border border-mist rounded-lg shadow-md`
- Section headings: `text-text-deep` DM Sans
- Service tags: Evergreen service category tag style
- Certification badges: `bg-accent-surface text-accent` (Evergreen verified badge)
- Action buttons: Moss Green primary, ghost secondary
- Contact info labels: `text-slate-custom`
- Replace inline SVG icons with Lucide imports

**Step 2: Commit**

```bash
git add app/directory/\\[id\\]/page.tsx
git commit -m "style: restyle vendor profile page with Evergreen design system"
```

---

### Task 18: Restyle About page

**Files:**
- Modify: `app/about/page.tsx`

**Step 1: Update About page to Evergreen**

- Hero section: `bg-cloud` instead of `bg-cream`
- Headings: `text-text-deep`
- Body: `text-slate-custom` for secondary text
- Team card: `bg-surface border-mist rounded-lg shadow-md`
- Avatar circle: `bg-cloud`
- Contact form inputs: Evergreen input spec
- Submit button: `bg-accent hover:bg-accent-hover text-white rounded-lg`
- FAQ accordion: `border-mist`, question text `text-text-deep`, answer `text-slate-custom`
- Replace inline SVGs (ChevronIcon, UserAvatarIcon) with Lucide (`ChevronDown`, `User`)

**Step 2: Commit**

```bash
git add app/about/page.tsx
git commit -m "style: restyle About page with Evergreen design system"
```

---

### Task 19: Restyle Vendor Dashboard

**Files:**
- Modify: `app/dashboard/vendor/page.tsx`
- Modify: `app/dashboard/vendor/ProfileForm.tsx` (if exists)

**Step 1: Update vendor dashboard**

- Remove `bg-navy` header banner — in sidebar layout the TopBar handles the page title
- Content: `bg-cloud` background
- All cards: `bg-surface border-mist rounded-lg shadow-md p-6`
- Status badges: Evergreen status indicators (green/amber/red)
- Publish button: `bg-accent` primary, unpublish as secondary
- RFQ match cards, proposal cards: Evergreen card + hover
- Skeleton loaders: `bg-cloud` / `bg-mist` pulse

**Step 2: If ProfileForm exists, restyle inputs to Evergreen spec**

**Step 3: Commit**

```bash
git add app/dashboard/vendor/
git commit -m "style: restyle Vendor Dashboard with Evergreen design system"
```

---

### Task 20: Restyle Facility Manager Dashboard

**Files:**
- Modify: `app/dashboard/facility/page.tsx`

**Step 1: Update FM dashboard**

Same pattern as vendor dashboard:
- Remove navy banner, use sidebar layout
- Cards: Evergreen surface + mist border
- Saved vendors, My RFQs, Meetings sections

**Step 2: Commit**

```bash
git add app/dashboard/facility/page.tsx
git commit -m "style: restyle Facility Manager Dashboard with Evergreen design system"
```

---

### Task 21: Restyle Dashboard router page

**Files:**
- Modify: `app/dashboard/page.tsx`

**Step 1: Update the role-redirect page**

- Loading state: Evergreen skeleton on `bg-cloud`

**Step 2: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "style: restyle Dashboard router with Evergreen design system"
```

---

### Task 22: Restyle RFQ pages (board, new, detail)

**Files:**
- Modify: `app/rfq/page.tsx`
- Modify: `app/rfq/new/page.tsx`
- Modify: `app/rfq/[id]/page.tsx`
- Modify: `components/rfq/RfqCard.tsx`
- Modify: `components/rfq/SkeletonRfq.tsx`

**Step 1: Update RfqCard**

- Evergreen card styling
- Status badges: Evergreen status indicators
- Service tags: Evergreen service category tags

**Step 2: Update RFQ board page**

- `bg-cloud`, Evergreen filter bar, card grid

**Step 3: Update RFQ new page**

- Evergreen form inputs, labels, buttons

**Step 4: Update RFQ detail page**

- Evergreen cards, badges, proposal section

**Step 5: Update SkeletonRfq**

- `bg-cloud` / `bg-mist` pulse colors

**Step 6: Commit**

```bash
git add app/rfq/ components/rfq/
git commit -m "style: restyle RFQ pages and components with Evergreen design system"
```

---

### Task 23: Restyle Messages page and components

**Files:**
- Modify: `app/messages/page.tsx`
- Modify: `components/messaging/ConversationList.tsx`
- Modify: `components/messaging/ChatThread.tsx`
- Modify: `components/messaging/ChatInput.tsx`
- Modify: `components/messaging/ChatIcon.tsx`
- Modify: `components/messaging/NewMessageModal.tsx`

**Step 1: Update all messaging components**

- ConversationList: `bg-surface border-r border-mist`, active conversation `bg-cloud`
- ChatThread: message bubbles — own messages `bg-accent text-white`, other `bg-cloud text-text-deep`
- ChatInput: Evergreen input spec, send button `bg-accent`
- ChatIcon: match notification bell styling with Evergreen colors
- NewMessageModal: Evergreen modal (surface bg, mist border, shadow-lg)
- Messages page: layout adjustments for sidebar context

**Step 2: Commit**

```bash
git add app/messages/ components/messaging/
git commit -m "style: restyle Messages page and components with Evergreen design system"
```

---

### Task 24: Restyle Meetings page and components

**Files:**
- Modify: `app/meetings/page.tsx`
- Modify: `components/meetings/MeetingCard.tsx`
- Modify: `components/meetings/MeetingRequestModal.tsx`
- Modify: `components/meetings/CalendarLinks.tsx`
- Modify: `components/meetings/TimeSlotPicker.tsx`

**Step 1: Update all meeting components**

- MeetingCard: Evergreen card, status badges (confirmed=green, pending=amber, declined=danger)
- MeetingRequestModal: Evergreen modal + inputs
- CalendarLinks: Evergreen ghost buttons
- TimeSlotPicker: Evergreen inputs
- Meetings page: tab navigation with Evergreen active indicator (Moss Green bottom border)

**Step 2: Commit**

```bash
git add app/meetings/ components/meetings/
git commit -m "style: restyle Meetings page and components with Evergreen design system"
```

---

### Task 25: Restyle shared components

**Files:**
- Modify: `components/shared/NotificationBell.tsx`
- Modify: `components/shared/ThemeToggle.tsx`
- Modify: `components/shared/PdfUpload.tsx`
- Modify: `components/shared/PdfPreviewModal.tsx`
- Modify: `components/shared/UserSearch.tsx`
- Modify: `components/shared/SkeletonCard.tsx`
- Modify: `components/shared/SkeletonProfile.tsx`

**Step 1: Update all shared components**

- NotificationBell: Evergreen dropdown (surface bg, mist border, shadow-lg), unread badge `bg-danger`
- ThemeToggle: Evergreen button styling, Lucide `Sun`/`Moon` icons
- PdfUpload: Evergreen drag zone (`border-2 border-dashed border-mist hover:border-accent`)
- PdfPreviewModal: Evergreen modal
- UserSearch: Evergreen input + dropdown
- SkeletonCard: `bg-cloud` / `bg-mist` animated pulse
- SkeletonProfile: same

**Step 2: Commit**

```bash
git add components/shared/
git commit -m "style: restyle shared components with Evergreen design system"
```

---

### Task 26: Restyle endorsement and review components

**Files:**
- Modify: `components/endorsements/EndorseButton.tsx`
- Modify: `components/endorsements/EndorsementBadge.tsx`
- Modify: `components/endorsements/EndorsersModal.tsx`
- Modify: `components/reviews/StarRating.tsx`
- Modify: `components/reviews/ReviewModal.tsx`

**Step 1: Update endorsement components**

- EndorseButton: `bg-accent hover:bg-accent-hover text-white` when endorsed, ghost when not
- EndorsementBadge: `bg-accent-surface text-accent` (Sage Wash + Moss Green per Evergreen verified badge)
- EndorsersModal: Evergreen modal

**Step 2: Update review components**

- StarRating: Moss Green (`text-accent`) filled stars, `text-mist` empty stars
- ReviewModal: Evergreen modal + inputs + buttons

**Step 3: Commit**

```bash
git add components/endorsements/ components/reviews/
git commit -m "style: restyle endorsement and review components with Evergreen design system"
```

---

### Task 27: Restyle Onboarding page

**Files:**
- Modify: `app/onboarding/page.tsx`

**Step 1: Update onboarding**

- Centered card on Cloud bg
- Card: `bg-surface border-mist rounded-xl shadow-lg p-8`
- Inputs: Evergreen input spec
- Role selection buttons: Evergreen primary/secondary
- Submit: `bg-accent hover:bg-accent-hover`

**Step 2: Commit**

```bash
git add app/onboarding/page.tsx
git commit -m "style: restyle Onboarding page with Evergreen design system"
```

---

### Task 28: Clean up old Navbar, verify full build

**Files:**
- Modify: `components/layout/Navbar.tsx` (keep file but mark deprecated, or remove if LayoutSwitch fully replaces it)

**Step 1: Remove old Navbar import from layout.tsx if not already done**

The LayoutSwitch should handle all navigation now. Verify Navbar.tsx is no longer directly imported in layout.tsx.

**Step 2: Full build verification**

Run: `npm run build`
Expected: Clean pass, no errors

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: clean up old navbar, verify full build passes"
```

---

### Task 29: Final commit and push

**Step 1: Verify git status**

Run: `git status`
Expected: clean working tree

**Step 2: Push to deploy**

Run: `git push`
Expected: pushes to GitHub → Vercel auto-deploys

---

## Execution Notes

- **Wave 1 (Tasks 1-3):** Foundation. Safe, non-breaking due to legacy color aliases.
- **Wave 2 (Tasks 4-8):** Navigation. The LayoutSwitch is the critical piece — test thoroughly.
- **Wave 3 (Tasks 9-13):** Landing page. Standalone GSAP work, doesn't affect other pages.
- **Wave 4 (Tasks 14-28):** Restyling. Can be parallelized — components are independent.
- **Task 29:** Final push.

Total: 29 tasks across 4 waves.
