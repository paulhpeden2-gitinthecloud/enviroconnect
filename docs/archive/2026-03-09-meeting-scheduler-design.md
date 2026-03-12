# Meeting Scheduler — Design Document

**Date:** 2026-03-09
**Feature:** Meeting request & scheduling between users
**Status:** Approved

## Overview

A meeting request system where either party (FM or vendor) can propose a meeting with up to 3 time slots. The recipient can accept one slot or counter-propose with their own 3 slots (one round of back-and-forth). If they still can't agree, they use in-app messaging to sort it out. Once confirmed, both parties get Google Calendar / Outlook / .ics download links.

## Design Decisions

- **Standalone table** (not piggybacked on messaging) — meetings are a first-class concept with their own status lifecycle, easy to query and display separately.
- **One counter-proposal round** — keeps UI simple. Unlimited rounds adds complexity without real-world benefit; messaging covers edge cases.
- **Calendar links, not API integration** — no OAuth or API keys needed. Client-side URL generation for Google Calendar, Outlook, and .ics download. Full API integration (availability checking, auto-create events) is a future enhancement.
- **Either party can initiate** — both FMs and vendors can request meetings.
- **Optional RFQ context** — meetings can be standalone (from profile/directory) or tied to an RFQ (from proposal page).

## Data Model

### `meetingRequests` table

```
meetingRequests:
  requesterId:    Id<"users">
  recipientId:    Id<"users">
  subject:        string
  note:           optional string
  meetingType:    "phone" | "video" | "in_person"
  rfqId:          optional Id<"rfqs">

  proposedSlots:  array of { date: number, startTime: string, endTime: string }
    // up to 3 slots, date as epoch ms, times as "HH:MM" strings

  counterSlots:   optional array of { date: number, startTime: string, endTime: string }
    // recipient's counter-proposal (up to 3 slots)

  confirmedSlot:  optional { date: number, startTime: string, endTime: string }
    // the agreed-upon time

  status:         "pending" | "counterproposed" | "confirmed" | "declined" | "expired"

  createdAt:      number
  updatedAt:      number
```

**Indexes:** `by_requesterId`, `by_recipientId`, `by_status`

### Status Flow

1. Requester creates request → `pending`
2. Recipient responds:
   - Accepts a slot → `confirmed` (sets `confirmedSlot`)
   - Counter-proposes → `counterproposed` (sets `counterSlots`)
   - Declines → `declined`
3. If counterproposed, requester responds:
   - Accepts a counter-slot → `confirmed`
   - Declines → `declined`
4. Unconfirmed requests past all proposed dates → `expired` (client-side check)

## Notifications

Extend existing `notifications` table:

**New notification types:**
- `meeting_request` — "X wants to schedule a meeting with you"
- `meeting_counterproposal` — "X suggested alternative times"
- `meeting_confirmed` — "Meeting confirmed for [date/time]"
- `meeting_declined` — "X declined your meeting request"

**Schema change:** `rfqId` becomes optional on the notifications table. Add optional `meetingRequestId: Id<"meetingRequests">` field.

## Calendar Links

Generated client-side when a meeting is confirmed. Three options shown as buttons:

- **Google Calendar** — pre-filled URL: `calendar.google.com/calendar/event?action=TEMPLATE&text=...&dates=...&details=...`
- **Outlook** — pre-filled URL: `outlook.live.com/calendar/0/action/compose?subject=...&startdt=...&enddt=...`
- **Download .ics** — standard iCalendar format, generated as blob URL

## UI

### Entry Points

1. **Vendor profile page** — "Schedule Meeting" button in header (next to Endorse, Message)
2. **Vendor directory cards** — calendar icon button (logged-in users only)
3. **RFQ detail page** — "Schedule Meeting" link on vendor proposals (auto-attaches RFQ)

### MeetingRequestModal

All entry points open the same modal:
- Subject (text input, required)
- Meeting type (phone / video / in-person, radio buttons)
- Up to 3 date/time slot pickers (date + start time + end time)
- Optional note (textarea)
- Optional RFQ link (auto-filled from context)

### `/meetings` Page

Three tab sections:
- **Action Needed** — pending requests requiring your response
- **Upcoming** — confirmed meetings sorted by date, with "Add to Calendar" buttons
- **Past** — completed/declined/expired meetings

Meeting cards show: other party's name + company, subject, meeting type badge, proposed/confirmed times, status badge.

### Dashboard Sections

Both vendor and FM dashboards get:
- "Upcoming Meetings" summary (next 2-3 confirmed)
- Count badge for pending requests needing action
- "View all" link to `/meetings`

### Navbar

No new icon. Meeting notifications flow through the existing notification bell.

## File Plan

### Convex (backend)
- `convex/schema.ts` — add `meetingRequests` table, update `notifications` type union
- `convex/meetings.ts` — queries (getMyMeetings, getMeetingRequest, getUpcomingMeetings)
- `convex/meetingMutations.ts` — mutations (createMeetingRequest, respondToMeeting, confirmCounterSlot, declineMeeting)

### Components
- `components/MeetingRequestModal.tsx` — modal form for creating/viewing requests
- `components/MeetingCard.tsx` — reusable card for meeting display
- `components/CalendarLinks.tsx` — Google Calendar / Outlook / .ics buttons
- `components/TimeSlotPicker.tsx` — date + time range picker (reusable for propose & counter)

### Pages
- `app/meetings/page.tsx` — dedicated meetings page with tab sections
- `app/meetings/MeetingsClient.tsx` — client component with tab state and queries

### Updates to existing files
- `components/Navbar.tsx` — no changes (uses existing notification bell)
- `app/dashboard/vendor/page.tsx` — add "Upcoming Meetings" section
- `app/dashboard/facility/page.tsx` — add "Upcoming Meetings" section
- `app/directory/[id]/page.tsx` — add "Schedule Meeting" button
- `components/VendorCard.tsx` — add calendar icon button
- `app/rfq/[id]/page.tsx` — add "Schedule Meeting" on proposals
