# Folder Restructure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the EnviroConnect project into feature-domain folders for components and Convex backend, consolidate parent-directory docs, clean up unused assets, and update all imports.

**Architecture:** Feature-domain colocation — components and backend files grouped by domain (rfq, meetings, messaging, endorsements, vendors, users). Layout and shared components in their own folders. Docs reorganized into plans/design/archive/reference.

**Tech Stack:** Next.js 14 App Router, Convex, TypeScript. File moves + import rewrites + codegen.

---

### Task 1: Create target directory structure

**Files:**
- Create directories only (no file moves yet)

**Step 1: Create all new directories**

```bash
cd "/Users/blueenvironmental/Documents/ACTIVE WORK/industrial_network_app/enviroconnect"

# Component domain folders
mkdir -p components/layout
mkdir -p components/shared
mkdir -p components/vendor
mkdir -p components/rfq
mkdir -p components/messaging
mkdir -p components/meetings
mkdir -p components/endorsements

# Convex domain folders
mkdir -p convex/users
mkdir -p convex/vendors
mkdir -p convex/rfq
mkdir -p convex/meetings
mkdir -p convex/messaging
mkdir -p convex/endorsements

# Docs reorganization
mkdir -p docs/design
mkdir -p docs/archive
mkdir -p docs/reference/redesign-mockup
mkdir -p docs/reference/assets
```

**Step 2: Verify directories exist**

```bash
find . -type d -not -path '*/node_modules/*' -not -path '*/.next/*' -not -path '*/.git/*' -not -path '*/_generated/*' | sort
```

**Step 3: Commit**

```bash
git add -A && git commit -m "chore: create target directory structure for folder restructure"
```

---

### Task 2: Move parent-directory files into docs/reference

**Files:**
- Move: `../project-kickoff.md` → `docs/reference/project-kickoff.md`
- Move: `../claude-code-app-build-guide.md` → `docs/reference/claude-code-app-build-guide.md`
- Move: `../Industrial_Environmental_Webapp.md` → `docs/reference/Industrial_Environmental_Webapp.md`
- Move: `../redesign-mockup/index.html` → `docs/reference/redesign-mockup/index.html`
- Move: `../Design_References & Assets/*` → `docs/reference/assets/`

**Step 1: Move files**

```bash
cd "/Users/blueenvironmental/Documents/ACTIVE WORK/industrial_network_app/enviroconnect"

mv ../project-kickoff.md docs/reference/
mv ../claude-code-app-build-guide.md docs/reference/
mv ../Industrial_Environmental_Webapp.md docs/reference/
mv "../redesign-mockup/index.html" docs/reference/redesign-mockup/
rmdir ../redesign-mockup
cp -R "../Design_References & Assets/"* docs/reference/assets/
rm -rf "../Design_References & Assets"
```

**Step 2: Verify parent directory is clean**

```bash
ls -la ..
# Should only show .claude/, enviroconnect/, .DS_Store
```

**Step 3: Commit**

```bash
git add -A && git commit -m "chore: consolidate parent-directory docs into docs/reference"
```

---

### Task 3: Archive completed plan/design docs

**Files:**
- Move: all 12 files from `docs/plans/` → `docs/archive/` (except this plan and the design doc)

**Step 1: Move completed docs**

```bash
cd "/Users/blueenvironmental/Documents/ACTIVE WORK/industrial_network_app/enviroconnect"

mv docs/plans/2026-02-28-design-refinements-design.md docs/archive/
mv docs/plans/2026-02-28-design-refinements.md docs/archive/
mv docs/plans/2026-03-01-rfq-system-design.md docs/archive/
mv docs/plans/2026-03-01-rfq-system.md docs/archive/
mv docs/plans/2026-03-02-proposal-tracking-attachments-design.md docs/archive/
mv docs/plans/2026-03-02-proposal-tracking-attachments.md docs/archive/
mv docs/plans/2026-03-07-in-app-messaging-design.md docs/archive/
mv docs/plans/2026-03-07-in-app-messaging.md docs/archive/
mv docs/plans/2026-03-07-trust-networks-design.md docs/archive/
mv docs/plans/2026-03-07-trust-networks.md docs/archive/
mv docs/plans/2026-03-09-meeting-scheduler-design.md docs/archive/
mv docs/plans/2026-03-09-meeting-scheduler.md docs/archive/
```

