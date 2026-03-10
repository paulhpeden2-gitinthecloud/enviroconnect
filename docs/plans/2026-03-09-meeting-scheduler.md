# Meeting Scheduler Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a meeting request system where users propose time slots, recipients accept or counter-propose, and confirmed meetings generate calendar links.

**Architecture:** New `meetingRequests` Convex table with status lifecycle (pending → counterproposed → confirmed/declined/expired). Extend existing `notifications` table with meeting types. Client-side calendar link generation (Google Calendar, Outlook, .ics). MeetingRequestModal shared by all entry points. Dedicated `/meetings` page + dashboard summary sections.

**Tech Stack:** Convex (backend), Next.js 14 App Router, React, Tailwind CSS v4, Clerk auth

---

### Task 1: Schema — Add meetingRequests table and update notifications

**Files:**
- Modify: `convex/schema.ts`

**Step 1: Add meetingRequests table to schema**

Add after the `messages` table definition (line 134), before the closing `});`:

```typescript
  meetingRequests: defineTable({
    requesterId: v.id("users"),
    recipientId: v.id("users"),
    subject: v.string(),
    note: v.optional(v.string()),
    meetingType: v.union(v.literal("phone"), v.literal("video"), v.literal("in_person")),
    rfqId: v.optional(v.id("rfqs")),
    proposedSlots: v.array(v.object({
      date: v.number(),
      startTime: v.string(),
      endTime: v.string(),
    })),
    counterSlots: v.optional(v.array(v.object({
      date: v.number(),
      startTime: v.string(),
      endTime: v.string(),
    }))),
    confirmedSlot: v.optional(v.object({
      date: v.number(),
      startTime: v.string(),
      endTime: v.string(),
    })),
    status: v.union(
      v.literal("pending"),
      v.literal("counterproposed"),
      v.literal("confirmed"),
      v.literal("declined"),
      v.literal("expired")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_requesterId", ["requesterId"])
    .index("by_recipientId", ["recipientId"])
    .index("by_status", ["status"]),
```

**Step 2: Update notifications table to support meeting types**

Replace the `notifications` table definition (lines 91-105) with:

```typescript
  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("rfq_match"),
      v.literal("rfq_invite"),
      v.literal("rfq_response"),
      v.literal("rfq_accepted"),
      v.literal("meeting_request"),
      v.literal("meeting_counterproposal"),
      v.literal("meeting_confirmed"),
      v.literal("meeting_declined")
    ),
    rfqId: v.optional(v.id("rfqs")),
    meetingRequestId: v.optional(v.id("meetingRequests")),
    message: v.string(),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_isRead", ["userId", "isRead"]),
```

**Step 3: Run codegen**

Run: `npx convex codegen`
Expected: Success, `convex/_generated/api.d.ts` updated with new types

**Step 4: Fix existing notification inserts**

The `rfqId` field on notifications is now optional, but all existing inserts in `convex/rfqMutations.ts` already pass `rfqId`, so no changes needed there. Verify build still passes.

Run: `npx next build` (or just confirm no TypeScript errors in the schema)

**Step 5: Commit**

```bash
git add convex/schema.ts convex/_generated/
git commit -m "feat: add meetingRequests table and meeting notification types to schema"
```

---

### Task 2: Backend — Meeting queries

**Files:**
- Create: `convex/meetings.ts`

**Step 1: Create meetings query file**

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getMyMeetings = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const asRequester = await ctx.db
      .query("meetingRequests")
      .withIndex("by_requesterId", (q) => q.eq("requesterId", args.userId))
      .collect();
    const asRecipient = await ctx.db
      .query("meetingRequests")
      .withIndex("by_recipientId", (q) => q.eq("recipientId", args.userId))
      .collect();

    const all = [...asRequester, ...asRecipient];
    // Deduplicate (a user could theoretically appear in both, though unlikely)
    const seen = new Set<string>();
    const unique = all.filter((m) => {
      if (seen.has(m._id)) return false;
      seen.add(m._id);
      return true;
    });

    // Enrich with user info
    const enriched = await Promise.all(
      unique.map(async (m) => {
        const requester = await ctx.db.get(m.requesterId);
        const recipient = await ctx.db.get(m.recipientId);
        return { ...m, requester, recipient };
      })
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getMeetingRequest = query({
  args: { id: v.id("meetingRequests") },
  handler: async (ctx, args) => {
    const meeting = await ctx.db.get(args.id);
    if (!meeting) return null;
    const requester = await ctx.db.get(meeting.requesterId);
    const recipient = await ctx.db.get(meeting.recipientId);
    return { ...meeting, requester, recipient };
  },
});

export const getUpcomingMeetings = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const asRequester = await ctx.db
      .query("meetingRequests")
      .withIndex("by_requesterId", (q) => q.eq("requesterId", args.userId))
      .collect();
    const asRecipient = await ctx.db
      .query("meetingRequests")
      .withIndex("by_recipientId", (q) => q.eq("recipientId", args.userId))
      .collect();

    const all = [...asRequester, ...asRecipient];
    const now = Date.now();
    const upcoming = all.filter(
      (m) => m.status === "confirmed" && m.confirmedSlot && m.confirmedSlot.date >= now
    );

    const enriched = await Promise.all(
      upcoming.map(async (m) => {
        const requester = await ctx.db.get(m.requesterId);
        const recipient = await ctx.db.get(m.recipientId);
        return { ...m, requester, recipient };
      })
    );

    return enriched.sort((a, b) => (a.confirmedSlot!.date - b.confirmedSlot!.date));
  },
});

