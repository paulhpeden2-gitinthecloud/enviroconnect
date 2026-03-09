# Trust Networks (Endorsements) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a one-directional endorsement system where users can vouch for vendors, displayed as peer/client trust badges on vendor cards and profiles.

**Architecture:** New `vendorEndorsements` junction table (mirrors `savedVendors` pattern) with Convex queries/mutations. UI additions to VendorCard and vendor profile page, plus a new EndorsersModal.

**Tech Stack:** Convex (backend), React + Tailwind CSS v4 (frontend), Next.js 14 App Router

---

### Task 1: Add vendorEndorsements table to schema

**Files:**
- Modify: `convex/schema.ts`

**Step 1: Add the table definition**

Add this table to the `defineSchema({...})` call in `convex/schema.ts`, after the `savedVendors` table:

```typescript
vendorEndorsements: defineTable({
  endorserId: v.id("users"),
  vendorProfileId: v.id("vendorProfiles"),
  type: v.union(v.literal("peer"), v.literal("client")),
  note: v.optional(v.string()),
  createdAt: v.number(),
})
  .index("by_vendorProfileId", ["vendorProfileId"])
  .index("by_endorserId", ["endorserId"])
  .index("by_endorserId_vendorProfileId", ["endorserId", "vendorProfileId"]),
```

**Step 2: Push schema**

Run: `cd /Users/blueenvironmental/Documents/ACTIVE\ WORK/industrial_network_app/enviroconnect && npx convex dev --once`
Expected: Schema pushed successfully, `vendorEndorsements` table created.

**Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "feat: add vendorEndorsements table to schema"
```

---

### Task 2: Create endorsement queries

**Files:**
- Create: `convex/endorsements.ts`

**Step 1: Create the queries file**

Create `convex/endorsements.ts` with these queries:

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getEndorsementCounts = query({
  args: { vendorProfileId: v.id("vendorProfiles") },
  handler: async (ctx, args) => {
    const endorsements = await ctx.db
      .query("vendorEndorsements")
      .withIndex("by_vendorProfileId", (q) =>
        q.eq("vendorProfileId", args.vendorProfileId)
      )
      .collect();

    let peerCount = 0;
    let clientCount = 0;
    for (const e of endorsements) {
      if (e.type === "peer") peerCount++;
      else clientCount++;
    }
    return { peerCount, clientCount };
  },
});

export const getEndorsementCountsBatch = query({
  args: { vendorProfileIds: v.array(v.id("vendorProfiles")) },
  handler: async (ctx, args) => {
    const result: Record<string, { peerCount: number; clientCount: number }> = {};

    for (const vpId of args.vendorProfileIds) {
      const endorsements = await ctx.db
        .query("vendorEndorsements")
        .withIndex("by_vendorProfileId", (q) => q.eq("vendorProfileId", vpId))
        .collect();

      let peerCount = 0;
      let clientCount = 0;
      for (const e of endorsements) {
        if (e.type === "peer") peerCount++;
        else clientCount++;
      }
      result[vpId] = { peerCount, clientCount };
    }
    return result;
  },
});

export const getEndorsers = query({
  args: {
    vendorProfileId: v.id("vendorProfiles"),
    type: v.optional(v.union(v.literal("peer"), v.literal("client"))),
  },
  handler: async (ctx, args) => {
    const endorsements = await ctx.db
      .query("vendorEndorsements")
      .withIndex("by_vendorProfileId", (q) =>
        q.eq("vendorProfileId", args.vendorProfileId)
      )
      .collect();

    const filtered = args.type
      ? endorsements.filter((e) => e.type === args.type)
      : endorsements;

    filtered.sort((a, b) => b.createdAt - a.createdAt);

    const withUsers = await Promise.all(
      filtered.map(async (e) => {
        const user = await ctx.db.get(e.endorserId);
        return {
          _id: e._id,
          endorserName: user?.name ?? "Unknown",
          endorserCompany: user?.company ?? "",
          type: e.type,
          note: e.note,
          createdAt: e.createdAt,
        };
      })
    );
    return withUsers;
  },
});

export const hasEndorsed = query({
  args: {
    endorserId: v.id("users"),
    vendorProfileId: v.id("vendorProfiles"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("vendorEndorsements")
      .withIndex("by_endorserId_vendorProfileId", (q) =>
        q
          .eq("endorserId", args.endorserId)
          .eq("vendorProfileId", args.vendorProfileId)
      )
      .unique();
    return existing !== null;
  },
});
```

**Step 2: Regenerate Convex types**

Run: `cd /Users/blueenvironmental/Documents/ACTIVE\ WORK/industrial_network_app/enviroconnect && npx convex dev --once`
Expected: Types regenerated, `api.endorsements` now available.

**Step 3: Commit**

```bash
git add convex/endorsements.ts
git commit -m "feat: add endorsement queries"
```

