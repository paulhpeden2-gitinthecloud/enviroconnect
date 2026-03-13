# Meeting Location Details & Reviews/Ratings Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add conditional location/platform fields to meeting requests, and build a reviews/ratings system where facility managers can rate vendors across 5 categories.

**Architecture:** Two independent features. Feature 1 adds `locationDetail` and `meetingLink` fields to the existing meeting scheduler — schema change, modal update, card display, calendar integration. Feature 2 adds a new `reviews` table, backend queries/mutations, review form modal, star rating component, and display on vendor cards and profile pages.

**Tech Stack:** Next.js 14, React, Convex, Tailwind v4, Clerk auth

---

## Feature 1: Meeting Location Details

### Task 1: Schema — Add locationDetail and meetingLink to meetingRequests

**Files:**
- Modify: `convex/schema.ts:141-175`

**Step 1: Add fields to schema**

Add two optional fields to the `meetingRequests` table definition, after the `meetingType` field (line 146):

```typescript
locationDetail: v.optional(v.string()),
meetingLink: v.optional(v.string()),
```

**Step 2: Run codegen**

Run: `npx convex codegen`
Expected: Types regenerated successfully

**Step 3: Commit**

```bash
git add convex/schema.ts convex/_generated/
git commit -m "feat: add locationDetail and meetingLink fields to meetingRequests schema"
```

---

### Task 2: Backend — Update createMeetingRequest mutation to accept locationDetail

**Files:**
- Modify: `convex/meetings/mutations.ts:10-56`

**Step 1: Add locationDetail arg and persist it**

In the `createMeetingRequest` mutation args (line 11-18), add:
```typescript
locationDetail: v.optional(v.string()),
```

In the `ctx.db.insert` call (line 32-43), add `locationDetail: args.locationDetail` to the inserted object.

**Step 2: Commit**

```bash
git add convex/meetings/mutations.ts
git commit -m "feat: accept locationDetail in createMeetingRequest mutation"
```

---

### Task 3: Backend — Add updateMeetingLink mutation

**Files:**
- Modify: `convex/meetings/mutations.ts` (append new mutation)

**Step 1: Add mutation at end of file**

```typescript
export const updateMeetingLink = mutation({
  args: {
    meetingRequestId: v.id("meetingRequests"),
    userId: v.id("users"),
    meetingLink: v.string(),
  },
  handler: async (ctx, args) => {
    const meeting = await ctx.db.get(args.meetingRequestId);
    if (!meeting) throw new Error("Meeting request not found");
    if (meeting.status !== "confirmed") throw new Error("Meeting must be confirmed to add a link");

    const isParticipant = meeting.requesterId === args.userId || meeting.recipientId === args.userId;
    if (!isParticipant) throw new Error("Unauthorized");

    await ctx.db.patch(args.meetingRequestId, {
      meetingLink: args.meetingLink,
      updatedAt: Date.now(),
    });
  },
});
```

**Step 2: Run codegen**

Run: `npx convex codegen`

**Step 3: Commit**

```bash
git add convex/meetings/mutations.ts convex/_generated/
git commit -m "feat: add updateMeetingLink mutation"
```

---

### Task 4: Frontend — Add conditional location fields to MeetingRequestModal

**Files:**
- Modify: `components/meetings/MeetingRequestModal.tsx`

**Step 1: Add VIDEO_PLATFORMS constant and locationDetail state**

After the existing state declarations (line 30), add:
```typescript
const [locationDetail, setLocationDetail] = useState("");
```

At the top of the file (after imports, before the interface), add:
```typescript
const VIDEO_PLATFORMS = ["Microsoft Teams", "Zoom", "Google Meet"] as const;
```

**Step 2: Add conditional field UI after meeting type radio buttons**

After the meeting type `<div>` block (after line 117, before the TimeSlotPicker section), add:

```tsx
{meetingType === "phone" && (
  <div>
    <label className="block text-sm font-medium text-navy dark:text-cream mb-1">Phone Number *</label>
    <input
      type="tel"
      value={locationDetail}
      onChange={(e) => setLocationDetail(e.target.value)}
      placeholder="e.g., (206) 555-0123"
      className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:text-cream focus:outline-none focus:ring-2 focus:ring-green"
    />
  </div>
)}

{meetingType === "video" && (
  <div>
    <label className="block text-sm font-medium text-navy dark:text-cream mb-1">Video Platform *</label>
    <select
      value={locationDetail}
      onChange={(e) => setLocationDetail(e.target.value)}
      className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:text-cream focus:outline-none focus:ring-2 focus:ring-green"
    >
      <option value="">Select platform...</option>
      {VIDEO_PLATFORMS.map((p) => (
        <option key={p} value={p}>{p}</option>
      ))}
    </select>
  </div>
)}

{meetingType === "in_person" && (
  <div>
    <label className="block text-sm font-medium text-navy dark:text-cream mb-1">Location / Address *</label>
    <input
      type="text"
      value={locationDetail}
      onChange={(e) => setLocationDetail(e.target.value)}
      placeholder="e.g., 123 Main St, Seattle, WA"
      className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:text-cream focus:outline-none focus:ring-2 focus:ring-green"
    />
  </div>
)}
```

**Step 3: Clear locationDetail when meeting type changes**

Update the radio button `onChange` (line 108) to also clear locationDetail:
```tsx
onChange={() => { setMeetingType(type); setLocationDetail(""); }}
```

**Step 4: Add validation and pass locationDetail in submit**

In `handleSubmit`, after the time slots validation (line 46), add:
```typescript
if (!locationDetail.trim()) {
  setError(
    meetingType === "phone" ? "Phone number is required" :
    meetingType === "video" ? "Please select a video platform" :
    "Location is required"
  );
  return;
}
```

In the `createMeeting` call (lines 50-58), add `locationDetail: locationDetail.trim()` to the args object.

**Step 5: Commit**

```bash
git add components/meetings/MeetingRequestModal.tsx
git commit -m "feat: add conditional location fields to MeetingRequestModal"
```

---

### Task 5: Frontend — Display location detail and meeting link on MeetingCard

**Files:**
- Modify: `components/meetings/MeetingCard.tsx`

**Step 1: Add meetingLink editing state**

After line 39 (`const [submitting, setSubmitting] = useState(false);`), add:
```typescript
const [editingLink, setEditingLink] = useState(false);
const [linkValue, setLinkValue] = useState(meeting.meetingLink ?? "");
const updateMeetingLink = useMutation(api.meetings.mutations.updateMeetingLink);
```

**Step 2: Add location detail display**

After the Note section (after line 118), add:

```tsx
{meeting.locationDetail && (
  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
    <span className="font-medium text-navy dark:text-cream">
      {meeting.meetingType === "phone" ? "Phone:" : meeting.meetingType === "video" ? "Platform:" : "Location:"}
    </span>
    {meeting.locationDetail}
  </div>
)}
```

**Step 3: Add meeting link display and edit UI in the confirmed slot section**

Inside the confirmed slot block (after CalendarLinks, around line 133), add:

```tsx
{meeting.meetingType === "video" && (
  <div className="mt-2">
    {meeting.meetingLink ? (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 dark:text-gray-400">Link:</span>
        <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-green hover:underline break-all">
          {meeting.meetingLink}
        </a>
        <button onClick={() => { setEditingLink(true); setLinkValue(meeting.meetingLink ?? ""); }} className="text-xs text-gray-400 hover:text-gray-600">Edit</button>
      </div>
    ) : !editingLink ? (
      <button onClick={() => setEditingLink(true)} className="text-xs font-medium text-green hover:underline">
        + Add meeting link
      </button>
    ) : null}
    {editingLink && (
      <div className="flex items-center gap-2 mt-1">
        <input
          type="url"
          value={linkValue}
          onChange={(e) => setLinkValue(e.target.value)}
          placeholder="Paste meeting link..."
          className="flex-1 border border-cream-dark rounded-lg px-2 py-1 text-xs bg-white dark:bg-navy dark:text-cream focus:outline-none focus:ring-2 focus:ring-green"
        />
        <button
          onClick={async () => {
            if (!linkValue.trim()) return;
            await updateMeetingLink({ meetingRequestId: meeting._id, userId: currentUserId, meetingLink: linkValue.trim() });
            setEditingLink(false);
          }}
          className="text-xs font-medium text-white bg-green px-3 py-1 rounded-lg hover:bg-green-light"
        >
          Save
        </button>
        <button onClick={() => setEditingLink(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
      </div>
    )}
  </div>
)}
```