**Step 2: Move design doc to design folder**

```bash
mv docs/plans/2026-03-10-folder-restructure-design.md docs/design/
```

**Step 3: Verify**

```bash
ls docs/plans/    # Should only have this implementation plan
ls docs/archive/  # Should have 12 files
ls docs/design/   # Should have the restructure design doc
```

**Step 4: Commit**

```bash
git add -A && git commit -m "chore: archive completed docs, move design doc to docs/design"
```

---

### Task 4: Delete unused starter assets

**Files:**
- Delete: `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg`

**Step 1: Remove files**

```bash
cd "/Users/blueenvironmental/Documents/ACTIVE WORK/industrial_network_app/enviroconnect"

rm public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg
```

**Step 2: Verify no references exist**

```bash
grep -r "file\.svg\|globe\.svg\|next\.svg\|vercel\.svg\|window\.svg" --include="*.tsx" --include="*.ts" --include="*.css" .
# Should return nothing (these are unused create-next-app defaults)
```

**Step 3: Commit**

```bash
git add -A && git commit -m "chore: remove unused create-next-app starter assets"
```

---

### Task 5: Move layout components

**Files:**
- Move: `components/Navbar.tsx` → `components/layout/Navbar.tsx`
- Move: `components/Footer.tsx` → `components/layout/Footer.tsx`
- Move: `components/ScrollReveal.tsx` → `components/layout/ScrollReveal.tsx`
- Modify: `app/layout.tsx` (lines 4-5)
- Modify: `app/about/page.tsx` (line 5)
- Modify: `app/page.tsx` (line 2)

**Step 1: Move files**

```bash
cd "/Users/blueenvironmental/Documents/ACTIVE WORK/industrial_network_app/enviroconnect"

mv components/Navbar.tsx components/layout/
mv components/Footer.tsx components/layout/
mv components/ScrollReveal.tsx components/layout/
```

**Step 2: Update imports**

In `app/layout.tsx`:
- `@/components/Navbar` → `@/components/layout/Navbar`
- `@/components/Footer` → `@/components/layout/Footer`

In `app/page.tsx`:
- `@/components/ScrollReveal` → `@/components/layout/ScrollReveal`

In `app/about/page.tsx`:
- `@/components/ScrollReveal` → `@/components/layout/ScrollReveal`

**Step 3: Verify build**

```bash
npm run build 2>&1 | head -50
```

**Step 4: Commit**

```bash
git add -A && git commit -m "refactor: move layout components to components/layout"
```

---

### Task 6: Move shared components

**Files:**
- Move: `components/ThemeProvider.tsx` → `components/shared/ThemeProvider.tsx`
- Move: `components/ThemeToggle.tsx` → `components/shared/ThemeToggle.tsx`
- Move: `components/NotificationBell.tsx` → `components/shared/NotificationBell.tsx`
- Move: `components/UserSearch.tsx` → `components/shared/UserSearch.tsx`
- Move: `components/PdfUpload.tsx` → `components/shared/PdfUpload.tsx`
- Move: `components/PdfPreviewModal.tsx` → `components/shared/PdfPreviewModal.tsx`
- Move: `components/SkeletonCard.tsx` → `components/shared/SkeletonCard.tsx`
- Move: `components/SkeletonProfile.tsx` → `components/shared/SkeletonProfile.tsx`

**Step 1: Move files**

```bash
cd "/Users/blueenvironmental/Documents/ACTIVE WORK/industrial_network_app/enviroconnect"

mv components/ThemeProvider.tsx components/shared/
mv components/ThemeToggle.tsx components/shared/
mv components/NotificationBell.tsx components/shared/
mv components/UserSearch.tsx components/shared/
mv components/PdfUpload.tsx components/shared/
mv components/PdfPreviewModal.tsx components/shared/
mv components/SkeletonCard.tsx components/shared/
mv components/SkeletonProfile.tsx components/shared/
```

**Step 2: Update imports**

