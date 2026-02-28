# EnviroConnect — Claude Code Context

## Project
B2B vendor directory for PNW industrial facility managers to discover environmental compliance vendors.
Next.js 14 (App Router) + Convex + Clerk + Tailwind CSS v4. Deployed to Vercel.

## Key Files
- `convex/schema.ts` — database schema (users, vendorProfiles, savedVendors)
- `convex/users.ts` — user queries + mutations (getUserByClerkId, createUser, updateUser)
- `convex/vendors.ts` — vendor queries (getVendorProfiles, getVendorProfile, getVendorProfileByUserId, getSavedVendors, isVendorSaved)
- `convex/mutations.ts` — vendor profile + bookmark mutations (createVendorProfile, updateVendorProfile, togglePublishProfile, saveVendor, unsaveVendor)
- `convex/http.ts` — Clerk webhook handler (POST /api/webhooks/clerk, svix verification)
- `lib/constants.ts` — SERVICE_TYPES, SERVICE_AREAS, CERTIFICATIONS arrays
- `middleware.ts` — Clerk route protection (protects /dashboard/**)
- `app/providers.tsx` — ClerkProvider + ConvexProviderWithClerk

## Design System (Tailwind v4 — colors defined in app/globals.css @theme block)
- Navy `#1B2A4A` → `bg-navy`, `text-navy`, `border-navy`
- Green `#2D5F2D` → `bg-green`, `text-green`
- Navy light `#243759` → `bg-navy-light`
- Green light `#3a7a3a` → `bg-green-light`
- Font: Inter. B2B professional, desktop-first, no animations beyond hover states.

## Auth Flow
1. Sign up via Clerk → `/onboarding` (role + company → writes to Convex `users` table)
2. Sign in → `/dashboard` → role-based redirect:
   - vendor → `/dashboard/vendor`
   - facility_manager → `/dashboard/facility`

## Dev Commands
- Terminal 1: `npx convex dev` (keep running — deploys Convex functions on save)
- Terminal 2: `npm run dev` (Next.js on localhost:3000)

## MVP Scope (no payments, no messaging, no RFQ)
Vendor directory, role-based auth, vendor profile management, facility manager bookmarking.

## Roadmap (Phase 2+)
Trust networks → RFQ system → In-app messaging → Meeting scheduler → Payments (Polar/Stripe) → Reviews