**Step 4: Commit**

```bash
git add components/meetings/MeetingCard.tsx
git commit -m "feat: display location detail and meeting link on MeetingCard"
```

---

### Task 6: Frontend — Include location in CalendarLinks

**Files:**
- Modify: `components/meetings/CalendarLinks.tsx`

**Step 1: Add location and meetingLink props**

Update the interface (lines 3-9):
```typescript
interface CalendarLinksProps {
  subject: string;
  date: number;
  startTime: string;
  endTime: string;
  note?: string;
  location?: string;
  meetingLink?: string;
}
```

Update the function signature (line 25):
```typescript
export function CalendarLinks({ subject, date, startTime, endTime, note, location, meetingLink }: CalendarLinksProps) {
```

**Step 2: Build enhanced details string**

After line 28, replace the `details` line with:
```typescript
const detailParts = [note, location ? `Location: ${location}` : "", meetingLink ? `Meeting Link: ${meetingLink}` : ""].filter(Boolean).join("\n");
const details = encodeURIComponent(detailParts);
```

Also add location to the Google Calendar URL by adding `&location=${encodeURIComponent(location || meetingLink || "")}` to the `googleUrl` string.

**Step 3: Add LOCATION to .ics content**

In the `icsContent` array (lines 38-49), after the SUMMARY line, add:
```typescript
location ? `LOCATION:${location}` : "",
meetingLink ? `URL:${meetingLink}` : "",
```

**Step 4: Update CalendarLinks usage in MeetingCard**

In `components/meetings/MeetingCard.tsx`, update the `<CalendarLinks>` call (around line 126-132) to pass the new props:
```tsx
<CalendarLinks
  subject={meeting.subject}
  date={meeting.confirmedSlot.date}
  startTime={meeting.confirmedSlot.startTime}
  endTime={meeting.confirmedSlot.endTime}
  note={meeting.note}
  location={meeting.locationDetail}
  meetingLink={meeting.meetingLink}
/>
```

**Step 5: Commit**

```bash
git add components/meetings/CalendarLinks.tsx components/meetings/MeetingCard.tsx
git commit -m "feat: include location and meeting link in calendar events"
```

---

### Task 7: Build and verify Feature 1

**Step 1: Run build**

Run: `npm run build`
Expected: Build passes with no errors

**Step 2: Commit any fixes if needed**

---

## Feature 2: Reviews & Ratings

### Task 8: Schema — Add reviews table

**Files:**
- Modify: `convex/schema.ts`

**Step 1: Add reviews table**

After the `meetingRequests` table definition (after line 175, before the closing `});`), add:

```typescript
reviews: defineTable({
  reviewerId: v.id("users"),
  vendorId: v.id("users"),
  rfqId: v.optional(v.id("rfqs")),
  projectName: v.optional(v.string()),
  serviceType: v.string(),
  ratings: v.object({
    qualityOfWork: v.number(),
    communication: v.number(),
    timeliness: v.number(),
    complianceKnowledge: v.number(),
    value: v.number(),
  }),
  overallRating: v.number(),
  notes: v.optional(v.string()),
  serviceCompletedDate: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_vendorId", ["vendorId"])
  .index("by_reviewerId", ["reviewerId"])
  .index("by_vendorId_reviewerId", ["vendorId", "reviewerId"]),
```

**Step 2: Run codegen**

Run: `npx convex codegen`

**Step 3: Commit**

```bash
git add convex/schema.ts convex/_generated/
git commit -m "feat: add reviews table to schema"
```

---

### Task 9: Backend — Review queries

**Files:**
- Create: `convex/reviews/queries.ts`

**Step 1: Create queries file**

