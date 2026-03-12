# RFQ System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Request for Quote system where facility managers post RFQs, vendors browse/get matched/submit proposals, and FMs review and award.

**Architecture:** Three new Convex tables (rfqs, rfqResponses, notifications) with queries and mutations following existing patterns. New pages for the RFQ board, RFQ creation, RFQ detail, and dashboard sections. Notification bell in navbar. All new UI follows existing cream/navy/green design system with dark mode support.

**Tech Stack:** Convex (backend), Next.js 14 App Router (frontend), Clerk (auth), Tailwind CSS v4, framer-motion (animations)

**Design Doc:** `docs/plans/2026-03-01-rfq-system-design.md`

---

## Task 1: Add Schema Tables

**Files:**
- Modify: `convex/schema.ts`
- Modify: `lib/constants.ts`

**Step 1: Add constants**

In `lib/constants.ts`, add after the existing constants:

```typescript
export const BUDGET_RANGES = [
  "Under $5K",
  "$5K–$15K",
  "$15K–$50K",
  "$50K–$100K",
  "$100K+",
] as const;

export const TIMELINE_OPTIONS = [
  "Urgent (< 2 weeks)",
  "1–3 months",
  "3–6 months",
  "6+ months",
  "Flexible",
] as const;
```

**Step 2: Add rfqs, rfqResponses, and notifications tables to schema**

Add these three tables to the `defineSchema` call in `convex/schema.ts`:

```typescript
rfqs: defineTable({
  facilityManagerId: v.id("users"),
  title: v.string(),
  description: v.string(),
  services: v.array(v.string()),
  serviceArea: v.string(),
  budgetRange: v.optional(v.string()),
  deadline: v.number(),
  timeline: v.string(),
  requirements: v.optional(v.string()),
  invitedVendors: v.optional(v.array(v.id("vendorProfiles"))),
  status: v.union(v.literal("open"), v.literal("closed"), v.literal("awarded")),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_facilityManagerId", ["facilityManagerId"])
  .index("by_status", ["status"]),

rfqResponses: defineTable({
  rfqId: v.id("rfqs"),
  vendorProfileId: v.id("vendorProfiles"),
  proposalText: v.string(),
  estimatedCost: v.optional(v.string()),
  estimatedTimeline: v.optional(v.string()),
  status: v.union(v.literal("submitted"), v.literal("accepted"), v.literal("declined")),
  createdAt: v.number(),
})
  .index("by_rfqId", ["rfqId"])
  .index("by_vendorProfileId", ["vendorProfileId"])
  .index("by_rfqId_vendorProfileId", ["rfqId", "vendorProfileId"]),

notifications: defineTable({
  userId: v.id("users"),
  type: v.union(
    v.literal("rfq_match"),
    v.literal("rfq_invite"),
    v.literal("rfq_response"),
    v.literal("rfq_accepted")
  ),
  rfqId: v.id("rfqs"),
  message: v.string(),
  isRead: v.boolean(),
  createdAt: v.number(),
})
  .index("by_userId", ["userId"])
  .index("by_userId_isRead", ["userId", "isRead"]),
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build passes (Convex will sync schema on next `npx convex dev`)

**Step 4: Commit**

```bash
git add convex/schema.ts lib/constants.ts
git commit -m "feat: add RFQ, responses, and notifications schema tables"
```

---

## Task 2: RFQ Queries

**Files:**
- Create: `convex/rfqs.ts`

**Step 1: Create query file**

Create `convex/rfqs.ts` with these queries:

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getRfqs = query({
  args: {
    serviceType: v.optional(v.string()),
    region: v.optional(v.string()),
    timeline: v.optional(v.string()),
    search: v.optional(v.string()),
    page: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let rfqs = await ctx.db
      .query("rfqs")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();

    if (args.serviceType) rfqs = rfqs.filter((r) => r.services.includes(args.serviceType!));
    if (args.region) rfqs = rfqs.filter((r) => r.serviceArea === args.region!);
    if (args.timeline) rfqs = rfqs.filter((r) => r.timeline === args.timeline!);
    if (args.search) {
      const term = args.search.toLowerCase();
      rfqs = rfqs.filter(
        (r) => r.title.toLowerCase().includes(term) || r.description.toLowerCase().includes(term)
      );
    }

    // Sort newest first
    rfqs.sort((a, b) => b.createdAt - a.createdAt);

    const page = args.page ?? 1;
    const pageSize = 12;
    const start = (page - 1) * pageSize;
    return { rfqs: rfqs.slice(start, start + pageSize), total: rfqs.length, page, pageSize };
  },
});

export const getRfq = query({
  args: { id: v.id("rfqs") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const getMyRfqs = query({
  args: { facilityManagerId: v.id("users") },
  handler: async (ctx, args) => {
    const rfqs = await ctx.db
      .query("rfqs")
      .withIndex("by_facilityManagerId", (q) => q.eq("facilityManagerId", args.facilityManagerId))
      .collect();
    // Sort newest first
    rfqs.sort((a, b) => b.createdAt - a.createdAt);

    // Attach response counts
    const withCounts = await Promise.all(
      rfqs.map(async (rfq) => {
        const responses = await ctx.db
          .query("rfqResponses")
          .withIndex("by_rfqId", (q) => q.eq("rfqId", rfq._id))
          .collect();
        return { ...rfq, responseCount: responses.length };
      })
    );
    return withCounts;
  },
});

export const getRfqResponses = query({
  args: { rfqId: v.id("rfqs") },
  handler: async (ctx, args) => {
    const responses = await ctx.db
      .query("rfqResponses")
      .withIndex("by_rfqId", (q) => q.eq("rfqId", args.rfqId))
      .collect();

    // Attach vendor profile info to each response
    const withProfiles = await Promise.all(
      responses.map(async (r) => {
        const profile = await ctx.db.get(r.vendorProfileId);
        return { ...r, vendorProfile: profile };
      })
    );
    return withProfiles;
  },
});

export const getMatchedRfqs = query({
  args: { vendorProfileId: v.id("vendorProfiles") },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.vendorProfileId);
    if (!profile) return [];

    const openRfqs = await ctx.db
      .query("rfqs")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();

    // Filter to RFQs that match vendor's services OR directly invited
    const matched = openRfqs.filter((rfq) => {
      const serviceMatch = rfq.services.some((s) => profile.services.includes(s));
      const invited = rfq.invitedVendors?.includes(args.vendorProfileId) ?? false;
      return serviceMatch || invited;
    });

    // Tag each RFQ with match type
    return matched
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((rfq) => ({
        ...rfq,
        isInvited: rfq.invitedVendors?.includes(args.vendorProfileId) ?? false,
        isServiceMatch: rfq.services.some((s) => profile.services.includes(s)),
      }));
  },
});

export const hasVendorResponded = query({
  args: { rfqId: v.id("rfqs"), vendorProfileId: v.id("vendorProfiles") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("rfqResponses")
      .withIndex("by_rfqId_vendorProfileId", (q) =>
        q.eq("rfqId", args.rfqId).eq("vendorProfileId", args.vendorProfileId)
      )
      .unique();
    return existing !== null;
  },
});

export const getVendorResponses = query({
  args: { vendorProfileId: v.id("vendorProfiles") },
  handler: async (ctx, args) => {
    const responses = await ctx.db
      .query("rfqResponses")
      .withIndex("by_vendorProfileId", (q) => q.eq("vendorProfileId", args.vendorProfileId))
      .collect();

    const withRfqs = await Promise.all(
      responses.map(async (r) => {
        const rfq = await ctx.db.get(r.rfqId);
        return { ...r, rfq };
      })
    );
    return withRfqs.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getNotifications = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    return notifications.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getUnreadNotificationCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", (q) => q.eq("userId", args.userId).eq("isRead", false))
      .collect();
    return unread.length;
  },
});
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build passes

**Step 3: Commit**

```bash
git add convex/rfqs.ts
git commit -m "feat: add RFQ query functions"
```

---

## Task 3: RFQ Mutations

**Files:**
- Create: `convex/rfqMutations.ts`

**Step 1: Create mutations file**

Create `convex/rfqMutations.ts`:

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createRfq = mutation({
  args: {
    facilityManagerId: v.id("users"),
    title: v.string(),
    description: v.string(),
    services: v.array(v.string()),
    serviceArea: v.string(),
    budgetRange: v.optional(v.string()),
    deadline: v.number(),
    timeline: v.string(),
    requirements: v.optional(v.string()),
    invitedVendors: v.optional(v.array(v.id("vendorProfiles"))),
  },
  handler: async (ctx, args) => {
    // Verify user is a facility manager
    const user = await ctx.db.get(args.facilityManagerId);
    if (!user || user.role !== "facility_manager") throw new Error("Unauthorized");

    const now = Date.now();
    const rfqId = await ctx.db.insert("rfqs", {
      ...args,
      status: "open",
      createdAt: now,
      updatedAt: now,
    });

    // Create notifications for matching vendors
    const allProfiles = await ctx.db
      .query("vendorProfiles")
      .withIndex("by_isPublished", (q) => q.eq("isPublished", true))
      .collect();

    const matchedVendorUserIds = new Set<string>();

    for (const profile of allProfiles) {
      const serviceMatch = args.services.some((s) => profile.services.includes(s));
      const isInvited = args.invitedVendors?.includes(profile._id) ?? false;

      if (isInvited) {
        await ctx.db.insert("notifications", {
          userId: profile.userId,
          type: "rfq_invite",
          rfqId,
          message: `You've been invited to respond to: "${args.title}"`,
          isRead: false,
          createdAt: now,
        });
        matchedVendorUserIds.add(profile.userId);
      } else if (serviceMatch) {
        await ctx.db.insert("notifications", {
          userId: profile.userId,
          type: "rfq_match",
          rfqId,
          message: `New RFQ matches your services: "${args.title}"`,
          isRead: false,
          createdAt: now,
        });
        matchedVendorUserIds.add(profile.userId);
      }
    }

    return rfqId;
  },
});