export const getPendingMeetingCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Meetings where this user needs to take action
    const asRecipientPending = await ctx.db
      .query("meetingRequests")
      .withIndex("by_recipientId", (q) => q.eq("recipientId", args.userId))
      .collect();
    const asRequesterCounter = await ctx.db
      .query("meetingRequests")
      .withIndex("by_requesterId", (q) => q.eq("requesterId", args.userId))
      .collect();

    const pendingCount = asRecipientPending.filter((m) => m.status === "pending").length;
    const counterCount = asRequesterCounter.filter((m) => m.status === "counterproposed").length;

    return pendingCount + counterCount;
  },
});
```

**Step 2: Run codegen and verify**

Run: `npx convex codegen`
Expected: `api.meetings` types generated

**Step 3: Commit**

```bash
git add convex/meetings.ts convex/_generated/
git commit -m "feat: add meeting queries (getMyMeetings, getMeetingRequest, getUpcomingMeetings, getPendingMeetingCount)"
```

---

### Task 3: Backend — Meeting mutations

**Files:**
- Create: `convex/meetingMutations.ts`

**Step 1: Create meeting mutations file**

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

const timeSlotValidator = v.object({
  date: v.number(),
  startTime: v.string(),
  endTime: v.string(),
});

export const createMeetingRequest = mutation({
  args: {
    requesterId: v.id("users"),
    recipientId: v.id("users"),
    subject: v.string(),
    note: v.optional(v.string()),
    meetingType: v.union(v.literal("phone"), v.literal("video"), v.literal("in_person")),
    rfqId: v.optional(v.id("rfqs")),
    proposedSlots: v.array(timeSlotValidator),
  },
  handler: async (ctx, args) => {
    if (args.requesterId === args.recipientId) {
      throw new Error("Cannot schedule a meeting with yourself");
    }
    if (args.proposedSlots.length === 0 || args.proposedSlots.length > 3) {
      throw new Error("Must propose 1-3 time slots");
    }

    const requester = await ctx.db.get(args.requesterId);
    if (!requester) throw new Error("User not found");

    const now = Date.now();
    const meetingId = await ctx.db.insert("meetingRequests", {
      requesterId: args.requesterId,
      recipientId: args.recipientId,
      subject: args.subject,
      note: args.note,
      meetingType: args.meetingType,
      rfqId: args.rfqId,
      proposedSlots: args.proposedSlots,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("notifications", {
      userId: args.recipientId,
      type: "meeting_request",
      meetingRequestId: meetingId,
      message: `${requester.name} (${requester.company}) wants to schedule a meeting: "${args.subject}"`,
      isRead: false,
      createdAt: now,
    });

    return meetingId;
  },
});

export const acceptMeetingSlot = mutation({
  args: {
    meetingRequestId: v.id("meetingRequests"),
    userId: v.id("users"),
    slot: timeSlotValidator,
  },
  handler: async (ctx, args) => {
    const meeting = await ctx.db.get(args.meetingRequestId);
    if (!meeting) throw new Error("Meeting request not found");

    // Recipient accepts a proposed slot, OR requester accepts a counter-slot
    const isRecipientAccepting = meeting.recipientId === args.userId && meeting.status === "pending";
    const isRequesterAccepting = meeting.requesterId === args.userId && meeting.status === "counterproposed";

    if (!isRecipientAccepting && !isRequesterAccepting) {
      throw new Error("Not authorized to accept this meeting");
    }

    const now = Date.now();
    await ctx.db.patch(args.meetingRequestId, {
      confirmedSlot: args.slot,
      status: "confirmed",
      updatedAt: now,
    });

    const accepter = await ctx.db.get(args.userId);
    const notifyUserId = isRecipientAccepting ? meeting.requesterId : meeting.recipientId;
    const slotDate = new Date(args.slot.date).toLocaleDateString();

    await ctx.db.insert("notifications", {
      userId: notifyUserId,
      type: "meeting_confirmed",
      meetingRequestId: args.meetingRequestId,
      message: `${accepter?.name} confirmed your meeting "${meeting.subject}" for ${slotDate} at ${args.slot.startTime}`,
      isRead: false,
      createdAt: now,
    });
  },
});

export const counterProposeMeeting = mutation({
  args: {
    meetingRequestId: v.id("meetingRequests"),
    recipientId: v.id("users"),
    counterSlots: v.array(timeSlotValidator),
  },
  handler: async (ctx, args) => {
    const meeting = await ctx.db.get(args.meetingRequestId);
    if (!meeting) throw new Error("Meeting request not found");
    if (meeting.recipientId !== args.recipientId) throw new Error("Unauthorized");
    if (meeting.status !== "pending") throw new Error("Meeting is not pending");
    if (args.counterSlots.length === 0 || args.counterSlots.length > 3) {
      throw new Error("Must propose 1-3 counter time slots");
    }

    const now = Date.now();
    await ctx.db.patch(args.meetingRequestId, {
      counterSlots: args.counterSlots,
      status: "counterproposed",
      updatedAt: now,
    });

    const recipient = await ctx.db.get(args.recipientId);
    await ctx.db.insert("notifications", {
      userId: meeting.requesterId,
      type: "meeting_counterproposal",
      meetingRequestId: args.meetingRequestId,
      message: `${recipient?.name} suggested alternative times for "${meeting.subject}"`,
      isRead: false,
      createdAt: now,
    });
  },
});

export const declineMeeting = mutation({
  args: {
    meetingRequestId: v.id("meetingRequests"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const meeting = await ctx.db.get(args.meetingRequestId);
    if (!meeting) throw new Error("Meeting request not found");

    // Either party can decline
    const isRecipient = meeting.recipientId === args.userId;
    const isRequester = meeting.requesterId === args.userId;
    if (!isRecipient && !isRequester) throw new Error("Unauthorized");
    if (meeting.status === "confirmed" || meeting.status === "declined" || meeting.status === "expired") {
      throw new Error("Meeting cannot be declined in current state");
    }

    const now = Date.now();
    await ctx.db.patch(args.meetingRequestId, {
      status: "declined",
      updatedAt: now,
    });

    const decliner = await ctx.db.get(args.userId);
    const notifyUserId = isRecipient ? meeting.requesterId : meeting.recipientId;
    await ctx.db.insert("notifications", {
      userId: notifyUserId,
      type: "meeting_declined",
      meetingRequestId: args.meetingRequestId,
      message: `${decliner?.name} declined the meeting request: "${meeting.subject}"`,
      isRead: false,
      createdAt: now,
    });
  },
});
```

