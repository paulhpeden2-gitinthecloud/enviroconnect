# RFQ System Design

**Date:** 2026-03-01
**Feature:** Request for Quote (RFQ) system for EnviroConnect
**Status:** Approved

## Overview

Facility managers post RFQs describing work they need done. RFQs appear on a public board searchable by all vendors. Vendors whose services match get automatic notifications. FMs can optionally invite specific vendors. Vendors submit proposals; FMs review and award.

## Data Model

### `rfqs` table

| Field | Type | Notes |
|---|---|---|
| facilityManagerId | Id<"users"> | Who posted it |
| title | string | Short summary, e.g. "Need SPCC Plan Update for Tacoma Facility" |
| description | string | Detailed requirements, max 2000 chars |
| services | array of strings | From SERVICE_TYPES constants |
| serviceArea | string | Single value from SERVICE_AREAS |
| budgetRange | optional string | Enum: "Under $5K", "$5K-$15K", "$15K-$50K", "$50K-$100K", "$100K+" |
| deadline | number | Timestamp — date proposals are due by (date picker) |
| timeline | string | When work needs to happen. Enum: "Urgent (< 2 weeks)", "1-3 months", "3-6 months", "6+ months", "Flexible" |
| requirements | optional string | Free-form additional requirements (insurance, certs, bonding, etc.), max 1000 chars |
| invitedVendors | optional array of Id<"vendorProfiles"> | Directly invited vendors |
| status | string | "open", "closed", "awarded" |
| createdAt | number | Timestamp |
| updatedAt | number | Timestamp |

**Indexes:** `by_facilityManagerId`, `by_status`, `by_services` (for matching)

### `rfqResponses` table

| Field | Type | Notes |
|---|---|---|
| rfqId | Id<"rfqs"> | Which RFQ this responds to |
| vendorProfileId | Id<"vendorProfiles"> | Who submitted |
| proposalText | string | Vendor's proposal, max 2000 chars |
| estimatedCost | optional string | Free-form, e.g. "$8,500" or "$5K-$10K" |
| estimatedTimeline | optional string | Free-form, e.g. "2-3 weeks" |
| status | string | "submitted", "accepted", "declined" |
| createdAt | number | Timestamp |

**Indexes:** `by_rfqId`, `by_vendorProfileId`

### `notifications` table

| Field | Type | Notes |
|---|---|---|
| userId | Id<"users"> | Recipient |
| type | string | "rfq_match", "rfq_invite", "rfq_response", "rfq_accepted" |
| rfqId | Id<"rfqs"> | Related RFQ |
| message | string | Human-readable text |
| isRead | boolean | Default false |
| createdAt | number | Timestamp |

**Indexes:** `by_userId`, `by_userId_isRead`

## Pages & UI

### New Pages

**`/rfq` — RFQ Board**
- Grid/list of all open RFQs
- Each card shows: title, service tags, service area, timeline badge, deadline countdown, response count
- Filters: service type, region, timeline
- Search by keyword
- Vendors see "Submit Proposal" on each card
- FMs see "Post an RFQ" button at top
- Matched/Invited badges on relevant RFQs for vendors

**`/rfq/new` — Create RFQ (FM only)**
- Form fields: title, description, services (checkboxes from SERVICE_TYPES), service area (dropdown from SERVICE_AREAS), budget range (dropdown), deadline (date picker), timeline (dropdown), requirements (textarea)
- Optional "Invite Specific Vendors" — search/select from published vendor directory
- Preview before posting

**`/rfq/[id]` — RFQ Detail**
- Full RFQ details with all fields displayed
- Requirements shown as distinct section
- Vendor view: proposal submission form (proposal text + estimated cost + estimated timeline)
- FM view: list of received proposals with accept/decline actions, link to vendor profiles, status management (close/award)

### Updated Existing Pages

**Vendor Dashboard (`/dashboard/vendor`)**
- New "RFQ Matches" section: RFQs matching vendor's services + direct invites
- Notification badges for new matches/invites

**FM Dashboard (`/dashboard/facility`)**
- New "My RFQs" section: posted RFQs with response counts and status

**Navbar (`components/Navbar.tsx`)**
- Add "RFQs" nav link
- Notification bell icon with unread count badge

**Vendor Profile (`/directory/[id]`)**
- Add "Request Quote" button that navigates to `/rfq/new` with vendor pre-selected as invite

## User Flows

### FM Posts an RFQ
1. Clicks "Post an RFQ" from board or dashboard
2. Fills form (title, description, services, area, budget, deadline, timeline, requirements)
3. Optionally searches directory and adds vendor invites
4. Previews and submits
5. RFQ appears on board with status "open"
6. System auto-matches vendors by service overlap → `rfq_match` notifications
7. Invited vendors get `rfq_invite` notifications

### Vendor Responds
1. Sees notification badge → dashboard shows matched/invited RFQs
2. Or browses `/rfq` board, filters by service type
3. Clicks into RFQ detail → reads requirements
4. Submits proposal (text + cost + timeline)
5. FM gets `rfq_response` notification

### FM Reviews and Awards
1. Opens RFQ from dashboard → sees proposals list
2. Reviews each (text, cost, timeline, link to vendor profile)
3. Accepts one → vendor gets `rfq_accepted` notification
4. RFQ status → "awarded", board shows it's closed

### Vendor Discovers Organically
1. Visits `/rfq` board → filters by service type or region
2. Sees all open RFQs with "Matched" / "Invited" badges on relevant ones
3. Can submit proposals to any open RFQ, not just matched ones

## Convex Functions

### Queries
- `getRfqs` — list open RFQs with filters (service type, region, timeline, search)
- `getRfq` — single RFQ by ID
- `getMyRfqs` — FM's posted RFQs
- `getRfqResponses` — responses for a specific RFQ (FM only, or vendor sees own)
- `getMatchedRfqs` — RFQs matching a vendor's service types + direct invites
- `getNotifications` — user's notifications, ordered by date
- `getUnreadNotificationCount` — for navbar badge

### Mutations
- `createRfq` — FM creates new RFQ, triggers matching notifications
- `updateRfq` — FM edits their RFQ (only if still open)
- `closeRfq` — FM closes without awarding
- `submitProposal` — vendor submits response to an RFQ
- `acceptProposal` — FM accepts a proposal, sets RFQ to "awarded", notifies vendor
- `declineProposal` — FM declines a proposal
- `markNotificationRead` — mark single notification as read
- `markAllNotificationsRead` — mark all as read

## Scope Boundaries

### In this build
- RFQ CRUD + proposal submission + accept/decline
- In-app notifications (database-driven, bell icon in navbar)
- Service-based auto-matching with notifications
- Optional vendor invites on RFQ creation
- Status management (open → awarded / closed)
- RFQ board with filtering and search

### NOT in this build (future)
- Email notifications (needs email service like Resend)
- File attachments on RFQs or proposals
- Proposal revision / counter-offers
- Rating vendors after RFQ completion
- Payment integration for awarded RFQs

## Design System

Follows existing EnviroConnect patterns:
- Cream background, navy text, green accent
- Card hover lifts (`hover:-translate-y-1 hover:shadow-md`)
- ScrollReveal animations on page sections
- Skeleton loaders for all loading states
- Dark mode support on all new components
- Responsive with desktop-first approach
- Timeline badges use color coding: red for urgent, yellow for 1-3 months, green for flexible
