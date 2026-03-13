# Meeting Location Details & Reviews/Ratings — Design

**Date:** 2026-03-12

---

## Feature 1: Meeting Location Details

### Summary
Add conditional location/platform fields to meeting requests based on meeting type, and allow either party to add a meeting link after confirmation.

### Schema Changes
Add to `meetingRequests` table:
- `locationDetail` (optional string) — phone number, address, or video platform name
- `meetingLink` (optional string) — video meeting URL, added after confirmation

### Conditional Fields at Request Time

| Meeting Type | Field | Input Type | Placeholder/Options |
|-------------|-------|------------|-------------------|
| Phone | Phone number | Text input | "Phone number" |
| Video | Platform | Dropdown | Microsoft Teams, Zoom, Google Meet |
| In Person | Address | Text input | "Address or location" |

Fields appear/disappear based on the selected meeting type radio button.

### Post-Confirmation: Meeting Link
- When a video meeting is confirmed, either party can add/edit the meeting link
- Inline edit UI on the MeetingCard (input + save button)
- Link displays as clickable URL on confirmed meetings
- Mutation: `updateMeetingLink` — validates user is requester or recipient, meeting is confirmed

### Display
- MeetingCard shows location detail (phone/address/platform) on all meetings
- Meeting link shown as clickable URL on confirmed video meetings
- CalendarLinks include location detail + meeting link in event description

---

## Feature 2: Reviews & Ratings

### Summary
Facility managers can rate and review vendors. Two paths: via accepted RFQ proposal, or via trust network endorsement (tied to a project name).

### Review Eligibility
1. **RFQ path** — FM has an accepted proposal from the vendor on one of their RFQs
2. **Endorsement path** — FM has endorsed the vendor in the trust network; must provide a project name

### Review Form Fields
- **Service type** (required) — from SERVICE_TYPES constants
- **Category ratings** (required, 1-5 stars each):
  - Quality of Work
  - Communication
  - Timeliness
  - Compliance Knowledge
  - Value
- **Written review / notes** (optional) — trustworthiness and performance
- **Date of service completed** (optional)
- Auto-captured: reviewer ID, vendor ID, RFQ ID or project name

### Schema — `reviews` table
```
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
  .index("by_vendorId_reviewerId", ["vendorId", "reviewerId"])
```

### Constraints
- One review per FM per RFQ (duplicate check on rfqId + reviewerId)
- One review per FM per vendor via endorsement path (duplicate check on vendorId + reviewerId where rfqId is absent)
- FM must have endorsed the vendor OR have an accepted RFQ proposal

### Display
- **Vendor cards (directory):** Overall average star rating + review count badge
- **Vendor profile page:** Overall average, category breakdowns, list of individual reviews
- **Each review shows:** Reviewer company name, service type, star ratings, notes, date of service
- **Review count badge** on vendor cards (similar to endorsement count)

### Entry Points
- Vendor profile page — "Write a Review" button (visible to eligible FMs)
- RFQ proposal card — "Review Vendor" link after proposal is accepted
