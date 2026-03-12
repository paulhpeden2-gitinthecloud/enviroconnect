# EnviroConnect — Project Kickoff & First Prompt Guide

## 1. Refined Product Concept

**App Name (working):** EnviroConnect

**One-liner:** A curated B2B marketplace where Pacific Northwest industrial facility managers discover and source pre-vetted environmental compliance vendors — no cold calls, no Googling, no guesswork.

### The Problem
Industrial facility managers in the PNW spend weeks finding environmental compliance vendors through fragmented channels: Google searches, word-of-mouth, and cold sales emails. There's no single trusted directory for stormwater, dangerous waste, air quality, refrigerant management, or other environmental services. Vendors, meanwhile, struggle to reach decision-makers without resorting to aggressive cold outreach that facility managers hate.

### The Solution
A curated vendor directory where environmental consultants and service providers maintain verified profiles with certifications, service areas, and client reviews. Facility managers get one trusted place to find specialists. Vendors get qualified inbound leads instead of cold-calling.

### MVP Scope (Phase 1)
The first version focuses on **vendor discovery only** — get the directory live, get vendors listed, get facility managers browsing.

**What's in the MVP:**
- Vendor profiles with service categories, certifications, service area, and descriptions
- Searchable/filterable vendor directory (by service type, location, certification)
- Two user roles: Vendor and Facility Manager
- Basic vendor dashboard to manage their own profile
- Basic facility manager dashboard to browse and save/bookmark vendors
- Landing page explaining the value proposition

**What comes later (Phase 2+):**
- Trust networks (vendor-to-vendor referral connections)
- RFQ system (facilities post requests, vendors respond)
- In-app messaging / DMs
- Meeting scheduler with calendar integration
- Email-to-referral feature
- Reviews and ratings
- Freemium subscription tiers (Stripe or Polar)

### Monetization (Freemium — implemented later)
- **Free tier (Vendors):** Basic profile listing with limited visibility
- **Paid tier (Vendors):** Full profile, RFQ access, trust network features, analytics
- **Free tier (Facility Managers):** Browse directory, view vendor profiles
- **Paid tier (Facility Managers):** Unlimited RFQs, messaging, saved searches, premium filters

> Payments are NOT in the MVP. Build the network first, monetize once there's traction.

### Target Users
- **Facility Managers:** Industrial/commercial property managers who just received new permits, are dealing with compliance gaps, or need to replace an underperforming vendor. They hate sales pitches and want to self-serve.
- **Vendors:** Environmental consultants, stormwater specialists, hazardous waste handlers, air quality firms, and similar service providers in the PNW who want qualified leads without cold-calling.

---

## 2. Tech Stack

Following the build guide with one adjustment noted below.

| Layer | Tool | Why |
|---|---|---|
| Frontend | Next.js + React + Tailwind CSS | Industry standard, great DX, SSR for SEO |
| Backend & Database | Convex | Real-time by default (good for future messaging), simple schema, built-in file storage |
| Authentication | Clerk | Easy role-based auth (Vendor vs Facility Manager), JWT integration with Convex |
| Payments | Polar (later) | Keep for now per the guide. Can swap to Stripe later if B2B needs demand it |
| Deployment | Vercel | Zero-config Next.js deployment, preview deploys |
| AI | None for MVP | No AI features in v1. Claude API can be added later for vendor matching or permit analysis |

### Tech Stack Note
Polar is fine for the MVP since payments aren't included yet. When you add subscriptions later, evaluate whether Polar or Stripe fits better for B2B recurring billing. Stripe has more mature B2B features (invoicing, tax handling, multi-seat plans) but Polar is simpler to integrate.

---

## 3. Pre-Prompt Checklist

Complete these **before** running the first prompt in Claude Code:

### Accounts to Create (all free tier)
- [ ] **Convex** → [convex.dev](https://convex.dev) → Create account → Create a new project named `enviroconnect`
- [ ] **Clerk** → [clerk.com](https://clerk.com) → Create account → Create application → Enable email/password auth
- [ ] **GitHub** → Create a new empty repo named `enviroconnect` (if you don't have one already)

> **Skip Polar for now.** You don't need payments in the MVP.

### Local Setup
- [ ] Create a new empty folder on your machine named `enviroconnect`
- [ ] Open it in Cursor
- [ ] Open Claude Code via the extension
- [ ] Set up split view: Claude Code on left, browser preview on right

---

## 4. The First Prompt

Copy everything between the `---START---` and `---END---` markers below and paste it into Claude Code. Before sending:

1. Switch to **Opus 4.5** (`/model` → select Opus)
2. Enter **Plan mode** (Shift + Tab)
3. Paste the prompt and send

---START---

Build a B2B vendor directory web application called "EnviroConnect" using the following tech stack and specifications.

## Tech Stack
- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS
- **Backend/Database:** Convex
- **Authentication:** Clerk (with role-based access: "vendor" and "facility_manager")
- **Deployment target:** Vercel

## App Purpose
EnviroConnect is a curated marketplace for Pacific Northwest industrial facility managers to discover and vet environmental compliance vendors (stormwater consultants, dangerous waste handlers, air quality specialists, etc.). Vendors list their services; facility managers search and browse to find qualified providers.

## Database Schema (Convex)
Design the Convex schema with these tables:

**users** — synced from Clerk via webhook
- clerkId (string, indexed)
- email (string)
- name (string)
- role ("vendor" | "facility_manager")
- company (string)
- createdAt (number)

**vendorProfiles** — one per vendor user
- userId (reference to users, indexed)
- companyName (string)
- description (string, max 2000 chars)
- services (array of strings — selected from predefined categories)
- certifications (array of strings)
- serviceArea (array of strings — PNW regions)
- phone (optional string)
- email (string)
- website (optional string)
- city (string)
- state (string)
- isPublished (boolean, default false)
- createdAt (number)
- updatedAt (number)

**savedVendors** — facility managers bookmark vendors
- facilityManagerId (reference to users, indexed)
- vendorProfileId (reference to vendorProfiles, indexed)
- savedAt (number)

## Predefined Categories

**Service Types:**
- Stormwater Management (ISGP/CSGP)
- Dangerous Waste Compliance
- Air Quality / Emissions
- Spill Prevention (SPCC)
- Refrigerant Management
- Environmental Site Assessments
- Asbestos / Lead Abatement
- Underground Storage Tanks
- Wastewater Management
- Environmental Training
- Pollution Prevention Planning
- Emergency Response / HAZMAT

**Service Areas (PNW Regions):**
- Seattle Metro
- Tacoma / South Sound
- Olympia / Thurston County
- Portland Metro
- Southwest Washington
- Eastern Washington
- Central Washington
- Northwest Washington / Bellingham
- Oregon Coast
- Eastern Oregon

**Certifications:**
- Licensed Environmental Professional
- Certified Hazardous Materials Manager (CHMM)
- AHERA Certified Inspector
- 40-Hour HAZWOPER
- Certified Professional in Stormwater Quality (CPSWQ)
- Professional Engineer (PE)
- Certified Industrial Hygienist (CIH)
- LEED Accredited Professional

## Pages & Navigation

**Public pages (no auth required):**
1. **Landing Page** (`/`) — Hero section explaining value prop, how it works (3 steps), CTA buttons for "Find Vendors" and "List Your Services"
2. **Vendor Directory** (`/directory`) — Searchable, filterable grid of vendor cards. Filters: service type, region, certification. Search by company name or keyword.
3. **Vendor Public Profile** (`/directory/[id]`) — Full vendor profile detail page with services, certifications, service area, contact info, description.

**Authenticated pages:**
4. **Dashboard** (`/dashboard`) — Role-based redirect. Vendors see their profile management. Facility managers see their saved vendors and browse tools.
5. **Vendor Dashboard** (`/dashboard/vendor`) — Edit profile form, toggle publish/unpublish, preview how their listing looks.
6. **Facility Manager Dashboard** (`/dashboard/facility`) — List of saved/bookmarked vendors, quick link back to directory.

**Auth pages (Clerk-managed):**
7. **Sign Up** (`/sign-up`) — Clerk sign-up with a post-signup step to select role (vendor or facility_manager) and enter company name.
8. **Sign In** (`/sign-in`) — Standard Clerk sign-in.

## User Journeys

**Vendor signup flow:**
1. Signs up via Clerk
2. Selects "I'm a Vendor" role
3. Enters company name
4. Redirected to vendor dashboard
5. Fills out full profile (services, certs, service area, description)
6. Publishes profile → appears in directory

**Facility Manager signup flow:**
1. Signs up via Clerk
2. Selects "I'm a Facility Manager" role
3. Enters company name
4. Redirected to facility manager dashboard
5. Can browse directory, view profiles, save vendors

## Design Direction
- Clean, professional, trustworthy — this is B2B for industrial managers, not consumer flashy
- Color palette: Deep navy (#1B2A4A) as primary, forest green (#2D5F2D) as accent, white/light gray backgrounds
- Font: Inter for body text, system font stack fallback
- Subtle shadows on cards, clear hierarchy, generous whitespace
- Mobile responsive but desktop-first (these users are at their desks)
- No animations beyond subtle hover states on cards and buttons

## API Endpoints / Convex Functions

**Queries:**
- `getVendorProfiles` — list all published vendor profiles with optional filters (service type, region, certification, search term)
- `getVendorProfile` — get single vendor profile by ID
- `getUserByClerkId` — look up user record from Clerk ID
- `getSavedVendors` — get facility manager's saved vendor list

**Mutations:**
- `createUser` — called by Clerk webhook on user.created
- `updateUser` — called by Clerk webhook on user.updated
- `createVendorProfile` — create initial vendor profile
- `updateVendorProfile` — edit vendor profile fields
- `togglePublishProfile` — toggle isPublished
- `saveVendor` — facility manager bookmarks a vendor
- `unsaveVendor` — remove bookmark

**HTTP endpoints:**
- `POST /api/webhooks/clerk` — handles Clerk webhook events

## Additional Requirements
- Set up proper Clerk + Convex JWT integration (use the built-in Convex JWT template in Clerk)
- Add authorization checks: vendors can only edit their own profile, facility managers can only manage their own saved list
- Directory page should use pagination or infinite scroll (start with pagination, 12 vendors per page)
- Vendor cards in the directory should show: company name, top 3 services as tags, primary service area, and a short description preview
- All Convex functions should have proper input validation

## Planning
Create a `project-plan.md` file with the full implementation plan broken down step by step before building anything.

---END---

### After Sending the Prompt

1. Claude Code will ask clarifying questions — answer them
2. It will generate a `project-plan.md` — review it
3. When the plan looks good, say: **"Yes, looks good. Go ahead and auto accept."**
4. Claude Code will scaffold the entire app
5. Once it's done, follow Phase 3 of the build guide to connect Convex and set up environment variables

---

## 5. Post-Build Checklist (After Claude Code finishes)

### Connect Services (Build Guide Phase 3)
```bash
# In your project terminal:
cd enviroconnect
npx convex dev          # connects to your Convex project
npm run dev             # starts the Next.js dev server
```

### Environment Variables
Create `.env.local` in the project root:
```
NEXT_PUBLIC_CONVEX_URL=<from Convex dashboard → Settings → URL>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<from Clerk → API Keys>
CLERK_SECRET_KEY=<from Clerk → API Keys>
CLERK_WEBHOOK_SECRET=<set up webhook in Clerk, paste secret here>
```

### Configure Clerk JWT for Convex
1. Clerk dashboard → Configure → JWT Templates
2. Click "New template" → Select the **Convex** template (not custom)
3. Save
4. In Convex dashboard → Settings → Environment Variables → Add `CLERK_ISSUER_URL` = your Clerk Frontend API URL

### Verify It Works
- [ ] Landing page loads at localhost:3000
- [ ] Can sign up as a vendor
- [ ] Can sign up as a facility manager
- [ ] Vendor can create and publish a profile
- [ ] Directory shows published vendor profiles
- [ ] Facility manager can browse and save vendors
- [ ] Check Convex dashboard → Data tab for records

### Set Up GitHub (Build Guide Phase 9)
```bash
git init
git remote add origin https://github.com/YOUR_USERNAME/enviroconnect.git
git add -A
git commit -m "initial MVP: vendor directory with auth and profiles"
git push -u origin main
```

---

## 6. What Comes Next (Roadmap)

After the MVP is live and you have some test data:

| Priority | Feature | Prompt Strategy |
|---|---|---|
| 1 | Seed 10-20 real vendor profiles | Manual data entry or import |
| 2 | Trust networks | New Claude Code prompt (Plan mode) |
| 3 | RFQ system | New prompt — facilities post, vendors respond |
| 4 | In-app messaging | New prompt — DM between users |
| 5 | Meeting scheduler | New prompt — calendar integration |
| 6 | Payments (Polar or Stripe) | Follow build guide Phase 5 |
| 7 | Email-to-referral | New prompt — email ingestion API |
| 8 | Reviews & ratings | New prompt |
| 9 | Security audit | Follow build guide Phase 8 |
| 10 | Deploy to production | Follow build guide Phase 10 |

> **Tip:** Start a fresh Claude Code conversation (`/clear`) for each new feature. Use Plan mode (Shift+Tab) for anything beyond small fixes.