| Old Import | New Import | Files |
|-----------|-----------|-------|
| `@/components/ThemeProvider` | `@/components/shared/ThemeProvider` | `app/providers.tsx` |
| `@/components/ThemeToggle` | `@/components/shared/ThemeToggle` | `components/layout/Navbar.tsx` |
| `@/components/NotificationBell` | `@/components/shared/NotificationBell` | `components/layout/Navbar.tsx` |
| `@/components/UserSearch` | `@/components/shared/UserSearch` | `components/messaging/NewMessageModal.tsx` (after Task 8) |
| `@/components/PdfUpload` | `@/components/shared/PdfUpload` | `app/rfq/[id]/page.tsx`, `components/messaging/ChatInput.tsx` (after Task 8) |
| `@/components/PdfPreviewModal` | `@/components/shared/PdfPreviewModal` | `app/rfq/[id]/page.tsx`, `components/messaging/ChatThread.tsx` (after Task 8) |
| `@/components/SkeletonCard` | `@/components/shared/SkeletonCard` | `app/dashboard/facility/page.tsx`, `app/directory/DirectoryClient.tsx` |
| `@/components/SkeletonProfile` | `@/components/shared/SkeletonProfile` | `app/directory/[id]/page.tsx` |

**Important:** Some importing files (Navbar, NewMessageModal, ChatInput, ChatThread) will themselves be moved in later tasks. Update imports based on their CURRENT location now. They will be correct relative to `@/` regardless of where the importing file lives.

**Step 3: Verify build**

```bash
npm run build 2>&1 | head -50
```

**Step 4: Commit**

```bash
git add -A && git commit -m "refactor: move shared components to components/shared"
```

---

### Task 7: Move vendor components

**Files:**
- Move: `components/VendorCard.tsx` → `components/vendor/VendorCard.tsx`
- Modify: `app/dashboard/facility/page.tsx` (line 5)
- Modify: `app/directory/DirectoryClient.tsx` (line 5)

**Step 1: Move file**

```bash
mv components/VendorCard.tsx components/vendor/
```

**Step 2: Update imports**

- `@/components/VendorCard` → `@/components/vendor/VendorCard` in both files

**Step 3: Verify build**

```bash
npm run build 2>&1 | head -50
```

**Step 4: Commit**

```bash
git add -A && git commit -m "refactor: move vendor components to components/vendor"
```

---

### Task 8: Move messaging components

**Files:**
- Move: `components/ChatIcon.tsx` → `components/messaging/ChatIcon.tsx`
- Move: `components/ChatInput.tsx` → `components/messaging/ChatInput.tsx`
- Move: `components/ChatThread.tsx` → `components/messaging/ChatThread.tsx`
- Move: `components/ConversationList.tsx` → `components/messaging/ConversationList.tsx`
- Move: `components/NewMessageModal.tsx` → `components/messaging/NewMessageModal.tsx`

**Step 1: Move files**

```bash
cd "/Users/blueenvironmental/Documents/ACTIVE WORK/industrial_network_app/enviroconnect"

mv components/ChatIcon.tsx components/messaging/
mv components/ChatInput.tsx components/messaging/
mv components/ChatThread.tsx components/messaging/
mv components/ConversationList.tsx components/messaging/
mv components/NewMessageModal.tsx components/messaging/
```

**Step 2: Update imports**

| Old Import | New Import | Files |
|-----------|-----------|-------|
| `@/components/ChatIcon` | `@/components/messaging/ChatIcon` | `components/layout/Navbar.tsx` |
| `@/components/ChatInput` | `@/components/messaging/ChatInput` | `app/messages/MessagesClient.tsx` |
| `@/components/ChatThread` | `@/components/messaging/ChatThread` | `app/messages/MessagesClient.tsx` |
| `@/components/ConversationList` | `@/components/messaging/ConversationList` | `app/messages/MessagesClient.tsx` |
| `@/components/NewMessageModal` | `@/components/messaging/NewMessageModal` | `app/messages/MessagesClient.tsx` |

**Step 3: Verify build**

```bash
npm run build 2>&1 | head -50
```

**Step 4: Commit**

```bash
git add -A && git commit -m "refactor: move messaging components to components/messaging"
```

---

### Task 9: Move meetings components

**Files:**
- Move: `components/MeetingCard.tsx` → `components/meetings/MeetingCard.tsx`
- Move: `components/MeetingRequestModal.tsx` → `components/meetings/MeetingRequestModal.tsx`
- Move: `components/CalendarLinks.tsx` → `components/meetings/CalendarLinks.tsx`
- Move: `components/TimeSlotPicker.tsx` → `components/meetings/TimeSlotPicker.tsx`

