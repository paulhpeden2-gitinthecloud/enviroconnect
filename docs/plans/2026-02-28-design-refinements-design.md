# EnviroConnect Design Refinements

**Date:** 2026-02-28
**Approach:** All-at-once (single feature branch)
**Reference:** Cropzen Webflow template (spacious layout, scroll animations, card lift effects)

---

## 1. Design System Changes

### Fonts
- **Science Gothic** (local @font-face) — h1, h2, h3, hero text, section titles. Bold/semi-bold weights.
- **Electrolize** (local @font-face) — body text, nav links, card descriptions, form labels, buttons.
- Load from `/public/fonts/` as .ttf files.

### Color Palette — Light Mode
| Token | Hex | Usage |
|---|---|---|
| `--color-navy` | `#1B2A4A` | Primary — headers, nav bg, CTAs |
| `--color-navy-light` | `#243759` | Hover states, secondary surfaces |
| `--color-green` | `#2D5F2D` | Accent — buttons, tags, checkmarks |
| `--color-green-light` | `#3a7a3a` | Hover states for green elements |
| `--color-cream` | `#F8F6F1` | Page backgrounds (replaces gray-50/white) |
| `--color-cream-dark` | `#EDE9E0` | Card borders, dividers |

### Color Palette — Dark Mode
| Token | Hex | Usage |
|---|---|---|
| `--color-navy` | `#0F1A2E` | Deep bg |
| `--color-navy-light` | `#1B2A4A` | Card/surface bg |
| `--color-green` | `#4A9E4A` | Brightened for contrast |
| `--color-green-light` | `#5CB85C` | Hover states |
| `--color-cream` | `#1A1A1A` | Page background |
| `--color-cream-dark` | `#2A2A2A` | Borders, dividers |
| Text | `#E8E8E8` | Body text on dark |

### Dark Mode Toggle
- Sun/moon icon button in the navbar (right side, between nav links and auth)
- Stores preference in `localStorage`, falls back to `prefers-color-scheme` on first visit
- Toggles `dark` class on `<html>`, CSS variables swap via `html.dark { }` block

### Spacing
- Section vertical padding: py-24 (96px) on major sections
- Generous internal card padding (p-8)

---

## 2. Landing Page Redesign

### Hero Section
- **Background image**: `s_donald-travel-5367226_1920.jpg` (Mt. Rainier + Port of Tacoma) — `bg-cover bg-center`
- Navy gradient overlay (`navy/80` to `navy/60`) for text readability
- Science Gothic h1 at ~48-56px: "Find Environmental Compliance Vendors You Can Trust"
- Electrolize subtitle
- Two CTAs: "Browse Vendors" (green solid) + "List Your Services" (outlined white)
- Padding: py-28 to py-32
- Thin green accent line above heading

### How It Works (3-step)
- Cream background
- Cards with left-aligned green accent bar (replaces faded "01" number)
- Step number as small green pill badge above title
- Larger cards with more internal padding

### "Why EnviroConnect" Section (NEW)
- 4 feature cards in 2x2 grid:
  - PNW-Focused (map pin icon)
  - Pre-Vetted Vendors (shield icon)
  - Compliance-First (checkmark icon)
  - Direct Connections (handshake icon)
- Each: SVG icon, Science Gothic heading, Electrolize body
- Cream-dark border, subtle shadow, hover lift

### Services Grid
- 4-column grid of service categories
- Cards with small icon prefix and cream background
- Hover: border shifts to green, slight translateY lift

### Value Stats Bar (NEW)
- Horizontal strip, navy background
- Items: "8 Service Categories" / "PNW-Wide Coverage" / "Free for Facility Managers" / "No Middlemen"
- Science Gothic keywords, Electrolize descriptors
- All factual, no fake counts

### Vendor CTA Section
- Existing "Are You a Vendor?" block with upgraded padding
- Second line of supporting text about free listing

### Scroll Animations
- `framer-motion` — each section fades in + slides up 20px on viewport entry
- Staggered children on card grids (100ms delay between cards)

---

## 3. Footer Component

Multi-column layout (shared across all pages via layout.tsx):

```
ENVIROCONNECT        Directory       Company       Legal
tagline              Browse All      About         Privacy
                     By Service      Contact       Terms
                     By Region       FAQ
contact email
                     For Vendors
                     Get Listed
                     Vendor Dashboard
                     How It Works
---
(c) 2026 EnviroConnect. All rights reserved.
```

- Navy background, cream/gray text
- Science Gothic brand name, Electrolize links
- 4-column grid on desktop, stacks on mobile
- Thin green accent line at top of footer

---

## 4. About Page (`/about`)

### Mission Section
- Hero-style banner with cream background
- Science Gothic heading: "Connecting the Pacific Northwest's Environmental Industry"
- 2-3 paragraphs about the problem and solution
- Fade-in scroll animation

### Founder/Team Section
- Card layout — placeholder for photo, name, title, bio
- Single founder card for now (extensible for team)
- Consistent card styling with cream-dark border

### Contact Form
- Fields: Name, Email, Subject (dropdown: General Inquiry, Partnerships, Support, Feedback), Message
- Green "Send Message" CTA
- MVP: opens mailto: link with fields pre-filled (no backend)

### FAQ Accordion
- 5-6 starter questions:
  1. What is EnviroConnect?
  2. Is it free to use?
  3. How do I list my company?
  4. What regions do you cover?
  5. How are vendors vetted?
  6. How do I contact a vendor?
- Chevron icon rotates on expand/collapse
- framer-motion for smooth expand animation

---

## 5. Skeleton Loaders

| Location | Skeleton |
|---|---|
| Directory grid | 6 ghost cards (title bar, description lines, tag pills) |
| Vendor profile page | Left: heading bar, paragraph lines, tag rows. Right: contact card outline |
| Dashboard redirect | Thin progress bar at top |
| Facility saved vendors | 3 ghost cards |
| Vendor dashboard | Header bar + form section outlines |

Implementation: `bg-cream-dark animate-pulse rounded` divs. No extra library.

---

## 6. UI Polish

- All cards: `hover:-translate-y-1 hover:shadow-md transition-all duration-200`
- Directory filter bar: cream background
- Pagination: navy outline buttons, green active state
- Mobile navbar: hamburger menu with slide-out panel

---

## Dependencies
- `framer-motion` — scroll animations, FAQ accordion

## Assets to Move into Project
- `s_donald-travel-5367226_1920.jpg` → `public/images/hero-bg.jpg`
- `Science_Gothic.zip` → extract select weights to `public/fonts/`
- `Electrolize.zip` → extract to `public/fonts/`