export const closeRfq = mutation({
  args: { rfqId: v.id("rfqs"), facilityManagerId: v.id("users") },
  handler: async (ctx, args) => {
    const rfq = await ctx.db.get(args.rfqId);
    if (!rfq || rfq.facilityManagerId !== args.facilityManagerId) throw new Error("Unauthorized");
    if (rfq.status !== "open") throw new Error("RFQ is not open");
    await ctx.db.patch(args.rfqId, { status: "closed", updatedAt: Date.now() });
  },
});

export const submitProposal = mutation({
  args: {
    rfqId: v.id("rfqs"),
    vendorProfileId: v.id("vendorProfiles"),
    proposalText: v.string(),
    estimatedCost: v.optional(v.string()),
    estimatedTimeline: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify RFQ is open
    const rfq = await ctx.db.get(args.rfqId);
    if (!rfq || rfq.status !== "open") throw new Error("RFQ is not accepting proposals");

    // Verify vendor profile exists and is published
    const profile = await ctx.db.get(args.vendorProfileId);
    if (!profile || !profile.isPublished) throw new Error("Vendor profile not found");

    // Check for duplicate response
    const existing = await ctx.db
      .query("rfqResponses")
      .withIndex("by_rfqId_vendorProfileId", (q) =>
        q.eq("rfqId", args.rfqId).eq("vendorProfileId", args.vendorProfileId)
      )
      .unique();
    if (existing) throw new Error("You have already responded to this RFQ");

    const now = Date.now();
    await ctx.db.insert("rfqResponses", {
      ...args,
      status: "submitted",
      createdAt: now,
    });

    // Notify the facility manager
    await ctx.db.insert("notifications", {
      userId: rfq.facilityManagerId,
      type: "rfq_response",
      rfqId: args.rfqId,
      message: `${profile.companyName} submitted a proposal for "${rfq.title}"`,
      isRead: false,
      createdAt: now,
    });
  },
});