---

### Task 3: Create endorsement mutations

**Files:**
- Create: `convex/endorsementMutations.ts`

**Step 1: Create the mutations file**

Create `convex/endorsementMutations.ts`:

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const toggleEndorsement = mutation({
  args: {
    endorserId: v.id("users"),
    vendorProfileId: v.id("vendorProfiles"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate endorser exists and get their role
    const endorser = await ctx.db.get(args.endorserId);
    if (!endorser) throw new Error("User not found");

    // Get the vendor profile to check ownership
    const vendorProfile = await ctx.db.get(args.vendorProfileId);
    if (!vendorProfile) throw new Error("Vendor profile not found");

    // Can't endorse yourself
    if (vendorProfile.userId === args.endorserId) {
      throw new Error("You cannot endorse yourself");
    }

    // Check if already endorsed
    const existing = await ctx.db
      .query("vendorEndorsements")
      .withIndex("by_endorserId_vendorProfileId", (q) =>
        q
          .eq("endorserId", args.endorserId)
          .eq("vendorProfileId", args.vendorProfileId)
      )
      .unique();

    if (existing) {
      // Un-endorse
      await ctx.db.delete(existing._id);
      return { action: "removed" as const };
    }

    // Check endorsement cap (250 per user)
    const myEndorsements = await ctx.db
      .query("vendorEndorsements")
      .withIndex("by_endorserId", (q) => q.eq("endorserId", args.endorserId))
      .collect();

    if (myEndorsements.length >= 250) {
      throw new Error("You have reached the maximum number of endorsements (250)");
    }

    // Determine type based on role
    const type = endorser.role === "vendor" ? "peer" : "client";

    // Truncate note to 200 chars
    const note = args.note?.trim().slice(0, 200) || undefined;

    await ctx.db.insert("vendorEndorsements", {
      endorserId: args.endorserId,
      vendorProfileId: args.vendorProfileId,
      type,
      note,
      createdAt: Date.now(),
    });

    return { action: "added" as const };
  },
});
```

**Step 2: Push and regenerate**

Run: `cd /Users/blueenvironmental/Documents/ACTIVE\ WORK/industrial_network_app/enviroconnect && npx convex dev --once`

**Step 3: Commit**

```bash
git add convex/endorsementMutations.ts
git commit -m "feat: add toggleEndorsement mutation"
```

---

### Task 4: Create EndorsementBadge component

**Files:**
- Create: `components/EndorsementBadge.tsx`

**Step 1: Create the badge component**

Create `components/EndorsementBadge.tsx`:

```tsx
"use client";

interface EndorsementBadgeProps {
  peerCount: number;
  clientCount: number;
  onPeerClick?: () => void;
  onClientClick?: () => void;
  size?: "sm" | "md";
}

export function EndorsementBadge({
  peerCount,
  clientCount,
  onPeerClick,
  onClientClick,
  size = "sm",
}: EndorsementBadgeProps) {
  if (peerCount === 0 && clientCount === 0) return null;

  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className="flex items-center gap-2">
      {peerCount > 0 && (
        <button
          type="button"
          onClick={onPeerClick}
          className={`${textSize} text-gray-500 dark:text-gray-400 hover:text-green transition-colors flex items-center gap-1`}
        >
          <svg
            className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            />
          </svg>
          {peerCount} peer
        </button>
      )}
      {peerCount > 0 && clientCount > 0 && (
        <span className={`${textSize} text-gray-300 dark:text-gray-600`}>·</span>
      )}
      {clientCount > 0 && (
        <button
          type="button"
          onClick={onClientClick}
          className={`${textSize} text-gray-500 dark:text-gray-400 hover:text-green transition-colors flex items-center gap-1`}
        >
          <svg
            className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
            />
          </svg>
          {clientCount} client
        </button>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/EndorsementBadge.tsx
git commit -m "feat: add EndorsementBadge component"
```

---

### Task 5: Create EndorsersModal component

**Files:**
- Create: `components/EndorsersModal.tsx`

**Step 1: Create the modal component**

Create `components/EndorsersModal.tsx`:

```tsx
"use client";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface EndorsersModalProps {
  vendorProfileId: Id<"vendorProfiles">;
  initialTab?: "peer" | "client";
  onClose: () => void;
}

export function EndorsersModal({
  vendorProfileId,
  initialTab = "peer",
  onClose,
}: EndorsersModalProps) {
  const [tab, setTab] = useState<"peer" | "client">(initialTab);
  const endorsers = useQuery(api.endorsements.getEndorsers, {
    vendorProfileId,
    type: tab,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-navy-light rounded-xl shadow-xl w-full max-w-md max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cream-dark">
          <h3
            className="text-lg font-semibold text-navy dark:text-white"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Endorsements
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-cream-dark">
          <button
            onClick={() => setTab("peer")}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === "peer"
                ? "text-green border-b-2 border-green"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Peer Endorsements
          </button>
          <button
            onClick={() => setTab("client")}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === "client"
                ? "text-green border-b-2 border-green"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Client Endorsements
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {endorsers === undefined && (
            <p className="text-sm text-gray-500 text-center py-4">Loading...</p>
          )}
          {endorsers?.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No {tab} endorsements yet
            </p>
          )}
          {endorsers?.map((e) => (
            <div key={e._id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green/10 flex items-center justify-center text-green text-sm font-semibold shrink-0">
                  {e.endorserName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-navy dark:text-white">
                    {e.endorserName}
                  </p>
                  {e.endorserCompany && (
                    <p className="text-xs text-gray-500">{e.endorserCompany}</p>
                  )}
                </div>
              </div>
              {e.note && (
                <p className="text-sm text-gray-600 dark:text-gray-400 italic ml-10">
                  &ldquo;{e.note}&rdquo;
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/EndorsersModal.tsx
git commit -m "feat: add EndorsersModal component"
```

---

### Task 6: Create EndorseButton component

**Files:**
- Create: `components/EndorseButton.tsx`

**Step 1: Create the button component**

Create `components/EndorseButton.tsx`:

```tsx
"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface EndorseButtonProps {
  userId: Id<"users"> | null;
  vendorProfileId: Id<"vendorProfiles">;
  isOwnProfile: boolean;
}

export function EndorseButton({
  userId,
  vendorProfileId,
  isOwnProfile,
}: EndorseButtonProps) {
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const isEndorsed = useQuery(
    api.endorsements.hasEndorsed,
    userId ? { endorserId: userId, vendorProfileId } : "skip"
  );
  const toggle = useMutation(api.endorsementMutations.toggleEndorsement);

  if (isOwnProfile) return null;

  if (!userId) {
    return (
      <p className="text-sm text-gray-500">
        <a href="/sign-in" className="text-green hover:underline font-medium">
          Sign in
        </a>{" "}
        to endorse this vendor
      </p>
    );
  }

  const handleToggle = async () => {
    if (isEndorsed) {
      // Un-endorse directly
      setLoading(true);
      try {
        await toggle({ endorserId: userId, vendorProfileId });
      } catch (err) {
        console.error("Failed to toggle endorsement:", err);
      } finally {
        setLoading(false);
      }
    } else if (!showNote) {
      // Show note input first
      setShowNote(true);
    } else {
      // Submit endorsement with optional note
      setLoading(true);
      try {
        await toggle({
          endorserId: userId,
          vendorProfileId,
          note: note.trim() || undefined,
        });
        setShowNote(false);
        setNote("");
      } catch (err) {
        console.error("Failed to toggle endorsement:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isEndorsed
              ? "bg-green text-white hover:bg-green-light"
              : "border-2 border-green text-green hover:bg-green/5"
          } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loading ? "..." : isEndorsed ? "✓ Endorsed" : "Endorse"}
        </button>
        {showNote && !isEndorsed && (
          <button
            onClick={() => {
              setShowNote(false);
              setNote("");
            }}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
      {showNote && !isEndorsed && (
        <div className="flex gap-2">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 200))}
            placeholder="Add a short note (optional)"
            className="flex-1 text-sm border border-cream-dark rounded-lg px-3 py-2 bg-white dark:bg-navy dark:border-navy-light dark:text-white focus:outline-none focus:ring-2 focus:ring-green/30"
            maxLength={200}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleToggle();
            }}
          />
          <button
            onClick={handleToggle}
            disabled={loading}
            className="px-4 py-2 bg-green text-white text-sm font-medium rounded-lg hover:bg-green-light transition-colors disabled:opacity-50"
          >
            Submit
          </button>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/EndorseButton.tsx
git commit -m "feat: add EndorseButton component"
```

---

### Task 7: Add endorsement badges to VendorCard

**Files:**
- Modify: `components/VendorCard.tsx`

**Step 1: Update VendorCard to accept and display endorsement counts**

The VendorCard currently takes just `profile`. We'll add optional endorsement counts as a prop (fetched in the parent via `getEndorsementCountsBatch`):

Update `components/VendorCard.tsx` to:

```tsx
import Link from "next/link";
import { Doc } from "@/convex/_generated/dataModel";
import { EndorsementBadge } from "./EndorsementBadge";

interface VendorCardProps {
  profile: Doc<"vendorProfiles">;
  endorsements?: { peerCount: number; clientCount: number };
}

export function VendorCard({ profile, endorsements }: VendorCardProps) {
  const topServices = profile.services.slice(0, 3);
  const primaryArea = profile.serviceArea[0];
  const preview =
    profile.description.slice(0, 120) +
    (profile.description.length > 120 ? "…" : "");

  return (
    <Link href={`/directory/${profile._id}`}>
      <div className="bg-white dark:bg-navy-light border border-cream-dark rounded-xl p-6 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer h-full flex flex-col">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-navy truncate">
            {profile.companyName}
          </h3>
          {primaryArea && (
            <p className="text-sm text-gray-500 mt-0.5">{primaryArea}</p>
          )}
          {endorsements && (
            <div className="mt-1">
              <EndorsementBadge
                peerCount={endorsements.peerCount}
                clientCount={endorsements.clientCount}
              />
            </div>
          )}
        </div>
        {preview && (
          <p className="text-sm text-gray-600 mb-4 flex-1">{preview}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-auto">
          {topServices.map((s) => (
            <span
              key={s}
              className="text-xs bg-green/10 text-green font-medium px-2.5 py-1 rounded-full"
            >
              {s.split("(")[0].trim()}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
```

**Step 2: Update DirectoryClient to fetch and pass endorsement counts**

Modify `app/directory/DirectoryClient.tsx`:
- Import `api.endorsements.getEndorsementCountsBatch`
- After fetching profiles, call `getEndorsementCountsBatch` with all profile IDs
- Pass `endorsements` prop to each `VendorCard`

Add to the component:
```tsx
const profileIds = profiles?.profiles?.map((p) => p._id) ?? [];
const endorsementCounts = useQuery(
  api.endorsements.getEndorsementCountsBatch,
  profileIds.length > 0 ? { vendorProfileIds: profileIds } : "skip"
);
```

Then in the render, pass to VendorCard:
```tsx
<VendorCard
  key={profile._id}
  profile={profile}
  endorsements={endorsementCounts?.[profile._id]}
/>
```

**Step 3: Commit**

```bash
git add components/VendorCard.tsx app/directory/DirectoryClient.tsx
git commit -m "feat: add endorsement badges to vendor cards"
```

---

### Task 8: Add EndorseButton and badges to vendor profile page

**Files:**
- Modify: `app/directory/[id]/page.tsx`

**Step 1: Add endorsement UI to vendor profile**

In the vendor profile page, add these imports:
```tsx
import { EndorseButton } from "@/components/EndorseButton";
import { EndorsementBadge } from "@/components/EndorsementBadge";
import { EndorsersModal } from "@/components/EndorsersModal";
```

Add these queries/state inside the component:
```tsx
const endorsementCounts = useQuery(api.endorsements.getEndorsementCounts, { vendorProfileId: id });
const [showEndorsersModal, setShowEndorsersModal] = useState(false);
const [endorsersModalTab, setEndorsersModalTab] = useState<"peer" | "client">("peer");
```

In the header area (near company name), add:
```tsx
{/* Endorsement counts */}
{endorsementCounts && (
  <EndorsementBadge
    peerCount={endorsementCounts.peerCount}
    clientCount={endorsementCounts.clientCount}
    size="md"
    onPeerClick={() => { setEndorsersModalTab("peer"); setShowEndorsersModal(true); }}
    onClientClick={() => { setEndorsersModalTab("client"); setShowEndorsersModal(true); }}
  />
)}

{/* Endorse button */}
<EndorseButton
  userId={dbUser?._id ?? null}
  vendorProfileId={id}
  isOwnProfile={dbUser?._id === profile?.userId}
/>

{/* Endorsers modal */}
{showEndorsersModal && (
  <EndorsersModal
    vendorProfileId={id}
    initialTab={endorsersModalTab}
    onClose={() => setShowEndorsersModal(false)}
  />
)}
```

Note: The exact insertion point depends on the current page layout. Place the endorsement UI in the header section, below the company name and location, above the description.

**Step 2: Verify in dev**

Run dev server and navigate to a vendor profile. Verify:
- Endorsement badges show (0 counts = hidden)
- Endorse button appears for signed-in users
- Button hidden on own profile
- Sign-in CTA for unauthenticated users

**Step 3: Commit**

```bash
git add app/directory/[id]/page.tsx
git commit -m "feat: add endorsement UI to vendor profile page"
```

---

### Task 9: Push schema to Convex and verify end-to-end

**Step 1: Deploy Convex functions**

Run: `cd /Users/blueenvironmental/Documents/ACTIVE\ WORK/industrial_network_app/enviroconnect && npx convex dev --once`

**Step 2: Start dev server and test**

Run: `npm run dev`

Test flow:
1. Sign in as vendor → navigate to another vendor's profile → click Endorse → add note → submit
2. Verify badge count increments on profile page
3. Click count badge → endorsers modal opens with name + note
4. Navigate to directory → verify badges appear on vendor cards
5. Click Endorse again → un-endorses (badge count decrements)
6. Sign in as FM → endorse a vendor → verify it shows as "client" type
7. Check own profile → Endorse button should be hidden

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: trust networks - endorsement system complete"
```