**Step 1: Move files**

```bash
cd "/Users/blueenvironmental/Documents/ACTIVE WORK/industrial_network_app/enviroconnect"

mv components/MeetingCard.tsx components/meetings/
mv components/MeetingRequestModal.tsx components/meetings/
mv components/CalendarLinks.tsx components/meetings/
mv components/TimeSlotPicker.tsx components/meetings/
```

**Step 2: Update imports**

| Old Import | New Import | Files |
|-----------|-----------|-------|
| `@/components/MeetingCard` | `@/components/meetings/MeetingCard` | `app/dashboard/facility/page.tsx`, `app/dashboard/vendor/page.tsx`, `app/meetings/MeetingsClient.tsx` |
| `@/components/MeetingRequestModal` | `@/components/meetings/MeetingRequestModal` | `app/directory/[id]/page.tsx`, `app/rfq/[id]/page.tsx` |
| `@/components/CalendarLinks` | `@/components/meetings/CalendarLinks` | `components/meetings/MeetingCard.tsx` |
| `@/components/TimeSlotPicker` | `@/components/meetings/TimeSlotPicker` | `components/meetings/MeetingCard.tsx`, `components/meetings/MeetingRequestModal.tsx` |

**Note:** CalendarLinks and TimeSlotPicker are imported by MeetingCard and MeetingRequestModal which are now in the same folder. The `@/` alias imports still work the same way regardless.

**Step 3: Verify build**

```bash
npm run build 2>&1 | head -50
```

**Step 4: Commit**

```bash
git add -A && git commit -m "refactor: move meetings components to components/meetings"
```

---

### Task 10: Move endorsement components

**Files:**
- Move: `components/EndorseButton.tsx` → `components/endorsements/EndorseButton.tsx`
- Move: `components/EndorsementBadge.tsx` → `components/endorsements/EndorsementBadge.tsx`
- Move: `components/EndorsersModal.tsx` → `components/endorsements/EndorsersModal.tsx`

**Step 1: Move files**

```bash
cd "/Users/blueenvironmental/Documents/ACTIVE WORK/industrial_network_app/enviroconnect"

mv components/EndorseButton.tsx components/endorsements/
mv components/EndorsementBadge.tsx components/endorsements/
mv components/EndorsersModal.tsx components/endorsements/
```

**Step 2: Update imports**

| Old Import | New Import | Files |
|-----------|-----------|-------|
| `@/components/EndorseButton` | `@/components/endorsements/EndorseButton` | `app/directory/[id]/page.tsx` |
| `@/components/EndorsementBadge` | `@/components/endorsements/EndorsementBadge` | `app/directory/[id]/page.tsx`, `components/vendor/VendorCard.tsx` |
| `@/components/EndorsersModal` | `@/components/endorsements/EndorsersModal` | `app/directory/[id]/page.tsx` |

**Step 3: Verify build**

```bash
npm run build 2>&1 | head -50
```

**Step 4: Commit**

```bash
git add -A && git commit -m "refactor: move endorsement components to components/endorsements"
```

---

### Task 11: Move RFQ components

**Files:**
- Move: `components/RfqCard.tsx` → `components/rfq/RfqCard.tsx`
- Move: `components/SkeletonRfq.tsx` → `components/rfq/SkeletonRfq.tsx`

**Step 1: Move files**

```bash
cd "/Users/blueenvironmental/Documents/ACTIVE WORK/industrial_network_app/enviroconnect"

mv components/RfqCard.tsx components/rfq/
mv components/SkeletonRfq.tsx components/rfq/
```

**Step 2: Update imports**

| Old Import | New Import | Files |
|-----------|-----------|-------|
| `@/components/RfqCard` | `@/components/rfq/RfqCard` | `app/rfq/RfqBoardClient.tsx` |
| `@/components/SkeletonRfq` | `@/components/rfq/SkeletonRfq` | `app/rfq/RfqBoardClient.tsx` |

**Step 3: Verify build**

```bash
npm run build 2>&1 | head -50
```

**Step 4: Commit**

```bash
git add -A && git commit -m "refactor: move RFQ components to components/rfq"
```

---

### Task 12: Verify components/ root is empty, clean up

