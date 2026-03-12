# EnviroConnect — Claude Code Context

## Project Overview
B2B vendor directory for PNW industrial facility managers to discover environmental compliance vendors. Vendors list their services, certifications, and service areas. Facility managers browse, filter, and save vendors.

**Tech Stack:**
- Frontend: Next.js 14 (App Router) + React 19 + Tailwind CSS v4
- Backend/Database: Convex (real-time, cloud-hosted)
- Auth: Clerk (roles: "vendor" | "facility_manager", JWT integration with Convex)
- Animations: framer-motion (scroll reveals, FAQ accordion)
- Deployment: Vercel (live at https://enviroconnect.vercel.app)

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

### Project Structure
- **Feature-domain colocation** — components and Convex backend grouped by domain
- `components/layout/` — Navbar, Footer, ScrollReveal
- `components/shared/` — ThemeProvider, ThemeToggle, NotificationBell, UserSearch, PdfUpload, PdfPreviewModal, skeletons
- `components/vendor/`, `components/rfq/`, `components/messaging/`, `components/meetings/`, `components/endorsements/` — domain-specific components
- `convex/` root — `schema.ts`, `auth.config.ts`, `http.ts`
- `convex/users/`, `convex/vendors/`, `convex/rfq/`, `convex/meetings/`, `convex/messaging/`, `convex/endorsements/` — each with `queries.ts` + `mutations.ts`
- `docs/plans/` — active implementation plans, `docs/design/` — active design docs, `docs/archive/` — completed docs, `docs/reference/` — project reference materials

### Component Patterns
- Client components use `"use client"` directive
- Convex queries use `useQuery(api.domain.queries.function, args)` or `useMutation(api.domain.mutations.function)` with `"skip"` for conditional loading
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
- Landing page: hero, How It Works (4 steps incl RFQ), Why EnviroConnect (5 features), Services grid, Stats bar, CTAs
- Vendor directory: search/filter/pagination, skeleton loaders
- Vendor profile pages: contact info gated behind auth; save/unsave; Request Quote button; Endorse; Message; Schedule Meeting
- About page: mission, founder card, contact form (mailto), FAQ accordion
- Auth: Clerk sign-up/sign-in, onboarding (role + company), role-based dashboard redirect
- Vendor dashboard: profile editor, publish toggle, RFQ Matches, My Proposals, Upcoming Meetings
- Facility manager dashboard: saved vendors, My RFQs, Upcoming Meetings
- **RFQ system**: board (/rfq), create form (/rfq/new), detail page (/rfq/[id]), proposal submission/review, notifications
- **Notifications**: bell icon in navbar, unread count badge, dropdown with mark-read (routes to /rfq or /meetings)
- **Proposal attachments**: PDF upload (up to 5 files, drag-and-drop), in-browser preview modal, download
- **Trust networks**: one-directional endorsements (peer + client types), count badges on profiles + cards, endorser modal
- **In-app messaging**: DMs + group chats, PDF attachments, dedicated /messages page, chat icon in navbar
- **Meeting scheduler**: request meetings with 3 time slots, accept/counter-propose/decline, calendar links (Google/Outlook/.ics), /meetings page with tabs
- Convex file storage for PDF attachments (`generateUploadUrl` mutation + `ctx.storage.getUrl()` in queries)
- Dark mode, mobile hamburger, skeleton loaders, cream palette on all pages
- Deployed: GitHub + Vercel + Convex (auto-deploy via `CONVEX_DEPLOY_KEY`)

### Known Gotchas
- `middleware.ts` uses deprecated `middleware` file convention — Next.js 16 warns to use `proxy` instead. Not breaking, just a warning.
- **Convex auto-deploy is now configured.** Vercel build command: `npx convex deploy --cmd "npm run build" --yes`. Both Convex functions and Next.js build deploy together on push.
- `CONVEX_DEPLOYMENT` env var is for local dev only — do NOT add to Vercel.
- GitHub push via HTTPS works (credentials cached).
- Convex upload response returns `storageId` as `string` — must type as `Id<"_storage">` when passing to mutations.
- JSX gotcha: `&&` conditional rendering with multiple sibling elements must wrap in `<>...</>` fragment or Turbopack fails with "Expected '</', got 'ident'".

## Next Steps

### Immediate (when resuming)
1. **Seed vendor data** — user to provide vendor info; write seed script to bulk-insert
2. **Smoke test** meeting scheduler on live site
3. **Full UI redesign** — user iterating in Figma (file: Q4RJ2EIeeN5hkrV9oUKISN), implement when shared

### Phase 2 Roadmap
1. ~~RFQ system~~ (DONE)
2. ~~Proposal attachments~~ (DONE)
3. ~~Trust networks~~ (DONE)
4. ~~In-app messaging~~ (DONE)
5. ~~Meeting scheduler~~ (DONE)
6. **Seed vendor data** (next — user to provide data)
7. **Full UI redesign** (user iterating in Figma)
8. Payments (deferred — waiting for real users)
9. Email-to-referral
10. Reviews & ratings

## Key Files

### App
- `app/globals.css` — Tailwind v4 theme config, @font-face declarations, dark mode variables. THE source of truth for colors/fonts.
- `app/page.tsx` — Landing page (6 sections with scroll animations, hero bg image)
- `app/about/page.tsx` — About page (mission, team, contact form, FAQ accordion)
- `app/layout.tsx` — Root layout with Navbar + Footer + Providers
- `app/providers.tsx` — ThemeProvider → ClerkProvider → ConvexProviderWithClerk

### Components (by domain)
- `components/layout/Navbar.tsx` — Nav with hamburger menu, dark mode toggle, auth, notification bell, RFQs link
- `components/layout/Footer.tsx` — 4-column footer shared across all pages
- `components/shared/NotificationBell.tsx` — Notification dropdown with unread count
- `components/shared/PdfUpload.tsx` + `PdfPreviewModal.tsx` — PDF upload/preview
- `components/meetings/MeetingCard.tsx` — Meeting card with accept/counter/decline
- `components/meetings/MeetingRequestModal.tsx` — Modal for scheduling meetings
- `components/meetings/CalendarLinks.tsx` — Google Calendar, Outlook, .ics links
- `components/meetings/TimeSlotPicker.tsx` — Date + time range picker

### Convex Backend (by domain)
- `convex/schema.ts` — Database schema (users, vendorProfiles, savedVendors, rfqs, rfqResponses, notifications, meetingRequests, conversations, messages, vendorEndorsements)
- `convex/http.ts` — Clerk webhook handler with svix verification
- `convex/users/queries.ts` — getUserByClerkId
- `convex/users/mutations.ts` — createUser, updateUser
- `convex/vendors/queries.ts` — getVendorProfiles, getVendorProfile, getVendorProfileByUserId, getSavedVendors, isVendorSaved
- `convex/vendors/mutations.ts` — createVendorProfile, updateVendorProfile, togglePublishProfile, saveVendor, unsaveVendor
- `convex/rfq/queries.ts` — getRfqs, getRfq, getMyRfqs, getMatchedRfqs, getRfqResponses, notifications
- `convex/rfq/mutations.ts` — createRfq, submitProposal, acceptProposal, closeRfq, generateUploadUrl, notifications
- `convex/meetings/queries.ts` — getMyMeetings, getUpcomingMeetings, getPendingMeetingCount
- `convex/meetings/mutations.ts` — createMeetingRequest, acceptMeetingSlot, counterProposeMeeting, declineMeeting
- `convex/messaging/queries.ts` — getConversations, getMessages, getConversation, getUnreadCount, searchUsers
- `convex/messaging/mutations.ts` — sendMessage, createConversation, markConversationRead
- `convex/endorsements/queries.ts` — getEndorsementCounts, getEndorsementCountsBatch, hasEndorsed, getEndorsers
- `convex/endorsements/mutations.ts` — toggleEndorsement

### Docs
- `docs/plans/` — active implementation plans
- `docs/design/` — active design docs
- `docs/archive/` — completed feature docs
- `docs/reference/` — project kickoff, build guide, concept notes, design assets

## Auth Flow
1. Sign up via Clerk → `/onboarding` (select role + enter company → writes to Convex `users` table)
2. Sign in → `/dashboard` → role-based redirect to `/dashboard/vendor` or `/dashboard/facility`
3. Clerk webhook syncs `user.updated` events to Convex via `convex/http.ts`

## Dev Commands
- Terminal 1: `npx convex dev` (keep running — watches and deploys Convex functions on save)
- Terminal 2: `npm run dev` (Next.js dev server on localhost:3000)
- Build: `npm run build` (production build, currently passes clean)
- Convex deploy (dev): `npx convex dev --once`
- Convex deploy (prod): `npx convex deploy --cmd "npm run build" --yes`

## GitHub
- Repo: `https://github.com/paulhpeden2-gitinthecloud/enviroconnect`
- Branch: `main` (all work on main, no feature branches yet)
