# Proposal Tracking + Document Attachments — Design Doc

**Date:** 2026-03-02
**Status:** Approved

## Overview

Two features for the vendor proposal workflow:
1. **Proposal status tracking** — "My Proposals" section on the vendor dashboard showing all submitted proposals with their current status (submitted/accepted/declined).
2. **Document attachments** — Vendors can attach up to 5 PDF files per proposal. Facility managers can preview PDFs in-browser and download them.

## Design Inspiration

- **iCAT (Red Antler):** Bold, authoritative typography. High-contrast status badges. Strategic whitespace. Precision feel.
- **Raft (Red Antler):** Warm beige backgrounds. Generous spacing. Modular card layouts. Clean hierarchy through text scale.

## Decisions

- **File storage:** Convex built-in file storage (`_storage` table)
- **File types:** PDF only
- **Max attachments:** 5 per proposal, 20MB each
- **Viewing:** In-browser PDF preview (modal with iframe) + download button
- **Proposal text:** Relabeled as "Message" — a cover note sent alongside attached documents

## Schema Changes

### `rfqResponses` table — add `attachments` field

```
attachments: v.optional(v.array(v.object({
  storageId: v.id("_storage"),
  fileName: v.string(),
  fileSize: v.number(),
})))
```

Optional array (backward-compatible with existing proposals that have no attachments).

## Backend Changes

### New mutation: `generateUploadUrl`
- Returns a Convex upload URL for the client to POST files to
- No auth check needed beyond being a logged-in vendor (Convex handles storage)

### Modified mutation: `submitProposal`
- Add optional `attachments` arg matching schema above
- Stores storageIds alongside the proposal

### New query: `getAttachmentUrl`
- Takes a `storageId`, returns temporary download URL via `ctx.storage.getUrl()`

### Modified query: `getRfqResponses`
- Enriches each response's attachments with download URLs

### Existing query: `getVendorResponses` (already built)
- Already returns all proposals by a vendor with RFQ data
- Will be used as-is for the vendor dashboard section

## Frontend Changes

### 1. Vendor Dashboard — "My Proposals" section

Located below "RFQ Matches" on `/dashboard/vendor`. Uses `getVendorResponses` query.

Each proposal card shows:
- RFQ title (linked to `/rfq/[id]`)
- Status badge (solid fill): Submitted = navy, Accepted = green, Declined = muted red
- Submitted date + attachment count
- Truncated message preview (1-2 lines)
- Estimated cost / timeline if provided

Design: generous padding (p-8), spacing between cards (gap-4), clean Raft-style modular layout. Status badges are bold solid pills with white text per iCAT authority principle.

### 2. Proposal Submission Form — Attachments

On `/rfq/[id]`, the proposal form gets:
- Textarea label changed to "Message" (cover note)
- New PDF upload zone: dashed border drop area, click to browse
- File list below upload zone showing: filename, size, remove (x) button
- Client-side validation: PDF only, max 5 files, max 20MB each
- Upload flow: generate URL → upload file → collect storageId → submit all with proposal

### 3. FM Proposal Review — Attachment Display

On `/rfq/[id]`, each proposal card in the FM view shows:
- Attachment list: file icon + filename + size
- Click opens modal with `<iframe>` PDF preview
- Download button per file
- Clean file cards with subtle hover lift

## File Storage Flow

```
1. Vendor clicks "Upload" or drops PDF
2. Client calls generateUploadUrl mutation → gets presigned URL
3. Client POSTs file to presigned URL → gets storageId back
4. Repeat for each file (up to 5)
5. Client calls submitProposal with storageIds array
6. FM views proposal → getRfqResponses returns attachment URLs
7. FM clicks attachment → modal with iframe preview, or download link
```

## Not In Scope

- Non-PDF file types
- File versioning or replacement
- Drag-and-drop reordering of attachments
- Attachment editing after submission