```typescript
import { query } from "../_generated/server";
import { v } from "convex/values";

export const getVendorReviews = query({
  args: { vendorId: v.id("users") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_vendorId", (q) => q.eq("vendorId", args.vendorId))
      .collect();

    const enriched = await Promise.all(
      reviews.map(async (r) => {
        const reviewer = await ctx.db.get(r.reviewerId);
        return { ...r, reviewerName: reviewer?.name ?? "Unknown", reviewerCompany: reviewer?.company ?? "" };
      })
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getVendorRatingSummary = query({
  args: { vendorId: v.id("users") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_vendorId", (q) => q.eq("vendorId", args.vendorId))
      .collect();

    if (reviews.length === 0) return null;

    const count = reviews.length;
    const sum = {
      qualityOfWork: 0,
      communication: 0,
      timeliness: 0,
      complianceKnowledge: 0,
      value: 0,
      overall: 0,
    };

    for (const r of reviews) {
      sum.qualityOfWork += r.ratings.qualityOfWork;
      sum.communication += r.ratings.communication;
      sum.timeliness += r.ratings.timeliness;
      sum.complianceKnowledge += r.ratings.complianceKnowledge;
      sum.value += r.ratings.value;
      sum.overall += r.overallRating;
    }

    return {
      count,
      overall: sum.overall / count,
      categories: {
        qualityOfWork: sum.qualityOfWork / count,
        communication: sum.communication / count,
        timeliness: sum.timeliness / count,
        complianceKnowledge: sum.complianceKnowledge / count,
        value: sum.value / count,
      },
    };
  },
});

export const getVendorRatingSummaryBatch = query({
  args: { vendorIds: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    const results: Record<string, { overall: number; count: number }> = {};

    for (const vendorId of args.vendorIds) {
      const reviews = await ctx.db
        .query("reviews")
        .withIndex("by_vendorId", (q) => q.eq("vendorId", vendorId))
        .collect();

      if (reviews.length > 0) {
        const overall = reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length;
        results[vendorId] = { overall, count: reviews.length };
      }
    }

    return results;
  },
});

export const canReviewVendor = query({
  args: {
    reviewerId: v.id("users"),
    vendorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if reviewer is a facility manager
    const reviewer = await ctx.db.get(args.reviewerId);
    if (!reviewer || reviewer.role !== "facility_manager") return { canReview: false as const, reason: "Only facility managers can leave reviews" };

    // Check for existing review without RFQ (endorsement path — one per vendor)
    const existingReviews = await ctx.db
      .query("reviews")
      .withIndex("by_vendorId_reviewerId", (q) =>
        q.eq("vendorId", args.vendorId).eq("reviewerId", args.reviewerId)
      )
      .collect();

    // Find vendor profile to check endorsements
    const vendorProfiles = await ctx.db
      .query("vendorProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.vendorId))
      .collect();
    const vendorProfile = vendorProfiles[0];

    // Check RFQ path: any accepted proposals from this vendor on reviewer's RFQs
    const reviewerRfqs = await ctx.db
      .query("rfqs")
      .withIndex("by_facilityManagerId", (q) => q.eq("facilityManagerId", args.reviewerId))
      .collect();

    const reviewableRfqs: Array<{ rfqId: string; title: string }> = [];
    if (vendorProfile) {
      for (const rfq of reviewerRfqs) {
        const responses = await ctx.db
          .query("rfqResponses")
          .withIndex("by_rfqId_vendorProfileId", (q) =>
            q.eq("rfqId", rfq._id).eq("vendorProfileId", vendorProfile._id)
          )
          .collect();
        const accepted = responses.find((r) => r.status === "accepted");
        if (accepted) {
          // Check if already reviewed for this RFQ
          const alreadyReviewed = existingReviews.find((er) => er.rfqId === rfq._id);
          if (!alreadyReviewed) {
            reviewableRfqs.push({ rfqId: rfq._id, title: rfq.title });
          }
        }
      }
    }

    // Check endorsement path
    let hasEndorsement = false;
    let hasEndorsementReview = false;
    if (vendorProfile) {
      const endorsement = await ctx.db
        .query("vendorEndorsements")
        .withIndex("by_endorserId_vendorProfileId", (q) =>
          q.eq("endorserId", args.reviewerId).eq("vendorProfileId", vendorProfile._id)
        )
        .first();
      hasEndorsement = !!endorsement;
      hasEndorsementReview = existingReviews.some((r) => !r.rfqId);
    }

    const canViaRfq = reviewableRfqs.length > 0;
    const canViaEndorsement = hasEndorsement && !hasEndorsementReview;

    if (!canViaRfq && !canViaEndorsement) {
      return { canReview: false as const, reason: "You need an accepted RFQ proposal or endorsement to review this vendor" };
    }

    return {
      canReview: true as const,
      reviewableRfqs,
      canViaEndorsement,
    };
  },
});
```

**Step 2: Run codegen**

Run: `npx convex codegen`

