# Trust Networks (Endorsements) — Design Document

## Overview

One-directional endorsement system where users vouch for vendors they trust. Like an Instagram "follow" — no mutual acceptance required. Click "Endorse" and it's done.

## Endorsement Types

| Type | Who Endorses | Signal | Auto-Determined By |
|------|-------------|--------|-------------------|
| **Peer Trust** | Vendor → Vendor | "I vouch for their work as a peer" | Endorser role = `vendor` |
| **Client Trust** | FM → Vendor | "I've worked with them and trust them" | Endorser role = `facility_manager` |

Types are displayed separately so users can distinguish peer recommendations from client recommendations.

## Data Model

### New Table: `vendorEndorsements`

```
vendorEndorsements:
  endorserId: Id<"users">        — the user giving the endorsement
  vendorProfileId: Id<"vendorProfiles">  — the vendor being endorsed
  type: "peer" | "client"        — auto-set based on endorser's role
  note: optional string           — short endorsement note (max 200 chars)
  createdAt: number               — timestamp (Date.now())

Indexes:
  by_vendorProfileId: [vendorProfileId]
  by_endorserId: [endorserId]
  by_endorserId_vendorProfileId: [endorserId, vendorProfileId]  — uniqueness check
```

Mirrors the existing `savedVendors` junction table pattern.

### Constraints
- One endorsement per user per vendor (enforced via compound index lookup before insert)
- Can't endorse yourself
- Must be signed in (auth-gated)
- 250 endorsement cap per user (soft limit, checked on create)
- Type auto-determined: vendor role → "peer", facility_manager role → "client"

## Convex Functions

### Queries (`convex/endorsements.ts`)

1. **`getEndorsementCounts`** — Returns peer + client counts for a vendor profile
   - Args: `{ vendorProfileId: Id<"vendorProfiles"> }`
   - Returns: `{ peerCount: number, clientCount: number }`

2. **`getEndorsers`** — List endorsers with names + notes for the modal
   - Args: `{ vendorProfileId: Id<"vendorProfiles">, type?: "peer" | "client" }`
   - Returns: `Array<{ endorserId, endorserName, endorserCompany, note, createdAt }>`

3. **`hasEndorsed`** — Check if current user has already endorsed this vendor
   - Args: `{ endorserId: Id<"users">, vendorProfileId: Id<"vendorProfiles"> }`
   - Returns: `boolean`

4. **`getEndorsementCountsBatch`** — Batch counts for vendor cards in directory grid
   - Args: `{ vendorProfileIds: Id<"vendorProfiles">[] }`
   - Returns: `Record<string, { peerCount: number, clientCount: number }>`

### Mutations (`convex/endorsementMutations.ts`)

1. **`toggleEndorsement`** — Endorse or un-endorse a vendor
   - Args: `{ endorserId: Id<"users">, vendorProfileId: Id<"vendorProfiles">, note?: string }`
   - Logic: Check if exists → delete if yes, insert if no
   - Validates: not self-endorsement, endorser cap (250)

## UI Changes

### 1. Vendor Card (`components/VendorCard.tsx`)

Add endorsement count badges below company name:

```
┌─────────────────────────────────┐
│ Acme Environmental Services     │
│ Seattle Metro                   │
│ 👥 12 peer · 🏢 8 client        │  ← NEW: endorsement badges
│                                 │
│ Full-service environmental...   │
│                                 │
│ [Stormwater] [Air Quality]      │
└─────────────────────────────────┘
```

- Badges use icons (not emoji) — matching the app's clean design
- Only shown if count > 0
- Small, subtle text: `text-xs text-gray-500`

### 2. Vendor Profile Page (`app/directory/[id]/page.tsx`)

Add to header area near company name:

```
┌──────────────────────────────────────────┐
│ Acme Environmental Services              │
│ Seattle Metro, WA                        │
│                                          │
│ [👥 12 Peer Endorsements]  [🏢 8 Client] │  ← clickable badges
│                                          │
│ [✓ Endorsed]  or  [Endorse]             │  ← toggle button
│   Optional: "Great stormwater work"      │  ← note input (shown on endorse)
└──────────────────────────────────────────┘
```

- **Endorse button**: Prominent, in header area near company name
  - Not endorsed: outlined green button `[Endorse]`
  - Endorsed: filled green button `[✓ Endorsed]`
  - Click toggles state
- **Note input**: Appears inline when endorsing, max 200 chars, optional
- **Count badges**: Clickable → opens modal

### 3. Endorsers Modal (`components/EndorsersModal.tsx`)

Click count badge → modal showing:

```
┌─────────────────────────────────┐
│ Peer Endorsements (12)     [×] │
│─────────────────────────────────│
│ John Smith — ABC Consulting     │
│ "Excellent stormwater work"     │
│                                 │
│ Jane Doe — XYZ Services         │
│ (no note)                       │
│                                 │
│ ...                             │
└─────────────────────────────────┘
```

- Tabs or toggle for Peer vs Client endorsements
- Shows endorser name, company, and optional note
- Sorted by most recent first

### 4. Navbar — No changes needed

Endorsements don't generate notifications (lightweight, no spam).

## Auth Gating

- **Not signed in**: Endorsement badges visible (counts), but "Endorse" button shows sign-in CTA (matches existing gating pattern)
- **Signed in**: Full endorse/un-endorse functionality
- **Own profile**: "Endorse" button hidden (can't endorse yourself)

## Files to Create/Modify

### Create:
- `convex/endorsements.ts` — queries
- `convex/endorsementMutations.ts` — mutations
- `components/EndorsersModal.tsx` — modal for viewing endorsers
- `components/EndorsementBadge.tsx` — reusable count badge component
- `components/EndorseButton.tsx` — toggle button with note input

### Modify:
- `convex/schema.ts` — add `vendorEndorsements` table
- `components/VendorCard.tsx` — add endorsement badges
- `app/directory/[id]/page.tsx` — add endorse button + badges