**Step 2: Run codegen and verify**

Run: `npx convex codegen`
Expected: `api.meetingMutations` types generated

**Step 3: Commit**

```bash
git add convex/meetingMutations.ts convex/_generated/
git commit -m "feat: add meeting mutations (create, accept, counterPropose, decline)"
```

---

### Task 4: Backend — Update NotificationBell to handle meeting notifications

**Files:**
- Modify: `components/NotificationBell.tsx` (lines 63-78, the notification link)

**Step 1: Update notification link to route to meetings or RFQs**

The current `NotificationBell.tsx` hardcodes `href={/rfq/${n.rfqId}}` for all notifications. Update to route meeting notifications to `/meetings` instead.

Replace the notification item rendering (lines 63-79) with logic that checks the notification type:

```typescript
{notifications?.slice(0, 20).map((n) => {
  const isMeetingNotification = n.type.startsWith("meeting_");
  const href = isMeetingNotification
    ? `/meetings`
    : n.rfqId
      ? `/rfq/${n.rfqId}`
      : `/dashboard`;
  return (
    <Link
      key={n._id}
      href={href}
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
  );
})}
```

**Step 2: Commit**

```bash
git add components/NotificationBell.tsx
git commit -m "feat: route meeting notifications to /meetings page"
```

---

### Task 5: Component — CalendarLinks

**Files:**
- Create: `components/CalendarLinks.tsx`

**Step 1: Create the CalendarLinks component**

This generates Google Calendar, Outlook, and .ics download links from a confirmed meeting slot.