**Step 3: Commit**

```bash
git add convex/reviews/queries.ts convex/_generated/
git commit -m "feat: add review queries (vendor reviews, rating summary, eligibility check)"
```

---

### Task 10: Backend — Review mutations

**Files:**
- Create: `convex/reviews/mutations.ts`

**Step 1: Create mutations file**

```typescript
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const submitReview = mutation({
  args: {
    reviewerId: v.id("users"),
    vendorId: v.id("users"),
    rfqId: v.optional(v.id("rfqs")),
    projectName: v.optional(v.string()),
    serviceType: v.string(),
    ratings: v.object({
      qualityOfWork: v.number(),
      communication: v.number(),
      timeliness: v.number(),
      complianceKnowledge: v.number(),
      value: v.number(),
    }),
    notes: v.optional(v.string()),
    serviceCompletedDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const reviewer = await ctx.db.get(args.reviewerId);
    if (!reviewer || reviewer.role !== "facility_manager") {
      throw new Error("Only facility managers can submit reviews");
    }

    // Validate ratings are 1-5
    const ratingValues = Object.values(args.ratings);
    if (ratingValues.some((r) => r < 1 || r > 5 || !Number.isInteger(r))) {
      throw new Error("Ratings must be integers between 1 and 5");
    }

    // Must have either rfqId or projectName
    if (!args.rfqId && !args.projectName?.trim()) {
      throw new Error("Either an RFQ or project name is required");
    }

    // Check for duplicate
    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_vendorId_reviewerId", (q) =>
        q.eq("vendorId", args.vendorId).eq("reviewerId", args.reviewerId)
      )
      .collect();

    if (args.rfqId) {
      const duplicate = existing.find((r) => r.rfqId === args.rfqId);
      if (duplicate) throw new Error("You have already reviewed this vendor for this RFQ");
    } else {
      const endorsementReview = existing.find((r) => !r.rfqId);
      if (endorsementReview) throw new Error("You have already submitted a project review for this vendor");
    }

    const overallRating = ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length;
    const now = Date.now();

    return await ctx.db.insert("reviews", {
      reviewerId: args.reviewerId,
      vendorId: args.vendorId,
      rfqId: args.rfqId,
      projectName: args.projectName?.trim() || undefined,
      serviceType: args.serviceType,
      ratings: args.ratings,
      overallRating: Math.round(overallRating * 10) / 10,
      notes: args.notes?.trim() || undefined,
      serviceCompletedDate: args.serviceCompletedDate,
      createdAt: now,
      updatedAt: now,
    });
  },
});
```

**Step 2: Run codegen**

Run: `npx convex codegen`

**Step 3: Commit**

```bash
git add convex/reviews/mutations.ts convex/_generated/
git commit -m "feat: add submitReview mutation with validation and duplicate checks"
```

---

### Task 11: Frontend — StarRating component

**Files:**
- Create: `components/reviews/StarRating.tsx`

**Step 1: Create interactive star rating component**

```tsx
"use client";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md";
}

export function StarRating({ value, onChange, size = "md" }: StarRatingProps) {
  const starSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(star)}
          className={`${onChange ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
        >
          <svg
            className={`${starSize} ${star <= value ? "text-yellow-400 fill-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export function StarRatingDisplay({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const starSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const fullStars = Math.floor(value);
  const hasHalf = value - fullStars >= 0.25 && value - fullStars < 0.75;
  const roundUp = value - fullStars >= 0.75;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= fullStars || (roundUp && star === fullStars + 1);
        const half = hasHalf && star === fullStars + 1;
        return (
          <svg
            key={star}
            className={`${starSize} ${filled ? "text-yellow-400 fill-yellow-400" : half ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
            viewBox="0 0 20 20"
            fill={filled ? "currentColor" : "none"}
            stroke={half || !filled ? "currentColor" : "none"}
            strokeWidth={half || !filled ? 1 : 0}
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      })}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/reviews/StarRating.tsx
git commit -m "feat: add StarRating and StarRatingDisplay components"
```

---

### Task 12: Frontend — ReviewModal component

**Files:**
- Create: `components/reviews/ReviewModal.tsx`

**Step 1: Create the review form modal**

```tsx
"use client";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { StarRating } from "./StarRating";
import { SERVICE_TYPES } from "@/lib/constants";

