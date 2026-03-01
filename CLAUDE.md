# EnviroConnect — Claude Code Context

## Project Overview
B2B vendor directory for PNW industrial facility managers to discover environmental compliance vendors. Vendors list their services, certifications, and service areas. Facility managers browse, filter, and save vendors.

**Tech Stack:**
- Frontend: Next.js 14 (App Router) + React 19 + Tailwind CSS v4
- Backend/Database: Convex (real-time, cloud-hosted)
- Auth: Clerk (roles: "vendor" | "facility_manager", JWT integration with Convex)
- Animations: framer-motion (scroll reveals, FAQ accordion)
- Deployment: Vercel (in progress — first deploy pending)

**Key Dependencies:** `@clerk/nextjs`, `convex`, `framer-motion`, `svix` (webhook verification)

## Architecture & Conventions

### Tailwind CSS v4 — CRITICAL
- Config lives in `app/globals.css` inside `@theme inline { }` block — **NOT** in `tailwind.config.ts`
- **Do NOT create `tailwind.config.ts`** — Tailwind v4 ignores it
- Custom colors: `--color-navy`, `--color-navy-light`, `--color-green`, `--color-green-light`, `--color-cream`, `--color-cream-dark`
- Custom font tokens: `--font-heading` (Science Gothic), `--font-body` (Electrolize)

### Dark Mode
- Implemented via `html.dark` class toggling (not `@media prefers-color-scheme`)
- `ThemeProvider` context manages state, persists to `localStorage`, falls back to system preference
- Dark mode CSS variable overrides in `html.dark { }` block in `globals.css`
- `<html>` tag has `suppressHydrationWarning` because dark class is set client-side

### Fonts
- **Science Gothic** — headings (h1-h6), applied via CSS rule in `globals.css`
- **Electrolize** — body text, applied via CSS rule in `globals.css`
- Both loaded as local `@font-face` from `public/fonts/` (.ttf files)

### Component Patterns
- Client components use `"use client"` directive
- Convex queries use `useQuery(api.module.function, args)` with `"skip"` for conditional loading
- All interactive pages are client components; static pages (footer, directory wrapper) are server components
- Shared layout: `Navbar` + `{children}` + `Footer` in `app/layout.tsx`

### Design System
- Primary: Navy `#1B2A4A` — nav, headers, primary CTAs
- Accent: Green `#2D5F2D` — buttons, tags, checkmarks
- Background: Cream `#F8F6F1` — replaces all `gray-50`/white backgrounds
- Borders: Cream dark `#EDE9E0` — replaces all `gray-200`/`gray-300` borders
- Cards: `hover:-translate-y-1 hover:shadow-md transition-all duration-200` (Cropzen-style lift)
- Dark mode: navy-based dark palette with brightened greens for contrast
- Scroll animations: `<ScrollReveal>` wrapper (framer-motion, fade-in + slide-up)
- Desktop-first, professional B2B aesthetic
- Hero: background image (`/images/hero-bg.jpg` — Mt. Rainier + Port of Tacoma) with navy gradient overlay

## Current Status

### Working (all built, build passes cleanly)
- Landing page: hero with bg image + overlay, How It Works, Why EnviroConnect, Services grid, Stats bar, Vendor CTA — all with scroll animations
- Vendor directory: search/filter/pagination, skeleton loaders
- Vendor profile pages: full detail view with save/unsave for facility managers
- About page: mission, founder card, contact form (mailto), FAQ accordion
- Auth: Clerk sign-up/sign-in, onboarding (role + company), role-based dashboard redirect
- Vendor dashboard: profile editor with checkboxes for services/certs/areas, publish toggle
- Facility manager dashboard: saved vendors grid
- Dark mode toggle: sun/moon in navbar, localStorage persistence
- Footer: 4-column layout on all pages (Directory, For Vendors, Company, Legal)
- Mobile: hamburger menu with slide-down panel
- Skeleton loaders on all loading states
- Cream palette + dark mode classes on all pages
- Pushed to GitHub: `paulhpeden2-gitinthecloud/enviroconnect`

### Not Yet Done
- Vercel deployment (user was on the deploy screen when session ended — config verified correct)
- Smoke test with live Convex backend (`npx convex dev` + `npm run dev` together)
- Production Convex deployment (currently using dev deployment)
- Clerk allowed origins not yet updated for Vercel URL

### Known Gotchas
- `middleware.ts` uses deprecated `middleware` file convention — Next.js 16 warns to use `proxy` instead. Not breaking, just a warning.
- Homebrew has permissions issue on this machine (`/opt/homebrew` not writable). Fix with `sudo chown -R blueenvironmental /opt/homebrew`.
- GitHub push requires personal access token (no `gh` CLI installed). Token should NOT be stored — generate fresh each time.
- `CONVEX_DEPLOYMENT` env var is for local dev only — do NOT add to Vercel.

## Next Steps

### Immediate (when resuming)
1. **Verify Vercel deployment succeeded** — user clicked Deploy at end of session
2. **Add Vercel URL to Clerk allowed origins** — Clerk Dashboard → Settings
3. **Smoke test** — run `npx convex dev` + `npm run dev` locally, test all user flows
4. **Iterate on design** — user wants further design refinements (unspecified — ask what they want)
5. **Add more features** — user mentioned wanting to start Phase 2 features (unspecified — ask priorities)

### Phase 2 Roadmap (from project-kickoff.md)
1. Seed 10-20 real vendor profiles
2. Trust networks (vendor-to-vendor referrals)
3. RFQ system (facilities post requests, vendors respond)
4. In-app messaging / DMs
5. Meeting scheduler with calendar integration
6. Payments (Polar or Stripe)
7. Email-to-referral
8. Reviews & ratings

## Key Files

- `app/globals.css` — Tailwind v4 theme config, @font-face declarations, dark mode variables. THE source of truth for colors/fonts.
- `app/page.tsx` — Landing page (6 sections with scroll animations, hero bg image)
- `app/about/page.tsx` — About page (mission, team, contact form, FAQ accordion)
- `app/layout.tsx` — Root layout with Navbar + Footer + Providers
- `app/providers.tsx` — ThemeProvider → ClerkProvider → ConvexProviderWithClerk
- `components/Navbar.tsx` — Responsive nav with hamburger menu, dark mode toggle, auth state
- `components/Footer.tsx` — 4-column footer shared across all pages
- `components/ScrollReveal.tsx` — framer-motion scroll animation wrapper
- `convex/schema.ts` — Database schema (users, vendorProfiles, savedVendors)
- `convex/http.ts` — Clerk webhook handler with svix verification
- `docs/plans/2026-02-28-design-refinements.md` — Implementation plan for the design work just completed

## Auth Flow
1. Sign up via Clerk → `/onboarding` (select role + enter company → writes to Convex `users` table)
2. Sign in → `/dashboard` → role-based redirect to `/dashboard/vendor` or `/dashboard/facility`
3. Clerk webhook syncs `user.updated` events to Convex via `convex/http.ts`

## Dev Commands
- Terminal 1: `npx convex dev` (keep running — watches and deploys Convex functions on save)
- Terminal 2: `npm run dev` (Next.js dev server on localhost:3000)
- Build: `npm run build` (production build, currently passes clean)

## GitHub
- Repo: `https://github.com/paulhpeden2-gitinthecloud/enviroconnect`
- Branch: `main` (all work on main, no feature branches yet)
- 16 commits as of end of session