**Step 1: Check for leftover files**

```bash
ls components/
# Should only show domain folders: endorsements/ layout/ meetings/ messaging/ rfq/ shared/ vendor/
```

**Step 2: Remove any .DS_Store files**

```bash
find components/ -name ".DS_Store" -delete
```

**Step 3: Full build verification**

```bash
npm run build
```

Expected: Clean build, no errors.

**Step 4: Commit (only if .DS_Store cleanup was needed)**

```bash
git add -A && git commit -m "chore: clean up .DS_Store files in components"
```

---

### Task 13: Move Convex users files

**Files:**
- Move: `convex/users.ts` → `convex/users/queries.ts`
- **Note:** `users.ts` contains both queries AND the `createUser` + `updateUser` mutations. Split into `queries.ts` and `mutations.ts`.

**Step 1: Read `convex/users.ts` to understand contents**

Read the file and identify which exports are queries vs mutations.

**Step 2: Create `convex/users/queries.ts`**

Copy all query functions from `convex/users.ts`. Keep all imports.

**Step 3: Create `convex/users/mutations.ts`**

Copy all mutation functions from `convex/users.ts`. Keep all imports.

**Step 4: Delete `convex/users.ts`**

```bash
rm convex/users.ts
```

**Step 5: Run codegen**

```bash
npx convex codegen
```

**Step 6: Update frontend imports**

API path changes:
- `api.users.getUserByClerkId` → `api.users.queries.getUserByClerkId` (11 files)
- `api.users.createUser` → `api.users.mutations.createUser` (1 file: `app/onboarding/page.tsx`)
- `api.users.updateUser` → `api.users.mutations.updateUser` (1 file: `convex/http.ts`)

Files to update:
- `components/layout/Navbar.tsx` (line 14)
- `app/onboarding/page.tsx` (line 11)
- `app/dashboard/page.tsx` (line 12)
- `app/dashboard/vendor/page.tsx` (line 13)
- `app/dashboard/facility/page.tsx` (line 29)
- `app/directory/[id]/page.tsx` (line 23)
- `app/rfq/RfqBoardClient.tsx` (line 14)
- `app/rfq/[id]/page.tsx` (line 31)
- `app/rfq/new/page.tsx` (line 35)
- `app/meetings/MeetingsClient.tsx` (line 13)
- `app/messages/MessagesClient.tsx` (line 15)
- `convex/http.ts` (line 47)

**Step 7: Verify build**

```bash
npm run build 2>&1 | head -50
```

**Step 8: Commit**

```bash
git add -A && git commit -m "refactor: move users Convex functions to convex/users/"
```

---

### Task 14: Move Convex vendors files

**Files:**
- Move: `convex/vendors.ts` → `convex/vendors/queries.ts`
- Move: `convex/mutations.ts` → `convex/vendors/mutations.ts`

**Step 1: Move files**

```bash
cd "/Users/blueenvironmental/Documents/ACTIVE WORK/industrial_network_app/enviroconnect"

mv convex/vendors.ts convex/vendors/queries.ts
mv convex/mutations.ts convex/vendors/mutations.ts
```

**Step 2: Run codegen**

```bash
npx convex codegen
```

**Step 3: Update frontend imports**

API path changes:
- `api.vendors.*` → `api.vendors.queries.*`
- `api.mutations.*` → `api.vendors.mutations.*`

| Old | New | Files |
|-----|-----|-------|
| `api.vendors.getVendorProfile` | `api.vendors.queries.getVendorProfile` | `app/directory/[id]/page.tsx` |
| `api.vendors.isVendorSaved` | `api.vendors.queries.isVendorSaved` | `app/directory/[id]/page.tsx` |
| `api.vendors.getVendorProfiles` | `api.vendors.queries.getVendorProfiles` | `app/directory/DirectoryClient.tsx`, `app/rfq/new/page.tsx` |
| `api.vendors.getVendorProfileByUserId` | `api.vendors.queries.getVendorProfileByUserId` | `app/dashboard/vendor/page.tsx`, `app/rfq/[id]/page.tsx` |
| `api.vendors.getSavedVendors` | `api.vendors.queries.getSavedVendors` | `app/dashboard/facility/page.tsx` |
| `api.mutations.saveVendor` | `api.vendors.mutations.saveVendor` | `app/directory/[id]/page.tsx` |
| `api.mutations.unsaveVendor` | `api.vendors.mutations.unsaveVendor` | `app/directory/[id]/page.tsx` |
| `api.mutations.createVendorProfile` | `api.vendors.mutations.createVendorProfile` | `app/dashboard/vendor/page.tsx` |
| `api.mutations.togglePublishProfile` | `api.vendors.mutations.togglePublishProfile` | `app/dashboard/vendor/page.tsx` |
| `api.mutations.updateVendorProfile` | `api.vendors.mutations.updateVendorProfile` | `app/dashboard/vendor/ProfileForm.tsx` |