```typescript
"use client";

interface CalendarLinksProps {
  subject: string;
  date: number; // epoch ms
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  note?: string;
}

function toISODateTime(dateMs: number, time: string): string {
  const d = new Date(dateMs);
  const [hours, minutes] = time.split(":").map(Number);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function formatDateForOutlook(dateMs: number, time: string): string {
  const d = new Date(dateMs);
  const [hours, minutes] = time.split(":").map(Number);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

export function CalendarLinks({ subject, date, startTime, endTime, note }: CalendarLinksProps) {
  const start = toISODateTime(date, startTime);
  const end = toISODateTime(date, endTime);
  const details = note ? encodeURIComponent(note) : "";
  const encodedSubject = encodeURIComponent(`EnviroConnect: ${subject}`);

  const googleUrl = `https://calendar.google.com/calendar/event?action=TEMPLATE&text=${encodedSubject}&dates=${start}/${end}&details=${details}`;

  const outlookStart = formatDateForOutlook(date, startTime);
  const outlookEnd = formatDateForOutlook(date, endTime);
  const outlookUrl = `https://outlook.live.com/calendar/0/action/compose?subject=${encodedSubject}&startdt=${outlookStart}&enddt=${outlookEnd}&body=${details}`;

  const handleIcs = () => {
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//EnviroConnect//Meeting//EN",
      "BEGIN:VEVENT",
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:EnviroConnect: ${subject}`,
      note ? `DESCRIPTION:${note}` : "",
      "END:VEVENT",
      "END:VCALENDAR",
    ].filter(Boolean).join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meeting-${new Date(date).toISOString().split("T")[0]}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-500 dark:text-gray-400">Add to:</span>
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-medium text-green hover:underline"
      >
        Google Calendar
      </a>
      <span className="text-gray-300">|</span>
      <a
        href={outlookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-medium text-green hover:underline"
      >
        Outlook
      </a>
      <span className="text-gray-300">|</span>
      <button
        onClick={handleIcs}
        className="text-xs font-medium text-green hover:underline"
      >
        Download .ics
      </button>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/CalendarLinks.tsx
git commit -m "feat: add CalendarLinks component (Google Calendar, Outlook, .ics)"
```

---

### Task 6: Component — TimeSlotPicker

**Files:**
- Create: `components/TimeSlotPicker.tsx`

**Step 1: Create the TimeSlotPicker component**

A reusable component for adding/removing up to 3 date + start/end time slots.

```typescript
"use client";
import { useState } from "react";

export interface TimeSlot {
  date: number; // epoch ms (midnight of selected day)
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
}

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  onChange: (slots: TimeSlot[]) => void;
  maxSlots?: number;
}

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

export function TimeSlotPicker({ slots, onChange, maxSlots = 3 }: TimeSlotPickerProps) {
  const addSlot = () => {
    if (slots.length >= maxSlots) return;
    onChange([...slots, { date: 0, startTime: "09:00", endTime: "10:00" }]);
  };

  const removeSlot = (index: number) => {
    onChange(slots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: keyof TimeSlot, value: string | number) => {
    const updated = slots.map((s, i) => (i === index ? { ...s, [field]: value } : s));
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {slots.map((slot, i) => (
        <div key={i} className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            min={todayString()}
            value={slot.date ? new Date(slot.date).toISOString().split("T")[0] : ""}
            onChange={(e) => {
              const d = new Date(e.target.value + "T00:00:00");
              updateSlot(i, "date", d.getTime());
            }}
            className="border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:text-cream focus:outline-none focus:ring-2 focus:ring-green"
          />
          <input
            type="time"
            value={slot.startTime}
            onChange={(e) => updateSlot(i, "startTime", e.target.value)}
            className="border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:text-cream focus:outline-none focus:ring-2 focus:ring-green"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input
            type="time"
            value={slot.endTime}
            onChange={(e) => updateSlot(i, "endTime", e.target.value)}
            className="border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:text-cream focus:outline-none focus:ring-2 focus:ring-green"
          />
          {slots.length > 1 && (
            <button
              type="button"
              onClick={() => removeSlot(i)}
              className="text-red-400 hover:text-red-600 text-sm p-1"
              aria-label="Remove slot"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ))}
      {slots.length < maxSlots && (
        <button
          type="button"
          onClick={addSlot}
          className="text-sm text-green hover:underline font-medium"
        >
          + Add another time option
        </button>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/TimeSlotPicker.tsx
git commit -m "feat: add TimeSlotPicker component for date/time slot selection"
```

---

### Task 7: Component — MeetingRequestModal

**Files:**
- Create: `components/MeetingRequestModal.tsx`

**Step 1: Create the modal component**

This is the shared modal opened from vendor profiles, directory cards, and RFQ proposals.

```typescript
"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { TimeSlotPicker, TimeSlot } from "./TimeSlotPicker";

interface MeetingRequestModalProps {
  requesterId: Id<"users">;
  recipientId: Id<"users">;
  recipientName: string;
  rfqId?: Id<"rfqs">;
  onClose: () => void;
}

export function MeetingRequestModal({
  requesterId,
  recipientId,
  recipientName,
  rfqId,
  onClose,
}: MeetingRequestModalProps) {
  const [subject, setSubject] = useState("");
  const [note, setNote] = useState("");
  const [meetingType, setMeetingType] = useState<"phone" | "video" | "in_person">("video");
  const [slots, setSlots] = useState<TimeSlot[]>([
    { date: 0, startTime: "09:00", endTime: "10:00" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const createMeeting = useMutation(api.meetingMutations.createMeetingRequest);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!subject.trim()) {
      setError("Subject is required");
      return;
    }
    const validSlots = slots.filter((s) => s.date > 0);
    if (validSlots.length === 0) {
      setError("At least one time slot with a date is required");
      return;
    }

    setSubmitting(true);
    try {
      await createMeeting({
        requesterId,
        recipientId,
        subject: subject.trim(),
        note: note.trim() || undefined,
        meetingType,
        rfqId,
        proposedSlots: validSlots,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-navy-light rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-dark">
          <h2 className="text-lg font-semibold text-navy dark:text-cream">
            Schedule Meeting
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Request a meeting with <span className="font-medium text-navy dark:text-cream">{recipientName}</span>
          </p>

          <div>
            <label className="block text-sm font-medium text-navy dark:text-cream mb-1">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Discuss stormwater compliance"
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:text-cream focus:outline-none focus:ring-2 focus:ring-green"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy dark:text-cream mb-2">Meeting Type</label>
            <div className="flex gap-3">
              {(["phone", "video", "in_person"] as const).map((type) => (
                <label key={type} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="meetingType"
                    value={type}
                    checked={meetingType === type}
                    onChange={() => setMeetingType(type)}
                    className="accent-green"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {type === "phone" ? "Phone" : type === "video" ? "Video" : "In Person"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy dark:text-cream mb-2">
              Proposed Times (up to 3) *
            </label>
            <TimeSlotPicker slots={slots} onChange={setSlots} />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy dark:text-cream mb-1">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Any additional context..."
              className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:text-cream focus:outline-none focus:ring-2 focus:ring-green resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-cream dark:hover:bg-navy rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-medium bg-green hover:bg-green-light text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? "Sending..." : "Send Request"}
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
git add components/MeetingRequestModal.tsx
git commit -m "feat: add MeetingRequestModal component"
```

---

### Task 8: Component — MeetingCard

**Files:**
- Create: `components/MeetingCard.tsx`

**Step 1: Create the MeetingCard component**

Displays a meeting request with status, time slots, action buttons, and calendar links for confirmed meetings.

```typescript
"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { CalendarLinks } from "./CalendarLinks";
import { TimeSlotPicker, TimeSlot } from "./TimeSlotPicker";

interface MeetingCardProps {
  meeting: Doc<"meetingRequests"> & {
    requester: Doc<"users"> | null;
    recipient: Doc<"users"> | null;
  };
  currentUserId: Id<"users">;
}

const TYPE_LABELS = { phone: "Phone", video: "Video", in_person: "In Person" };
const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200",
  counterproposed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
  confirmed: "bg-green/15 text-green dark:text-green-300",
  declined: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
  expired: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

function formatSlotDate(dateMs: number): string {
  return new Date(dateMs).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function MeetingCard({ meeting, currentUserId }: MeetingCardProps) {
  const [showCounter, setShowCounter] = useState(false);
  const [counterSlots, setCounterSlots] = useState<TimeSlot[]>([
    { date: 0, startTime: "09:00", endTime: "10:00" },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const acceptSlot = useMutation(api.meetingMutations.acceptMeetingSlot);
  const counterPropose = useMutation(api.meetingMutations.counterProposeMeeting);
  const declineMeeting = useMutation(api.meetingMutations.declineMeeting);

  const isRequester = meeting.requesterId === currentUserId;
  const otherParty = isRequester ? meeting.recipient : meeting.requester;
  const needsMyAction =
    (meeting.status === "pending" && !isRequester) ||
    (meeting.status === "counterproposed" && isRequester);

  const slotsToShow =
    meeting.status === "counterproposed" && isRequester
      ? meeting.counterSlots ?? []
      : meeting.proposedSlots;

  const handleAccept = async (slot: { date: number; startTime: string; endTime: string }) => {
    setSubmitting(true);
    try {
      await acceptSlot({ meetingRequestId: meeting._id, userId: currentUserId, slot });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCounter = async () => {
    const validSlots = counterSlots.filter((s) => s.date > 0);
    if (validSlots.length === 0) return;
    setSubmitting(true);
    try {
      await counterPropose({
        meetingRequestId: meeting._id,
        recipientId: currentUserId,
        counterSlots: validSlots,
      });
      setShowCounter(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    setSubmitting(true);
    try {
      await declineMeeting({ meetingRequestId: meeting._id, userId: currentUserId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-5 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-semibold text-navy dark:text-cream truncate">
              {meeting.subject}
            </h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[meeting.status]}`}>
              {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-cream-dark/50 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {TYPE_LABELS[meeting.meetingType]}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isRequester ? "To" : "From"}: {otherParty?.name} ({otherParty?.company})
          </p>
        </div>
        <span className="text-xs text-gray-400 shrink-0">
          {new Date(meeting.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Note */}
      {meeting.note && (
        <p className="text-sm text-gray-600 dark:text-gray-300">{meeting.note}</p>
      )}

      {/* Confirmed slot */}
      {meeting.status === "confirmed" && meeting.confirmedSlot && (
        <div className="bg-green/5 dark:bg-green/10 rounded-lg p-3 space-y-2">
          <p className="text-sm font-medium text-green">
            {formatSlotDate(meeting.confirmedSlot.date)} &middot; {meeting.confirmedSlot.startTime} – {meeting.confirmedSlot.endTime}
          </p>
          <CalendarLinks
            subject={meeting.subject}
            date={meeting.confirmedSlot.date}
            startTime={meeting.confirmedSlot.startTime}
            endTime={meeting.confirmedSlot.endTime}
            note={meeting.note}
          />
        </div>
      )}

      {/* Proposed/counter slots for action */}
      {needsMyAction && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {meeting.status === "counterproposed" ? "Suggested times:" : "Proposed times:"}
          </p>
          {slotsToShow.map((slot, i) => (
            <div key={i} className="flex items-center justify-between gap-2 bg-cream dark:bg-navy rounded-lg px-3 py-2">
              <span className="text-sm text-navy dark:text-cream">
                {formatSlotDate(slot.date)} &middot; {slot.startTime} – {slot.endTime}
              </span>
              <button
                onClick={() => handleAccept(slot)}
                disabled={submitting}
                className="text-xs font-medium text-white bg-green hover:bg-green-light px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
              >
                Accept
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Slots display (non-actionable) */}
      {!needsMyAction && meeting.status !== "confirmed" && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {meeting.status === "counterproposed" ? "Your suggested times:" : "Proposed times:"}
          </p>
          {slotsToShow.map((slot, i) => (
            <p key={i} className="text-sm text-gray-600 dark:text-gray-300">
              {formatSlotDate(slot.date)} &middot; {slot.startTime} – {slot.endTime}
            </p>
          ))}
        </div>
      )}

      {/* Action buttons for recipient on pending */}
      {meeting.status === "pending" && !isRequester && (
        <div className="flex items-center gap-3 pt-2 border-t border-cream-dark">
          {!showCounter ? (
            <>
              <button
                onClick={() => setShowCounter(true)}
                className="text-sm font-medium text-navy dark:text-cream hover:underline"
              >
                Suggest Other Times
              </button>
              <button
                onClick={handleDecline}
                disabled={submitting}
                className="text-sm font-medium text-red-500 hover:underline disabled:opacity-50"
              >
                Decline
              </button>
            </>
          ) : (
            <div className="w-full space-y-3">
              <p className="text-sm font-medium text-navy dark:text-cream">Suggest alternative times:</p>
              <TimeSlotPicker slots={counterSlots} onChange={setCounterSlots} />
              <div className="flex gap-3">
                <button
                  onClick={handleCounter}
                  disabled={submitting}
                  className="text-sm font-medium bg-navy hover:bg-navy-light text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? "Sending..." : "Send Counter-Proposal"}
                </button>
                <button
                  onClick={() => setShowCounter(false)}
                  className="text-sm text-gray-500 hover:underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Decline button for requester on counterproposed */}
      {meeting.status === "counterproposed" && isRequester && (
        <div className="pt-2 border-t border-cream-dark">
          <button
            onClick={handleDecline}
            disabled={submitting}
            className="text-sm font-medium text-red-500 hover:underline disabled:opacity-50"
          >
            Decline Meeting
          </button>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/MeetingCard.tsx
git commit -m "feat: add MeetingCard component with accept/counter/decline actions"
```

---

### Task 9: Page — /meetings

**Files:**
- Create: `app/meetings/page.tsx`
- Create: `app/meetings/MeetingsClient.tsx`

**Step 1: Create the page wrapper**

```typescript
// app/meetings/page.tsx
import { MeetingsClient } from "./MeetingsClient";

export default function MeetingsPage() {
  return (
    <main className="min-h-screen bg-cream">
      <div className="bg-navy text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold">Meetings</h1>
          <p className="text-gray-300 text-sm mt-1">
            Schedule and manage your meetings
          </p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <MeetingsClient />
      </div>
    </main>
  );
}
```

**Step 2: Create MeetingsClient with three tab sections**

```typescript
// app/meetings/MeetingsClient.tsx
"use client";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MeetingCard } from "@/components/MeetingCard";

type Tab = "action" | "upcoming" | "past";

export function MeetingsClient() {
  const { user, isLoaded } = useUser();
  const dbUser = useQuery(
    api.users.getUserByClerkId,
    isLoaded && user ? { clerkId: user.id } : "skip"
  );
  const meetings = useQuery(
    api.meetings.getMyMeetings,
    dbUser ? { userId: dbUser._id } : "skip"
  );
  const [tab, setTab] = useState<Tab>("action");

  if (!isLoaded || !dbUser) {
    return (
      <div className="space-y-4 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6 space-y-2">
            <div className="h-4 bg-cream-dark rounded w-2/3" />
            <div className="h-3 bg-cream-dark rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  const now = Date.now();
  const actionNeeded = meetings?.filter((m) => {
    const isPendingForMe = m.status === "pending" && m.recipientId === dbUser._id;
    const isCounterForMe = m.status === "counterproposed" && m.requesterId === dbUser._id;
    return isPendingForMe || isCounterForMe;
  }) ?? [];

  const upcoming = meetings?.filter(
    (m) => m.status === "confirmed" && m.confirmedSlot && m.confirmedSlot.date >= now
  ).sort((a, b) => a.confirmedSlot!.date - b.confirmedSlot!.date) ?? [];

  const past = meetings?.filter((m) => {
    if (m.status === "declined" || m.status === "expired") return true;
    if (m.status === "confirmed" && m.confirmedSlot && m.confirmedSlot.date < now) return true;
    // Pending/counterproposed that I sent (waiting on other party) — show in past? No, show as "waiting"
    return false;
  }) ?? [];

  // Meetings waiting on other party (not action needed, not confirmed/past)
  const waiting = meetings?.filter((m) => {
    const isPendingFromMe = m.status === "pending" && m.requesterId === dbUser._id;
    const isCounterFromMe = m.status === "counterproposed" && m.recipientId === dbUser._id;
    return isPendingFromMe || isCounterFromMe;
  }) ?? [];

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "action", label: "Action Needed", count: actionNeeded.length },
    { key: "upcoming", label: "Upcoming", count: upcoming.length },
    { key: "past", label: "Past", count: past.length },
  ];

  const currentList = tab === "action" ? [...actionNeeded, ...waiting]
    : tab === "upcoming" ? upcoming
    : past;

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-cream-dark/50 dark:bg-navy/50 rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 text-sm font-medium py-2 px-3 rounded-md transition-colors ${
              tab === t.key
                ? "bg-white dark:bg-navy-light text-navy dark:text-cream shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-navy dark:hover:text-cream"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded-full ${
                t.key === "action" && t.count > 0
                  ? "bg-red-500 text-white"
                  : "bg-cream-dark dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Meeting list */}
      {meetings === undefined ? (
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6 space-y-2">
              <div className="h-4 bg-cream-dark rounded w-2/3" />
              <div className="h-3 bg-cream-dark rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : currentList.length === 0 ? (
        <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-10 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {tab === "action"
              ? "No meetings need your attention right now."
              : tab === "upcoming"
                ? "No upcoming meetings."
                : "No past meetings."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tab === "action" && actionNeeded.length > 0 && waiting.length > 0 && (
            <>
              {actionNeeded.map((m) => (
                <MeetingCard key={m._id} meeting={m} currentUserId={dbUser._id} />
              ))}
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide pt-2">Waiting on response</p>
              {waiting.map((m) => (
                <MeetingCard key={m._id} meeting={m} currentUserId={dbUser._id} />
              ))}
            </>
          )}
          {tab === "action" && (actionNeeded.length === 0 || waiting.length === 0) && (
            currentList.map((m) => (
              <MeetingCard key={m._id} meeting={m} currentUserId={dbUser._id} />
            ))
          )}
          {tab !== "action" && currentList.map((m) => (
            <MeetingCard key={m._id} meeting={m} currentUserId={dbUser._id} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add app/meetings/page.tsx app/meetings/MeetingsClient.tsx
git commit -m "feat: add /meetings page with action needed, upcoming, and past tabs"
```

---

### Task 10: Entry point — Vendor profile "Schedule Meeting" button

**Files:**
- Modify: `app/directory/[id]/page.tsx`

**Step 1: Add MeetingRequestModal import and state**

At the top of the file, add import:
```typescript
import { MeetingRequestModal } from "@/components/MeetingRequestModal";
```

Inside the component, add state (after the `showEndorsersModal` state on line 36-37):
```typescript
const [showMeetingModal, setShowMeetingModal] = useState(false);
```

**Step 2: Add "Schedule Meeting" button next to Message button**

After the Message `<Link>` (around line 113), add:

```typescript
<button
  onClick={() => setShowMeetingModal(true)}
  className="inline-flex items-center gap-2 px-4 py-2 border-2 border-green text-green text-sm font-medium rounded-lg hover:bg-green hover:text-white transition-all duration-200"
>
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
  Schedule Meeting
</button>
```

**Step 3: Add modal render**

Before the closing `</main>` tag (before the endorsers modal render, around line 285), add:

```typescript
{showMeetingModal && dbUser && (
  <MeetingRequestModal
    requesterId={dbUser._id}
    recipientId={profile.userId}
    recipientName={profile.companyName}
    onClose={() => setShowMeetingModal(false)}
  />
)}
```

**Step 4: Commit**

```bash
git add app/directory/[id]/page.tsx
git commit -m "feat: add Schedule Meeting button to vendor profile page"
```

---

### Task 11: Entry point — RFQ detail "Schedule Meeting" on proposals

**Files:**
- Modify: `app/rfq/[id]/page.tsx`

**Step 1: Read the current file to identify exact insertion points**

Read `app/rfq/[id]/page.tsx` and add a "Schedule Meeting" link next to each vendor's proposal. This requires:
- Import `MeetingRequestModal` and `useState`
- Add state for which proposal's vendor the modal targets
- Add a "Schedule Meeting" button in the proposal card
- Render the modal when active

The exact insertion points depend on the current file structure. The pattern is the same as Task 10 — a button that opens `MeetingRequestModal` with the vendor's userId as recipientId, and `rfqId` pre-filled.

**Step 2: Commit**

```bash
git add app/rfq/[id]/page.tsx
git commit -m "feat: add Schedule Meeting button on RFQ proposal cards"
```

---

### Task 12: Dashboard sections — Upcoming Meetings

**Files:**
- Modify: `app/dashboard/vendor/page.tsx`
- Modify: `app/dashboard/facility/page.tsx`

**Step 1: Add meetings query and section to vendor dashboard**

In `app/dashboard/vendor/page.tsx`:
- Add import: `import { MeetingCard } from "@/components/MeetingCard";`
- Add query after `myProposals` (line 26):
```typescript
const upcomingMeetings = useQuery(
  api.meetings.getUpcomingMeetings,
  dbUser ? { userId: dbUser._id } : "skip"
);
const pendingMeetingCount = useQuery(
  api.meetings.getPendingMeetingCount,
  dbUser ? { userId: dbUser._id } : "skip"
);
```
- Add an "Upcoming Meetings" section after the "My Proposals" section (after line 313), following the same card pattern:

```typescript
{/* Upcoming Meetings Section */}
<section>
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-2">
      <h2 className="text-xl font-semibold text-navy dark:text-cream">
        Meetings
      </h2>
      {(pendingMeetingCount ?? 0) > 0 && (
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
          {pendingMeetingCount} pending
        </span>
      )}
    </div>
    <Link
      href="/meetings"
      className="text-sm text-navy dark:text-cream font-medium underline hover:no-underline"
    >
      View all meetings
    </Link>
  </div>

  {upcomingMeetings === undefined && (
    <div className="space-y-3 animate-pulse">
      <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-5 space-y-2">
        <div className="h-4 bg-cream-dark rounded w-2/3" />
        <div className="h-3 bg-cream-dark rounded w-1/3" />
      </div>
    </div>
  )}

  {upcomingMeetings?.length === 0 && (
    <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-10 text-center">
      <p className="text-gray-500 dark:text-gray-400 mb-2">
        No upcoming meetings.
      </p>
      <Link
        href="/meetings"
        className="text-navy dark:text-cream font-medium underline hover:no-underline text-sm"
      >
        View all meetings
      </Link>
    </div>
  )}

  {upcomingMeetings && upcomingMeetings.length > 0 && (
    <div className="space-y-3">
      {upcomingMeetings.slice(0, 3).map((m) => (
        <MeetingCard key={m._id} meeting={m} currentUserId={dbUser!._id} />
      ))}
      {upcomingMeetings.length > 3 && (
        <Link
          href="/meetings"
          className="block text-center text-sm text-green hover:underline font-medium py-2"
        >
          View {upcomingMeetings.length - 3} more →
        </Link>
      )}
    </div>
  )}
</section>
```

**Step 2: Add same section to facility dashboard**

Apply the same pattern to `app/dashboard/facility/page.tsx`. Add the meetings queries and the "Upcoming Meetings" section after the "Saved Vendors" section (after line 190).

**Step 3: Commit**

```bash
git add app/dashboard/vendor/page.tsx app/dashboard/facility/page.tsx
git commit -m "feat: add Upcoming Meetings section to vendor and facility dashboards"
```

---

### Task 13: Navbar — Add Meetings link

**Files:**
- Modify: `components/Navbar.tsx`

**Step 1: Add a "Meetings" link to the navbar**

Read `components/Navbar.tsx` and add a "Meetings" nav link next to the existing "Messages" and "RFQs" links. Should only show for authenticated users. Follow the exact same pattern as the existing links.

**Step 2: Commit**

```bash
git add components/Navbar.tsx
git commit -m "feat: add Meetings link to navbar"
```

---

### Task 14: Codegen + Build verification

**Files:**
- Verify: `convex/_generated/api.d.ts`

**Step 1: Run full codegen**

Run: `npx convex codegen`
Expected: Success, all new functions in `api.meetings` and `api.meetingMutations`

**Step 2: Run build**

Run: `npm run build`
Expected: Build passes with no TypeScript errors

**Step 3: Commit generated types if changed**

```bash
git add convex/_generated/
git commit -m "fix: update generated Convex types for meetings"
```

---

### Task 15: Push and verify deployment

**Step 1: Push to GitHub**

```bash
git push origin main
```

**Step 2: Verify Vercel deployment succeeds**

Check the Vercel deployment logs. The build command `npx convex deploy --cmd "npm run build" --yes` will deploy Convex functions and Next.js together.

**Step 3: Smoke test on live site**

- Visit `/meetings` — should load with empty state
- Visit a vendor profile — "Schedule Meeting" button should appear
- Test creating a meeting request (requires two accounts)