interface ReviewModalProps {
  reviewerId: Id<"users">;
  vendorId: Id<"users">;
  vendorName: string;
  onClose: () => void;
}

const RATING_CATEGORIES = [
  { key: "qualityOfWork" as const, label: "Quality of Work" },
  { key: "communication" as const, label: "Communication" },
  { key: "timeliness" as const, label: "Timeliness" },
  { key: "complianceKnowledge" as const, label: "Compliance Knowledge" },
  { key: "value" as const, label: "Value" },
];

export function ReviewModal({ reviewerId, vendorId, vendorName, onClose }: ReviewModalProps) {
  const eligibility = useQuery(api.reviews.queries.canReviewVendor, { reviewerId, vendorId });
  const submitReview = useMutation(api.reviews.mutations.submitReview);

  const [reviewPath, setReviewPath] = useState<"rfq" | "endorsement" | null>(null);
  const [selectedRfqId, setSelectedRfqId] = useState<string>("");
  const [projectName, setProjectName] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [ratings, setRatings] = useState({
    qualityOfWork: 0,
    communication: 0,
    timeliness: 0,
    complianceKnowledge: 0,
    value: 0,
  });
  const [notes, setNotes] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const setRating = (key: keyof typeof ratings, val: number) => {
    setRatings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!serviceType) { setError("Service type is required"); return; }
    const allRated = Object.values(ratings).every((r) => r > 0);
    if (!allRated) { setError("Please rate all categories"); return; }

    if (reviewPath === "rfq" && !selectedRfqId) { setError("Please select an RFQ"); return; }
    if (reviewPath === "endorsement" && !projectName.trim()) { setError("Project name is required"); return; }

    setSubmitting(true);
    try {
      await submitReview({
        reviewerId,
        vendorId,
        rfqId: reviewPath === "rfq" ? selectedRfqId as Id<"rfqs"> : undefined,
        projectName: reviewPath === "endorsement" ? projectName.trim() : undefined,
        serviceType,
        ratings,
        notes: notes.trim() || undefined,
        serviceCompletedDate: serviceDate ? new Date(serviceDate).getTime() : undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (eligibility === undefined) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-navy-light rounded-xl shadow-xl p-8">
          <p className="text-sm text-gray-500">Checking eligibility...</p>
        </div>
      </div>
    );
  }

  if (!eligibility.canReview) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-navy-light rounded-xl shadow-xl p-8 max-w-sm text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{eligibility.reason}</p>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-navy text-white rounded-lg hover:bg-navy-light transition-colors">
            Close
          </button>
        </div>
      </div>
    );
  }

  // Auto-select path if only one is available
  const autoPath = !eligibility.canViaEndorsement ? "rfq" :
    eligibility.reviewableRfqs.length === 0 ? "endorsement" : null;
  const effectivePath = reviewPath ?? autoPath;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-navy-light rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-dark">
          <h2 className="text-lg font-semibold text-navy dark:text-cream">
            Review {vendorName}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Path selection (only if both paths available) */}
          {!autoPath && (
            <div>
              <label className="block text-sm font-medium text-navy dark:text-cream mb-2">Review based on:</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="reviewPath" value="rfq" checked={reviewPath === "rfq"} onChange={() => setReviewPath("rfq")} className="accent-green" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">RFQ Engagement</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="reviewPath" value="endorsement" checked={reviewPath === "endorsement"} onChange={() => setReviewPath("endorsement")} className="accent-green" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Past Project</span>
                </label>
              </div>
            </div>
          )}

          {/* RFQ selection */}
          {effectivePath === "rfq" && (
            <div>
              <label className="block text-sm font-medium text-navy dark:text-cream mb-1">Select RFQ *</label>
              <select
                value={selectedRfqId}
                onChange={(e) => setSelectedRfqId(e.target.value)}
                className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:text-cream focus:outline-none focus:ring-2 focus:ring-green"
              >
                <option value="">Select an RFQ...</option>
                {eligibility.reviewableRfqs.map((rfq) => (
                  <option key={rfq.rfqId} value={rfq.rfqId}>{rfq.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Project name for endorsement path */}
          {effectivePath === "endorsement" && (
            <div>
              <label className="block text-sm font-medium text-navy dark:text-cream mb-1">Project Name *</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Annual stormwater permit renewal"
                className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:text-cream focus:outline-none focus:ring-2 focus:ring-green"
              />
            </div>
          )}

          {/* Service type */}
          <div>
            <label className="block text-sm font-medium text-navy dark:text-cream mb-1">Service Type *</label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:text-cream focus:outline-none focus:ring-2 focus:ring-green"
            >
              <option value="">Select service...</option>
              {SERVICE_TYPES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Category ratings */}
          <div>
            <label className="block text-sm font-medium text-navy dark:text-cream mb-3">Ratings *</label>
            <div className="space-y-3">
              {RATING_CATEGORIES.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                  <StarRating value={ratings[key]} onChange={(val) => setRating(key, val)} />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-navy dark:text-cream mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Share your experience with this vendor's trustworthiness and performance..."
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:text-cream focus:outline-none focus:ring-2 focus:ring-green resize-none"
            />
          </div>

          {/* Date of service completed */}
          <div>
            <label className="block text-sm font-medium text-navy dark:text-cream mb-1">Date of Service Completed (optional)</label>
            <input
              type="date"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:text-cream focus:outline-none focus:ring-2 focus:ring-green"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-cream dark:hover:bg-navy rounded-lg transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !effectivePath}
              className="px-5 py-2 text-sm font-medium bg-green hover:bg-green-light text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/reviews/ReviewModal.tsx
git commit -m "feat: add ReviewModal component with dual path (RFQ + endorsement)"
```

---

### Task 13: Frontend — Add rating display to VendorCard

**Files:**
- Modify: `components/vendor/VendorCard.tsx`

**Step 1: Add rating prop and display**

Update the interface (lines 5-8):
```typescript
interface VendorCardProps {
  profile: Doc<"vendorProfiles">;
  endorsements?: { peerCount: number; clientCount: number };
  rating?: { overall: number; count: number };
}
```

Update the function signature (line 10):
```typescript
export function VendorCard({ profile, endorsements, rating }: VendorCardProps) {
```

Import `StarRatingDisplay` at the top:
```typescript
import { StarRatingDisplay } from "@/components/reviews/StarRating";
```

After the endorsement badge (after line 34), add:
```tsx
{rating && (
  <div className="flex items-center gap-1.5 mt-1">
    <StarRatingDisplay value={rating.overall} />
    <span className="text-xs text-gray-500">({rating.count})</span>
  </div>
)}
```

**Step 2: Commit**

```bash
git add components/vendor/VendorCard.tsx
git commit -m "feat: display star rating on VendorCard"
```

---

### Task 14: Frontend — Add reviews section and Write Review button to vendor profile page

**Files:**
- Modify: `app/directory/[id]/page.tsx`

**Step 1: Add imports**

Add to the imports at the top:
```typescript
import { ReviewModal } from "@/components/reviews/ReviewModal";
import { StarRatingDisplay } from "@/components/reviews/StarRating";
```

**Step 2: Add queries and state**

After the existing query/state declarations (after `showMeetingModal` state, around line 39), add:
```typescript
const [showReviewModal, setShowReviewModal] = useState(false);
const ratingSummary = useQuery(api.reviews.queries.getVendorRatingSummary, profile ? { vendorId: profile.userId } : "skip");
const vendorReviews = useQuery(api.reviews.queries.getVendorReviews, profile ? { vendorId: profile.userId } : "skip");
```

**Step 3: Add rating display in header**

After the endorsement badge in the header (after line 98), add:
```tsx
{ratingSummary && (
  <div className="flex items-center gap-2 mt-2">
    <StarRatingDisplay value={ratingSummary.overall} size="md" />
    <span className="text-gray-300 text-sm">{ratingSummary.overall.toFixed(1)} ({ratingSummary.count} {ratingSummary.count === 1 ? "review" : "reviews"})</span>
  </div>
)}
```

**Step 4: Add "Write a Review" button in sidebar**

After the Request Quote button section in the sidebar (around line 225), add:
```tsx
{dbUser?.role === "facility_manager" && dbUser._id !== profile?.userId && (
  <button
    onClick={() => setShowReviewModal(true)}
    className="w-full border-2 border-green text-green hover:bg-green hover:text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
  >
    Write a Review
  </button>
)}
```

**Step 5: Add reviews section in main content area**

After the Service Areas section (after line 189, before the closing `</div>` of the main content column), add:
```tsx
{vendorReviews && vendorReviews.length > 0 && (
  <section>
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold text-navy">Reviews</h2>
      {ratingSummary && (
        <div className="flex items-center gap-2">
          <StarRatingDisplay value={ratingSummary.overall} />
          <span className="text-sm text-gray-500">{ratingSummary.overall.toFixed(1)} avg</span>
        </div>
      )}
    </div>
    {ratingSummary && (
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Quality", value: ratingSummary.categories.qualityOfWork },
          { label: "Communication", value: ratingSummary.categories.communication },
          { label: "Timeliness", value: ratingSummary.categories.timeliness },
          { label: "Compliance", value: ratingSummary.categories.complianceKnowledge },
          { label: "Value", value: ratingSummary.categories.value },
        ].map(({ label, value }) => (
          <div key={label} className="text-center bg-white dark:bg-navy-light rounded-lg p-3 border border-cream-dark">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
            <p className="text-lg font-semibold text-navy dark:text-cream">{value.toFixed(1)}</p>
          </div>
        ))}
      </div>
    )}
    <div className="space-y-4">
      {vendorReviews.map((review) => (
        <div key={review._id} className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-5 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-navy dark:text-cream">{review.reviewerCompany}</p>
              <p className="text-xs text-gray-500">{review.serviceType}</p>
            </div>
            <div className="text-right">
              <StarRatingDisplay value={review.overallRating} />
              <p className="text-xs text-gray-400 mt-0.5">{new Date(review.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          {review.rfqId ? (
            <p className="text-xs text-gray-400">Via RFQ engagement</p>
          ) : review.projectName ? (
            <p className="text-xs text-gray-400">Project: {review.projectName}</p>
          ) : null}
          {review.serviceCompletedDate && (
            <p className="text-xs text-gray-400">Service completed: {new Date(review.serviceCompletedDate).toLocaleDateString()}</p>
          )}
          {review.notes && (
            <p className="text-sm text-gray-600 dark:text-gray-300">{review.notes}</p>
          )}
        </div>
      ))}
    </div>
  </section>
)}
```

**Step 6: Add ReviewModal render**

At the bottom, next to the existing modals (after the MeetingRequestModal block, around line 312), add:
```tsx
{showReviewModal && dbUser && profile && (
  <ReviewModal
    reviewerId={dbUser._id}
    vendorId={profile.userId}
    vendorName={profile.companyName}
    onClose={() => setShowReviewModal(false)}
  />
)}
```

**Step 7: Commit**

```bash
git add app/directory/[id]/page.tsx
git commit -m "feat: add reviews section and Write a Review button to vendor profile page"
```

---

### Task 15: Frontend — Wire rating data into vendor directory page

**Files:**
- Modify: the vendor directory page (the page that renders the VendorCard grid)

Find the directory page that maps over vendor profiles and renders `<VendorCard>` components. It likely uses `getVendorProfiles` query and renders a grid.

**Step 1: Add batch rating query**

Import and call `getVendorRatingSummaryBatch` with the array of vendor userIds from the loaded profiles. Pass the rating data to each `<VendorCard>` via the `rating` prop.

Pattern (adapt to actual file):
```typescript
const vendorIds = profiles?.map((p) => p.userId) ?? [];
const ratings = useQuery(
  api.reviews.queries.getVendorRatingSummaryBatch,
  vendorIds.length > 0 ? { vendorIds } : "skip"
);

// In the map:
<VendorCard
  profile={p}
  endorsements={endorsements?.[p._id]}
  rating={ratings?.[p.userId]}
/>
```

**Step 2: Commit**

```bash
git add app/directory/page.tsx
git commit -m "feat: display vendor ratings in directory grid"
```

---

### Task 16: Build and verify all changes

**Step 1: Run build**

Run: `npm run build`
Expected: Build passes with no errors

**Step 2: Run codegen one final time**

Run: `npx convex codegen`

**Step 3: Fix any build errors**

**Step 4: Final commit if any fixes were needed**

---

### Task 17: Deploy to prod

**Step 1: Push to GitHub**

```bash
git push origin main
```

This triggers Vercel auto-deploy which also deploys Convex functions via the build command.

**Step 2: Verify deployment**

Check that the Vercel build succeeds and the site is live at enviroconnect.vercel.app.