**Step 4: Verify build**

```bash
npm run build 2>&1 | head -50
```

**Step 5: Commit**

```bash
git add -A && git commit -m "refactor: move vendors Convex functions to convex/vendors/"
```

---

### Task 15: Move Convex RFQ files

**Files:**
- Move: `convex/rfqs.ts` → `convex/rfq/queries.ts`
- Move: `convex/rfqMutations.ts` → `convex/rfq/mutations.ts`

**Step 1: Move files**

```bash
mv convex/rfqs.ts convex/rfq/queries.ts
mv convex/rfqMutations.ts convex/rfq/mutations.ts
```

**Step 2: Run codegen**

```bash
npx convex codegen
```

**Step 3: Update frontend imports**

| Old | New | Files |
|-----|-----|-------|
| `api.rfqs.getRfqs` | `api.rfq.queries.getRfqs` | `app/rfq/RfqBoardClient.tsx` |
| `api.rfqs.getRfq` | `api.rfq.queries.getRfq` | `app/rfq/[id]/page.tsx` |
| `api.rfqs.getRfqResponses` | `api.rfq.queries.getRfqResponses` | `app/rfq/[id]/page.tsx` |
| `api.rfqs.hasVendorResponded` | `api.rfq.queries.hasVendorResponded` | `app/rfq/[id]/page.tsx` |
| `api.rfqs.getMatchedRfqs` | `api.rfq.queries.getMatchedRfqs` | `app/dashboard/vendor/page.tsx` |
| `api.rfqs.getVendorResponses` | `api.rfq.queries.getVendorResponses` | `app/dashboard/vendor/page.tsx` |
| `api.rfqs.getMyRfqs` | `api.rfq.queries.getMyRfqs` | `app/dashboard/facility/page.tsx` |
| `api.rfqs.getUnreadNotificationCount` | `api.rfq.queries.getUnreadNotificationCount` | `components/shared/NotificationBell.tsx` |
| `api.rfqs.getNotifications` | `api.rfq.queries.getNotifications` | `components/shared/NotificationBell.tsx` |
| `api.rfqMutations.createRfq` | `api.rfq.mutations.createRfq` | `app/rfq/new/page.tsx` |
| `api.rfqMutations.submitProposal` | `api.rfq.mutations.submitProposal` | `app/rfq/[id]/page.tsx` |
| `api.rfqMutations.acceptProposal` | `api.rfq.mutations.acceptProposal` | `app/rfq/[id]/page.tsx` |
| `api.rfqMutations.declineProposal` | `api.rfq.mutations.declineProposal` | `app/rfq/[id]/page.tsx` |
| `api.rfqMutations.closeRfq` | `api.rfq.mutations.closeRfq` | `app/rfq/[id]/page.tsx` |
| `api.rfqMutations.generateUploadUrl` | `api.rfq.mutations.generateUploadUrl` | `app/rfq/[id]/page.tsx`, `components/messaging/ChatInput.tsx` |
| `api.rfqMutations.markNotificationRead` | `api.rfq.mutations.markNotificationRead` | `components/shared/NotificationBell.tsx` |
| `api.rfqMutations.markAllNotificationsRead` | `api.rfq.mutations.markAllNotificationsRead` | `components/shared/NotificationBell.tsx` |

**Step 4: Verify build**

```bash
npm run build 2>&1 | head -50
```

**Step 5: Commit**

```bash
git add -A && git commit -m "refactor: move RFQ Convex functions to convex/rfq/"
```

---

### Task 16: Move Convex meetings files

**Files:**
- Move: `convex/meetings.ts` → `convex/meetings/queries.ts`
- Move: `convex/meetingMutations.ts` → `convex/meetings/mutations.ts`