export const acceptProposal = mutation({
  args: {
    responseId: v.id("rfqResponses"),
    facilityManagerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const response = await ctx.db.get(args.responseId);
    if (!response) throw new Error("Response not found");

    const rfq = await ctx.db.get(response.rfqId);
    if (!rfq || rfq.facilityManagerId !== args.facilityManagerId) throw new Error("Unauthorized");

    const now = Date.now();

    // Accept this response
    await ctx.db.patch(args.responseId, { status: "accepted" });

    // Decline all other responses for this RFQ
    const otherResponses = await ctx.db
      .query("rfqResponses")
      .withIndex("by_rfqId", (q) => q.eq("rfqId", response.rfqId))
      .collect();
    for (const other of otherResponses) {
      if (other._id !== args.responseId && other.status === "submitted") {
        await ctx.db.patch(other._id, { status: "declined" });
      }
    }

    // Award the RFQ
    await ctx.db.patch(response.rfqId, { status: "awarded", updatedAt: now });

    // Notify the winning vendor
    const profile = await ctx.db.get(response.vendorProfileId);
    if (profile) {
      await ctx.db.insert("notifications", {
        userId: profile.userId,
        type: "rfq_accepted",
        rfqId: response.rfqId,
        message: `Your proposal for "${rfq.title}" has been accepted!`,
        isRead: false,
        createdAt: now,
      });
    }
  },
});

export const declineProposal = mutation({
  args: {
    responseId: v.id("rfqResponses"),
    facilityManagerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const response = await ctx.db.get(args.responseId);
    if (!response) throw new Error("Response not found");

    const rfq = await ctx.db.get(response.rfqId);
    if (!rfq || rfq.facilityManagerId !== args.facilityManagerId) throw new Error("Unauthorized");

    await ctx.db.patch(args.responseId, { status: "declined" });
  },
});

export const markNotificationRead = mutation({
  args: { notificationId: v.id("notifications"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== args.userId) throw new Error("Unauthorized");
    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});

export const markAllNotificationsRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", (q) => q.eq("userId", args.userId).eq("isRead", false))
      .collect();
    for (const n of unread) {
      await ctx.db.patch(n._id, { isRead: true });
    }
  },
});
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build passes

**Step 3: Commit**

```bash
git add convex/rfqMutations.ts
git commit -m "feat: add RFQ mutation functions (create, respond, accept, decline, notifications)"
```

---

## Task 4: RFQ Card Component + Skeleton

**Files:**
- Create: `components/RfqCard.tsx`
- Create: `components/SkeletonRfq.tsx`

**Step 1: Create the RFQ card component**

Create `components/RfqCard.tsx`:

```tsx
import Link from "next/link";
import { Doc } from "@/convex/_generated/dataModel";

function timelineColor(timeline: string) {
  if (timeline.includes("Urgent")) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  if (timeline.includes("1–3")) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
  return "bg-green/10 text-green";
}

function deadlineText(deadline: number) {
  const now = Date.now();
  const days = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
  if (days < 0) return "Expired";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `${days} days left`;
}

export function RfqCard({
  rfq,
  badge,
}: {
  rfq: Doc<"rfqs"> & { responseCount?: number };
  badge?: "Matched" | "Invited";
}) {
  const topServices = rfq.services.slice(0, 3);
  const preview =
    rfq.description.slice(0, 120) + (rfq.description.length > 120 ? "…" : "");

  return (
    <Link href={`/rfq/${rfq._id}`}>
      <div className="bg-white dark:bg-navy-light border border-cream-dark rounded-xl p-6 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer h-full flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-lg font-semibold text-navy truncate flex-1">
            {rfq.title}
          </h3>
          {badge && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
              badge === "Invited"
                ? "bg-navy/10 text-navy dark:bg-white/10 dark:text-white"
                : "bg-green/10 text-green"
            }`}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-1">{rfq.serviceArea}</p>
        <p className="text-sm text-gray-600 mb-4 flex-1">{preview}</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {topServices.map((s) => (
            <span
              key={s}
              className="text-xs bg-green/10 text-green font-medium px-2.5 py-1 rounded-full"
            >
              {s.split("(")[0].trim()}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-cream-dark">
          <span className={`px-2 py-0.5 rounded-full font-medium ${timelineColor(rfq.timeline)}`}>
            {rfq.timeline}
          </span>
          <span>{deadlineText(rfq.deadline)}</span>
          {rfq.responseCount !== undefined && (
            <span>{rfq.responseCount} proposal{rfq.responseCount !== 1 ? "s" : ""}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
```

**Step 2: Create skeleton**

Create `components/SkeletonRfq.tsx`:

```tsx
export function SkeletonRfq() {
  return (
    <div className="bg-white dark:bg-navy-light border border-cream-dark rounded-xl p-6 h-full flex flex-col animate-pulse">
      <div className="h-5 bg-cream-dark rounded w-3/4 mb-2" />
      <div className="h-3 bg-cream-dark rounded w-1/3 mb-4" />
      <div className="space-y-2 flex-1 mb-4">
        <div className="h-3 bg-cream-dark rounded w-full" />
        <div className="h-3 bg-cream-dark rounded w-5/6" />
      </div>
      <div className="flex gap-2 mb-3">
        <div className="h-6 bg-cream-dark rounded-full w-20" />
        <div className="h-6 bg-cream-dark rounded-full w-16" />
      </div>
      <div className="flex justify-between pt-3 border-t border-cream-dark">
        <div className="h-5 bg-cream-dark rounded-full w-24" />
        <div className="h-4 bg-cream-dark rounded w-16" />
      </div>
    </div>
  );
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build passes

**Step 4: Commit**

```bash
git add components/RfqCard.tsx components/SkeletonRfq.tsx
git commit -m "feat: add RfqCard and SkeletonRfq components"
```

---

## Task 5: RFQ Board Page (`/rfq`)

**Files:**
- Create: `app/rfq/page.tsx`
- Create: `app/rfq/RfqBoardClient.tsx`

**Step 1: Create server page wrapper**

Create `app/rfq/page.tsx`:

```tsx
import { Metadata } from "next";
import RfqBoardClient from "./RfqBoardClient";

export const metadata: Metadata = {
  title: "RFQ Board | EnviroConnect",
  description: "Browse open requests for quotes from facility managers seeking environmental compliance services.",
};

export default function RfqBoardPage() {
  return <RfqBoardClient />;
}
```

**Step 2: Create client component with filters and pagination**

Create `app/rfq/RfqBoardClient.tsx`:

```tsx
"use client";
import { useState } from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { RfqCard } from "@/components/RfqCard";
import { SkeletonRfq } from "@/components/SkeletonRfq";
import { SERVICE_TYPES, SERVICE_AREAS, TIMELINE_OPTIONS } from "@/lib/constants";
import Link from "next/link";

export default function RfqBoardClient() {
  const { user, isLoaded } = useUser();
  const dbUser = useQuery(
    api.users.getUserByClerkId,
    isLoaded && user ? { clerkId: user.id } : "skip"
  );

  const [search, setSearch] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [region, setRegion] = useState("");
  const [timeline, setTimeline] = useState("");
  const [page, setPage] = useState(1);

  const result = useQuery(api.rfqs.getRfqs, {
    search: search || undefined,
    serviceType: serviceType || undefined,
    region: region || undefined,
    timeline: timeline || undefined,
    page,
  });

  const totalPages = result ? Math.ceil(result.total / result.pageSize) : 1;
  const hasFilters = search || serviceType || region || timeline;

  return (
    <main className="min-h-screen bg-cream">
      <div className="bg-navy text-white py-8 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">RFQ Board</h1>
            <p className="text-gray-300 text-sm mt-1">
              Browse open requests for quotes from facility managers
            </p>
          </div>
          {dbUser?.role === "facility_manager" && (
            <Link
              href="/rfq/new"
              className="bg-green hover:bg-green-light text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Post an RFQ
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            placeholder="Search RFQs..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 min-w-[200px] border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy-light dark:border-navy-light dark:text-white focus:outline-none focus:ring-2 focus:ring-green/50"
          />
          <select
            value={serviceType}
            onChange={(e) => { setServiceType(e.target.value); setPage(1); }}
            className="border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy-light dark:border-navy-light dark:text-white"
          >
            <option value="">All Services</option>
            {SERVICE_TYPES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={region}
            onChange={(e) => { setRegion(e.target.value); setPage(1); }}
            className="border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy-light dark:border-navy-light dark:text-white"
          >
            <option value="">All Regions</option>
            {SERVICE_AREAS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select
            value={timeline}
            onChange={(e) => { setTimeline(e.target.value); setPage(1); }}
            className="border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy-light dark:border-navy-light dark:text-white"
          >
            <option value="">All Timelines</option>
            {TIMELINE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setServiceType(""); setRegion(""); setTimeline(""); setPage(1); }}
              className="text-sm text-navy hover:underline dark:text-gray-300"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Results */}
        {result === undefined && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonRfq key={i} />
            ))}
          </div>
        )}

        {result && result.rfqs.length === 0 && (
          <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-10 text-center">
            <p className="text-gray-500 mb-2">No open RFQs found.</p>
            {hasFilters && (
              <p className="text-sm text-gray-400">Try adjusting your filters.</p>
            )}
          </div>
        )}

        {result && result.rfqs.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-4">{result.total} open RFQ{result.total !== 1 ? "s" : ""}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {result.rfqs.map((rfq) => (
                <RfqCard key={rfq._id} rfq={rfq} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="text-sm text-navy font-medium disabled:opacity-40 hover:underline dark:text-gray-300"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="text-sm text-navy font-medium disabled:opacity-40 hover:underline dark:text-gray-300"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build passes

**Step 4: Commit**

```bash
git add app/rfq/page.tsx app/rfq/RfqBoardClient.tsx
git commit -m "feat: add RFQ board page with filters and pagination"
```

---

## Task 6: Create RFQ Page (`/rfq/new`)

**Files:**
- Create: `app/rfq/new/page.tsx`

**Step 1: Create the RFQ form page**

Create `app/rfq/new/page.tsx`:

```tsx
"use client";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { SERVICE_TYPES, SERVICE_AREAS, BUDGET_RANGES, TIMELINE_OPTIONS } from "@/lib/constants";
import Link from "next/link";

export default function CreateRfqPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const dbUser = useQuery(
    api.users.getUserByClerkId,
    isLoaded && user ? { clerkId: user.id } : "skip"
  );
  const createRfq = useMutation(api.rfqMutations.createRfq);

  // Fetch published vendors for invite search
  const allVendors = useQuery(api.vendors.getVendorProfiles, { page: 1 });

  const [form, setForm] = useState({
    title: "",
    description: "",
    services: [] as string[],
    serviceArea: "",
    budgetRange: "",
    deadline: "",
    timeline: "",
    requirements: "",
  });
  const [invitedVendorIds, setInvitedVendorIds] = useState<string[]>([]);
  const [vendorSearch, setVendorSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleService = (service: string) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const filteredVendors = allVendors?.profiles.filter(
    (v) =>
      !invitedVendorIds.includes(v._id) &&
      v.companyName.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!dbUser) return;
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (form.services.length === 0) { setError("Select at least one service type"); return; }
    if (!form.serviceArea) { setError("Select a service area"); return; }
    if (!form.deadline) { setError("Set a proposal deadline"); return; }
    if (!form.timeline) { setError("Select a timeline"); return; }

    setSaving(true);
    setError("");
    try {
      const rfqId = await createRfq({
        facilityManagerId: dbUser._id,
        title: form.title.trim(),
        description: form.description.trim(),
        services: form.services,
        serviceArea: form.serviceArea,
        budgetRange: form.budgetRange || undefined,
        deadline: new Date(form.deadline).getTime(),
        timeline: form.timeline,
        requirements: form.requirements.trim() || undefined,
        invitedVendors: invitedVendorIds.length > 0 ? invitedVendorIds as any : undefined,
      });
      router.push(`/rfq/${rfqId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create RFQ");
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded || !dbUser) {
    return (
      <main className="min-h-screen bg-cream">
        <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse">
          <div className="h-8 bg-cream-dark rounded w-48 mb-8" />
          <div className="space-y-6">
            <div className="h-10 bg-cream-dark rounded" />
            <div className="h-32 bg-cream-dark rounded" />
            <div className="h-10 bg-cream-dark rounded w-1/2" />
          </div>
        </div>
      </main>
    );
  }

  if (dbUser.role !== "facility_manager") {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Only facility managers can post RFQs.</p>
          <Link href="/rfq" className="text-navy font-medium underline hover:no-underline">
            Browse RFQs
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="bg-navy text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold">Post a Request for Quote</h1>
          <p className="text-gray-300 text-sm mt-1">
            Describe what you need — matching vendors will be notified automatically
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {/* Title */}
        <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6">
          <label className="block text-sm font-semibold text-navy mb-2">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="e.g. Need SPCC Plan Update for Tacoma Facility"
            className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:border-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-green/50"
          />
        </div>

        {/* Description */}
        <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6">
          <label className="block text-sm font-semibold text-navy mb-2">Description *</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the work you need done, including scope, location details, and any relevant background..."
            rows={5}
            maxLength={2000}
            className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:border-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-green/50 resize-vertical"
          />
          <p className="text-xs text-gray-400 mt-1">{form.description.length}/2000</p>
        </div>

        {/* Services */}
        <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6">
          <label className="block text-sm font-semibold text-navy mb-3">Services Needed *</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SERVICE_TYPES.map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.services.includes(s)}
                  onChange={() => toggleService(s)}
                  className="rounded border-cream-dark text-green focus:ring-green"
                />
                <span className="text-gray-700 dark:text-gray-300">{s}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Service Area, Budget, Deadline, Timeline */}
        <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Service Area *</label>
            <select
              value={form.serviceArea}
              onChange={(e) => setForm((prev) => ({ ...prev, serviceArea: e.target.value }))}
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:border-navy dark:text-white"
            >
              <option value="">Select region</option>
              {SERVICE_AREAS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Budget Range</label>
            <select
              value={form.budgetRange}
              onChange={(e) => setForm((prev) => ({ ...prev, budgetRange: e.target.value }))}
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:border-navy dark:text-white"
            >
              <option value="">Prefer not to say</option>
              {BUDGET_RANGES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Proposal Deadline *</label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
              min={new Date().toISOString().split("T")[0]}
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:border-navy dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Work Timeline *</label>
            <select
              value={form.timeline}
              onChange={(e) => setForm((prev) => ({ ...prev, timeline: e.target.value }))}
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:border-navy dark:text-white"
            >
              <option value="">Select timeline</option>
              {TIMELINE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Additional Requirements */}
        <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6">
          <label className="block text-sm font-semibold text-navy mb-2">Additional Requirements</label>
          <textarea
            value={form.requirements}
            onChange={(e) => setForm((prev) => ({ ...prev, requirements: e.target.value }))}
            placeholder="e.g. Must carry $2M general liability insurance, HAZWOPER certification required, bonding requirements..."
            rows={3}
            maxLength={1000}
            className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:border-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-green/50 resize-vertical"
          />
          <p className="text-xs text-gray-400 mt-1">{form.requirements.length}/1000</p>
        </div>

        {/* Invite Specific Vendors (optional) */}
        <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6">
          <label className="block text-sm font-semibold text-navy mb-2">Invite Specific Vendors (optional)</label>
          <p className="text-xs text-gray-500 mb-3">
            All matching vendors will be notified automatically. Use this to additionally invite specific vendors.
          </p>
          <input
            type="text"
            value={vendorSearch}
            onChange={(e) => setVendorSearch(e.target.value)}
            placeholder="Search vendors by name..."
            className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:border-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-green/50 mb-2"
          />
          {vendorSearch && filteredVendors && filteredVendors.length > 0 && (
            <div className="border border-cream-dark rounded-lg max-h-40 overflow-y-auto">
              {filteredVendors.slice(0, 5).map((v) => (
                <button
                  key={v._id}
                  onClick={() => {
                    setInvitedVendorIds((prev) => [...prev, v._id]);
                    setVendorSearch("");
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-cream dark:hover:bg-navy transition-colors"
                >
                  {v.companyName}
                </button>
              ))}
            </div>
          )}
          {invitedVendorIds.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {invitedVendorIds.map((id) => {
                const vendor = allVendors?.profiles.find((v) => v._id === id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 text-xs bg-green/10 text-green font-medium px-2.5 py-1 rounded-full"
                  >
                    {vendor?.companyName ?? "Vendor"}
                    <button
                      onClick={() => setInvitedVendorIds((prev) => prev.filter((i) => i !== id))}
                      className="text-green hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Submit */}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-green hover:bg-green-light text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "Posting..." : "Post RFQ"}
          </button>
          <Link
            href="/rfq"
            className="border border-cream-dark text-navy hover:bg-cream px-6 py-3 rounded-lg transition-colors text-center font-medium dark:text-gray-300 dark:border-navy-light dark:hover:bg-navy"
          >
            Cancel
          </Link>
        </div>
      </div>
    </main>
  );
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build passes

**Step 3: Commit**

```bash
git add app/rfq/new/page.tsx
git commit -m "feat: add Create RFQ form page with vendor invites"
```

---

## Task 7: RFQ Detail Page (`/rfq/[id]`)

**Files:**
- Create: `app/rfq/[id]/page.tsx`

**Step 1: Create the RFQ detail page**

Create `app/rfq/[id]/page.tsx`:

```tsx
"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useState } from "react";

function timelineColor(timeline: string) {
  if (timeline.includes("Urgent")) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  if (timeline.includes("1–3")) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
  return "bg-green/10 text-green";
}

function statusColor(status: string) {
  if (status === "open") return "bg-green/10 text-green";
  if (status === "awarded") return "bg-navy/10 text-navy dark:bg-white/10 dark:text-white";
  return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
}

export default function RfqDetailPage() {
  const params = useParams();
  const rfqId = params.id as Id<"rfqs">;
  const { user, isLoaded } = useUser();
  const dbUser = useQuery(
    api.users.getUserByClerkId,
    isLoaded && user ? { clerkId: user.id } : "skip"
  );

  const rfq = useQuery(api.rfqs.getRfq, { id: rfqId });
  const responses = useQuery(api.rfqs.getRfqResponses, { rfqId });

  // Vendor-specific queries
  const vendorProfile = useQuery(
    api.vendors.getVendorProfileByUserId,
    dbUser?.role === "vendor" ? { userId: dbUser._id } : "skip"
  );
  const hasResponded = useQuery(
    api.rfqs.hasVendorResponded,
    vendorProfile ? { rfqId, vendorProfileId: vendorProfile._id } : "skip"
  );

  const submitProposal = useMutation(api.rfqMutations.submitProposal);
  const acceptProposal = useMutation(api.rfqMutations.acceptProposal);
  const declineProposal = useMutation(api.rfqMutations.declineProposal);
  const closeRfq = useMutation(api.rfqMutations.closeRfq);

  const [proposalForm, setProposalForm] = useState({
    proposalText: "",
    estimatedCost: "",
    estimatedTimeline: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isOwner = dbUser && rfq && rfq.facilityManagerId === dbUser._id;
  const isVendor = dbUser?.role === "vendor";

  const handleSubmitProposal = async () => {
    if (!vendorProfile) return;
    if (!proposalForm.proposalText.trim()) { setError("Proposal text is required"); return; }

    setSubmitting(true);
    setError("");
    try {
      await submitProposal({
        rfqId,
        vendorProfileId: vendorProfile._id,
        proposalText: proposalForm.proposalText.trim(),
        estimatedCost: proposalForm.estimatedCost.trim() || undefined,
        estimatedTimeline: proposalForm.estimatedTimeline.trim() || undefined,
      });
      setSuccess("Proposal submitted!");
      setProposalForm({ proposalText: "", estimatedCost: "", estimatedTimeline: "" });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit proposal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (responseId: Id<"rfqResponses">) => {
    if (!dbUser) return;
    try {
      await acceptProposal({ responseId, facilityManagerId: dbUser._id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept proposal");
    }
  };

  const handleDecline = async (responseId: Id<"rfqResponses">) => {
    if (!dbUser) return;
    try {
      await declineProposal({ responseId, facilityManagerId: dbUser._id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decline proposal");
    }
  };

  const handleClose = async () => {
    if (!dbUser || !rfq) return;
    try {
      await closeRfq({ rfqId: rfq._id, facilityManagerId: dbUser._id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close RFQ");
    }
  };

  // Loading state
  if (rfq === undefined) {
    return (
      <main className="min-h-screen bg-cream">
        <div className="bg-navy text-white py-8 px-4">
          <div className="max-w-4xl mx-auto animate-pulse">
            <div className="h-7 bg-white/20 rounded w-64 mb-2" />
            <div className="h-4 bg-white/20 rounded w-40" />
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-6 animate-pulse">
          <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6 space-y-4">
            <div className="h-4 bg-cream-dark rounded w-full" />
            <div className="h-4 bg-cream-dark rounded w-5/6" />
            <div className="h-4 bg-cream-dark rounded w-2/3" />
          </div>
        </div>
      </main>
    );
  }

  if (!rfq) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">RFQ not found.</p>
          <Link href="/rfq" className="text-navy font-medium underline hover:no-underline">
            Back to RFQ Board
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="bg-navy text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/rfq" className="text-sm text-gray-300 hover:text-white mb-2 inline-block">
            ← Back to RFQ Board
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold">{rfq.title}</h1>
              <p className="text-gray-300 text-sm mt-1">{rfq.serviceArea}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor(rfq.status)}`}>
                {rfq.status.charAt(0).toUpperCase() + rfq.status.slice(1)}
              </span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${timelineColor(rfq.timeline)}`}>
                {rfq.timeline}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6">
              <h2 className="text-lg font-semibold text-navy mb-3">Description</h2>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{rfq.description}</p>
            </div>

            {/* Requirements */}
            {rfq.requirements && (
              <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6">
                <h2 className="text-lg font-semibold text-navy mb-3">Additional Requirements</h2>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{rfq.requirements}</p>
              </div>
            )}

            {/* Services */}
            <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6">
              <h2 className="text-lg font-semibold text-navy mb-3">Services Needed</h2>
              <div className="flex flex-wrap gap-2">
                {rfq.services.map((s) => (
                  <span key={s} className="text-xs bg-green/10 text-green font-medium px-2.5 py-1 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Vendor: Submit Proposal */}
            {isVendor && vendorProfile && rfq.status === "open" && !hasResponded && (
              <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6">
                <h2 className="text-lg font-semibold text-navy mb-4">Submit a Proposal</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proposal *</label>
                    <textarea
                      value={proposalForm.proposalText}
                      onChange={(e) => setProposalForm((prev) => ({ ...prev, proposalText: e.target.value }))}
                      placeholder="Describe your approach, relevant experience, and what sets you apart..."
                      rows={5}
                      maxLength={2000}
                      className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:border-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-green/50 resize-vertical"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estimated Cost</label>
                      <input
                        type="text"
                        value={proposalForm.estimatedCost}
                        onChange={(e) => setProposalForm((prev) => ({ ...prev, estimatedCost: e.target.value }))}
                        placeholder="e.g. $8,500"
                        className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:border-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-green/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estimated Timeline</label>
                      <input
                        type="text"
                        value={proposalForm.estimatedTimeline}
                        onChange={(e) => setProposalForm((prev) => ({ ...prev, estimatedTimeline: e.target.value }))}
                        placeholder="e.g. 2-3 weeks"
                        className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:border-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-green/50"
                      />
                    </div>
                  </div>
                  {error && <p className="text-red-600 text-sm">{error}</p>}
                  {success && <p className="text-green text-sm font-medium">{success}</p>}
                  <button
                    onClick={handleSubmitProposal}
                    disabled={submitting}
                    className="bg-green hover:bg-green-light text-white font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit Proposal"}
                  </button>
                </div>
              </div>
            )}

            {isVendor && hasResponded && (
              <div className="bg-green/5 border border-green/20 rounded-xl p-6 text-center">
                <p className="text-green font-medium">You have already submitted a proposal for this RFQ.</p>
              </div>
            )}

            {/* FM: View Responses */}
            {isOwner && (
              <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6">
                <h2 className="text-lg font-semibold text-navy mb-4">
                  Proposals ({responses?.length ?? 0})
                </h2>
                {responses === undefined && (
                  <div className="animate-pulse space-y-4">
                    <div className="h-20 bg-cream-dark rounded" />
                    <div className="h-20 bg-cream-dark rounded" />
                  </div>
                )}
                {responses?.length === 0 && (
                  <p className="text-gray-500 text-sm">No proposals yet.</p>
                )}
                {responses && responses.length > 0 && (
                  <div className="space-y-4">
                    {responses.map((r) => (
                      <div key={r._id} className="border border-cream-dark rounded-lg p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <Link
                              href={`/directory/${r.vendorProfileId}`}
                              className="font-semibold text-navy hover:underline"
                            >
                              {r.vendorProfile?.companyName ?? "Unknown Vendor"}
                            </Link>
                            <p className="text-xs text-gray-500">
                              {new Date(r.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            r.status === "accepted" ? "bg-green/10 text-green" :
                            r.status === "declined" ? "bg-red-100 text-red-600" :
                            "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                          }`}>
                            {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-3">{r.proposalText}</p>
                        <div className="flex gap-4 text-sm text-gray-500 mb-3">
                          {r.estimatedCost && <span>Cost: <strong className="text-navy dark:text-white">{r.estimatedCost}</strong></span>}
                          {r.estimatedTimeline && <span>Timeline: <strong className="text-navy dark:text-white">{r.estimatedTimeline}</strong></span>}
                        </div>
                        {rfq.status === "open" && r.status === "submitted" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAccept(r._id)}
                              className="text-sm bg-green hover:bg-green-light text-white px-4 py-1.5 rounded-lg transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleDecline(r._id)}
                              className="text-sm border border-cream-dark text-gray-600 hover:bg-cream px-4 py-1.5 rounded-lg transition-colors dark:text-gray-300 dark:border-navy dark:hover:bg-navy"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6">
              <h2 className="text-sm font-semibold text-navy mb-3">Details</h2>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500 text-xs uppercase tracking-wide">Proposal Deadline</dt>
                  <dd className="text-navy dark:text-white font-medium">
                    {new Date(rfq.deadline).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 text-xs uppercase tracking-wide">Work Timeline</dt>
                  <dd className="text-navy dark:text-white font-medium">{rfq.timeline}</dd>
                </div>
                {rfq.budgetRange && (
                  <div>
                    <dt className="text-gray-500 text-xs uppercase tracking-wide">Budget Range</dt>
                    <dd className="text-navy dark:text-white font-medium">{rfq.budgetRange}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-gray-500 text-xs uppercase tracking-wide">Posted</dt>
                  <dd className="text-navy dark:text-white font-medium">
                    {new Date(rfq.createdAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>

            {/* FM controls */}
            {isOwner && rfq.status === "open" && (
              <button
                onClick={handleClose}
                className="w-full text-sm border border-red-200 text-red-600 hover:bg-red-50 py-2 rounded-lg transition-colors dark:border-red-900 dark:hover:bg-red-900/20"
              >
                Close RFQ
              </button>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build passes

**Step 3: Commit**

```bash
git add app/rfq/\[id\]/page.tsx
git commit -m "feat: add RFQ detail page with proposal submission and review"
```

---

## Task 8: Dashboard Updates (FM + Vendor)

**Files:**
- Modify: `app/dashboard/facility/page.tsx`
- Modify: `app/dashboard/vendor/page.tsx`

**Step 1: Add "My RFQs" section to FM dashboard**

In `app/dashboard/facility/page.tsx`, add RFQ section after the saved vendors section. Import `useQuery` from convex, add `api.rfqs.getMyRfqs` query, and render an "My RFQs" section with links to each RFQ showing title, status badge, and response count.

The key additions:
- Add `getMyRfqs` query chained from `dbUser`
- Add a "My RFQs" section header with "Post an RFQ" link
- Render each RFQ as a card row with title, status badge, response count, and link to `/rfq/[id]`
- Add "Browse RFQs" button in header alongside "Browse Directory"

**Step 2: Add "RFQ Matches" section to vendor dashboard**

In `app/dashboard/vendor/page.tsx`, add RFQ matches section. Import `getMatchedRfqs` query, chain from vendor profile, and render matched RFQs with "Invited"/"Matched" badges.

The key additions:
- Add `getMatchedRfqs` query chained from `vendorProfile`
- Add "RFQ Matches" section below the profile form
- Render each matched RFQ as a compact card with title, badge (Invited/Matched), timeline, and link

**Step 3: Verify build**

Run: `npm run build`
Expected: Build passes

**Step 4: Commit**

```bash
git add app/dashboard/facility/page.tsx app/dashboard/vendor/page.tsx
git commit -m "feat: add RFQ sections to facility manager and vendor dashboards"
```

---

## Task 9: Notification Bell in Navbar

**Files:**
- Modify: `components/Navbar.tsx`
- Create: `components/NotificationBell.tsx`

**Step 1: Create NotificationBell component**

Create `components/NotificationBell.tsx`:

```tsx
"use client";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";

export function NotificationBell({ userId }: { userId: Id<"users"> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unreadCount = useQuery(api.rfqs.getUnreadNotificationCount, { userId });
  const notifications = useQuery(api.rfqs.getNotifications, { userId });
  const markRead = useMutation(api.rfqMutations.markNotificationRead);
  const markAllRead = useMutation(api.rfqMutations.markAllNotificationsRead);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClick = (notificationId: Id<"notifications">) => {
    markRead({ notificationId, userId });
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {(unreadCount ?? 0) > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount! > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-navy-light border border-cream-dark rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-cream-dark">
            <h3 className="text-sm font-semibold text-navy dark:text-white">Notifications</h3>
            {(unreadCount ?? 0) > 0 && (
              <button
                onClick={() => markAllRead({ userId })}
                className="text-xs text-green hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications?.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-6">No notifications</p>
            )}
            {notifications?.slice(0, 20).map((n) => (
              <Link
                key={n._id}
                href={`/rfq/${n.rfqId}`}
                onClick={() => handleClick(n._id)}
                className={`block px-4 py-3 text-sm border-b border-cream-dark last:border-0 hover:bg-cream dark:hover:bg-navy transition-colors ${
                  !n.isRead ? "bg-green/5" : ""
                }`}
              >
                <p className={`text-gray-700 dark:text-gray-300 ${!n.isRead ? "font-medium" : ""}`}>
                  {n.message}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(n.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Add NotificationBell and RFQs link to Navbar**

In `components/Navbar.tsx`:
- Import `NotificationBell` and `useQuery` + `api`
- Add `dbUser` query (chained from Clerk user)
- Add "RFQs" link in `navLinks` after "Find Vendors"
- Add `<NotificationBell userId={dbUser._id} />` next to Dashboard link when user is logged in

**Step 3: Verify build**

Run: `npm run build`
Expected: Build passes

**Step 4: Commit**

```bash
git add components/NotificationBell.tsx components/Navbar.tsx
git commit -m "feat: add notification bell and RFQs nav link"
```

---

## Task 10: "Request Quote" Button on Vendor Profile

**Files:**
- Modify: `app/directory/[id]/page.tsx`

**Step 1: Add "Request Quote" button to vendor profile sidebar**

In the vendor profile detail page, add a "Request Quote" button in the sidebar for facility managers. This button links to `/rfq/new?invite={vendorProfileId}` to pre-select the vendor as an invite.

For unauthenticated users, show a gated "Request Quote" button that prompts sign-up (following the existing gating pattern).

**Step 2: Update the Create RFQ page to read URL params**

In `app/rfq/new/page.tsx`, add logic to read `?invite=` from the URL search params and pre-populate `invitedVendorIds` state with that vendor.

**Step 3: Verify build**

Run: `npm run build`
Expected: Build passes

**Step 4: Commit**

```bash
git add app/directory/\[id\]/page.tsx app/rfq/new/page.tsx
git commit -m "feat: add Request Quote button on vendor profiles"
```

---

## Task 11: Update Middleware + Final Integration

**Files:**
- Modify: `middleware.ts` (if RFQ pages need route protection)
- Modify: `app/page.tsx` (add RFQ mention to landing page)

**Step 1: Verify middleware**

Check `middleware.ts` — the existing config protects `/dashboard/**`. The `/rfq` board is public (browsable by all logged-in users). `/rfq/new` should be accessible only to authenticated facility managers (enforced in the page component, not middleware). No middleware changes needed unless we want to protect `/rfq/new` at the route level.

**Step 2: Add RFQ mention to landing page**

Add a brief mention in the "How It Works" or features section of the landing page. Could be a 4th step: "Post an RFQ and get proposals from qualified vendors." Keep it minimal.

**Step 3: Full build verification**

Run: `npm run build`
Expected: Build passes with zero errors

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: RFQ system integration — landing page mention, final polish"
```

---

## Task 12: Push and Verify Deployment

**Step 1: Push to GitHub**

```bash
git push origin main
```

**Step 2: Verify Vercel deployment**

Wait for Vercel auto-deploy. Check the live site:
- `/rfq` page loads with filters
- `/rfq/new` form works for facility managers
- Notifications appear in navbar
- Dashboard sections show matched RFQs

**Step 3: Commit design doc**

```bash
git add docs/plans/2026-03-01-rfq-system-design.md docs/plans/2026-03-01-rfq-system.md
git commit -m "docs: add RFQ system design doc and implementation plan"
git push origin main
```