**Step 1: Move files**

```bash
mv convex/meetings.ts convex/meetings/queries.ts
mv convex/meetingMutations.ts convex/meetings/mutations.ts
```

**Step 2: Run codegen**

```bash
npx convex codegen
```

**Step 3: Update frontend imports**

| Old | New | Files |
|-----|-----|-------|
| `api.meetings.getMyMeetings` | `api.meetings.queries.getMyMeetings` | `app/meetings/MeetingsClient.tsx` |
| `api.meetings.getUpcomingMeetings` | `api.meetings.queries.getUpcomingMeetings` | `app/dashboard/vendor/page.tsx`, `app/dashboard/facility/page.tsx` |
| `api.meetings.getPendingMeetingCount` | `api.meetings.queries.getPendingMeetingCount` | `app/dashboard/vendor/page.tsx`, `app/dashboard/facility/page.tsx` |
| `api.meetingMutations.createMeetingRequest` | `api.meetings.mutations.createMeetingRequest` | `components/meetings/MeetingRequestModal.tsx` |
| `api.meetingMutations.acceptMeetingSlot` | `api.meetings.mutations.acceptMeetingSlot` | `components/meetings/MeetingCard.tsx` |
| `api.meetingMutations.counterProposeMeeting` | `api.meetings.mutations.counterProposeMeeting` | `components/meetings/MeetingCard.tsx` |
| `api.meetingMutations.declineMeeting` | `api.meetings.mutations.declineMeeting` | `components/meetings/MeetingCard.tsx` |

**Step 4: Verify build**

```bash
npm run build 2>&1 | head -50
```

**Step 5: Commit**

```bash
git add -A && git commit -m "refactor: move meetings Convex functions to convex/meetings/"
```

---

### Task 17: Move Convex messaging files

**Files:**
- Move: `convex/messaging.ts` → `convex/messaging/queries.ts`
- Move: `convex/messagingMutations.ts` → `convex/messaging/mutations.ts`

**Step 1: Move files**

```bash
mv convex/messaging.ts convex/messaging/queries.ts
mv convex/messagingMutations.ts convex/messaging/mutations.ts
```

**Step 2: Run codegen**

```bash
npx convex codegen
```

**Step 3: Update frontend imports**

| Old | New | Files |
|-----|-----|-------|
| `api.messaging.getConversations` | `api.messaging.queries.getConversations` | `app/messages/MessagesClient.tsx` |
| `api.messaging.getMessages` | `api.messaging.queries.getMessages` | `app/messages/MessagesClient.tsx` |
| `api.messaging.getConversation` | `api.messaging.queries.getConversation` | `app/messages/MessagesClient.tsx` |
| `api.messaging.getUnreadCount` | `api.messaging.queries.getUnreadCount` | `components/messaging/ChatIcon.tsx` |
| `api.messaging.searchUsers` | `api.messaging.queries.searchUsers` | `components/shared/UserSearch.tsx` |
| `api.messagingMutations.sendMessage` | `api.messaging.mutations.sendMessage` | `components/messaging/ChatInput.tsx` |
| `api.messagingMutations.markConversationRead` | `api.messaging.mutations.markConversationRead` | `app/messages/MessagesClient.tsx` |
| `api.messagingMutations.createConversation` | `api.messaging.mutations.createConversation` | `components/messaging/NewMessageModal.tsx` |

**Step 4: Verify build**

```bash
npm run build 2>&1 | head -50
```

**Step 5: Commit**

```bash
git add -A && git commit -m "refactor: move messaging Convex functions to convex/messaging/"
```

---

### Task 18: Move Convex endorsements files

**Files:**
- Move: `convex/endorsements.ts` → `convex/endorsements/queries.ts`
- Move: `convex/endorsementMutations.ts` → `convex/endorsements/mutations.ts`

**Step 1: Move files**

```bash
mv convex/endorsements.ts convex/endorsements/queries.ts
mv convex/endorsementMutations.ts convex/endorsements/mutations.ts
```

**Step 2: Run codegen**

```bash
npx convex codegen
```

**Step 3: Update frontend imports**

| Old | New | Files |
|-----|-----|-------|
| `api.endorsements.getEndorsementCounts` | `api.endorsements.queries.getEndorsementCounts` | `app/directory/[id]/page.tsx` |
| `api.endorsements.getEndorsementCountsBatch` | `api.endorsements.queries.getEndorsementCountsBatch` | `app/directory/DirectoryClient.tsx` |
| `api.endorsements.hasEndorsed` | `api.endorsements.queries.hasEndorsed` | `components/endorsements/EndorseButton.tsx` |
| `api.endorsements.getEndorsers` | `api.endorsements.queries.getEndorsers` | `components/endorsements/EndorsersModal.tsx` |
| `api.endorsementMutations.toggleEndorsement` | `api.endorsements.mutations.toggleEndorsement` | `components/endorsements/EndorseButton.tsx` |

**Step 4: Verify build**

```bash
npm run build 2>&1 | head -50
```

**Step 5: Commit**

```bash
git add -A && git commit -m "refactor: move endorsements Convex functions to convex/endorsements/"
```

---

### Task 19: Clean up Convex root and verify

**Step 1: Check convex/ root is clean**

```bash
ls convex/
# Should show: _generated/ auth.config.ts endorsements/ http.ts meetings/ messaging/ rfq/ schema.ts users/ vendors/
```

**Step 2: Remove any .DS_Store**

```bash
find convex/ -name ".DS_Store" -delete
```

**Step 3: Full build**

```bash
npm run build
```

Expected: Clean build, zero errors.

**Step 4: Commit if needed**

```bash
git add -A && git commit -m "chore: clean up convex directory"
```

---

### Task 20: Update CLAUDE.md with new file paths

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Read current CLAUDE.md**

Read the file to understand current path references.

**Step 2: Update all file path references**

Update the Key Files section and any other path references to reflect the new structure:
- `components/Navbar.tsx` → `components/layout/Navbar.tsx`
- `components/Footer.tsx` → `components/layout/Footer.tsx`
- `convex/rfqs.ts` → `convex/rfq/queries.ts`
- `convex/rfqMutations.ts` → `convex/rfq/mutations.ts`
- `convex/meetings.ts` → `convex/meetings/queries.ts`
- `convex/meetingMutations.ts` → `convex/meetings/mutations.ts`
- `convex/vendors.ts` → `convex/vendors/queries.ts`
- `convex/mutations.ts` → `convex/vendors/mutations.ts`
- `convex/users.ts` → `convex/users/queries.ts` + `convex/users/mutations.ts`
- etc.

Also update the docs references:
- `docs/plans/` description to note plans/ is for active plans, archive/ for completed

**Step 3: Verify the doc is accurate**

Re-read and ensure all paths are correct.

**Step 4: Commit**

```bash
git add CLAUDE.md && git commit -m "docs: update CLAUDE.md with restructured file paths"
```

---

### Task 21: Update MEMORY.md with new file paths

**Files:**
- Modify: `/Users/blueenvironmental/.claude/projects/-Users-blueenvironmental-Documents-ACTIVE-WORK-industrial-network-app/memory/MEMORY.md`

**Step 1: Update Key Files section**

Update all path references to reflect the new structure, matching changes from Task 20.

**Step 2: Add note about folder restructure**

Add to Status section:
- [x] Folder restructure — feature-domain colocation for components + Convex backend

**Step 3: Commit (memory file is outside git, so just save)**

No git commit needed — memory file is outside the repo.

---

### Task 22: Final verification

**Step 1: Full clean build**

```bash
cd "/Users/blueenvironmental/Documents/ACTIVE WORK/industrial_network_app/enviroconnect"
rm -rf .next
npm run build
```

Expected: Clean build, zero errors.

**Step 2: Verify directory structure matches design**

```bash
find . -type d -not -path '*/node_modules/*' -not -path '*/.next/*' -not -path '*/.git/*' -not -path '*/_generated/*' | sort
```

Compare against the target structure in the design doc.

**Step 3: Verify no files left in old locations**

```bash
ls components/  # Should only show domain folders
ls convex/      # Should show schema.ts, auth.config.ts, http.ts, and domain folders
```

**Step 4: Run dev server quick check**

```bash
npm run dev &
sleep 5
curl -s http://localhost:3000 | head -20
kill %1
```

**Step 5: Commit any final cleanups**

```bash
git add -A && git commit -m "chore: folder restructure complete — final verification"
```
