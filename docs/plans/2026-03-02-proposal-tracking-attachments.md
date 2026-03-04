# Proposal Tracking + Document Attachments Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "My Proposals" section to the vendor dashboard showing proposal statuses, and add PDF attachment support (up to 5 files) to the proposal submission form with in-browser preview for facility managers.

**Architecture:** Convex built-in file storage for PDFs. Schema adds optional `attachments` array to `rfqResponses`. Upload flow: client generates upload URL via mutation → POSTs file → gets storageId → submits proposal with storageIds. FM views attachments via URLs resolved from storageIds in queries.

**Tech Stack:** Convex (file storage + mutations/queries), Next.js 14 App Router, React 19, Tailwind CSS v4

**Design references:** iCAT (bold status badges, authoritative type) + Raft (warm cream bg, generous spacing, modular cards)

---

### Task 1: Add `attachments` field to schema

**Files:**
- Modify: `convex/schema.ts:62-73`

**Step 1: Add optional attachments array to rfqResponses table**

In `convex/schema.ts`, find the `rfqResponses` table definition (line 62). Add the `attachments` field after `estimatedTimeline`:

```typescript
  rfqResponses: defineTable({
    rfqId: v.id("rfqs"),
    vendorProfileId: v.id("vendorProfiles"),
    proposalText: v.string(),
    estimatedCost: v.optional(v.string()),
    estimatedTimeline: v.optional(v.string()),
    attachments: v.optional(v.array(v.object({
      storageId: v.id("_storage"),
      fileName: v.string(),
      fileSize: v.number(),
    }))),
    status: v.union(v.literal("submitted"), v.literal("accepted"), v.literal("declined")),
    createdAt: v.number(),
  })
    .index("by_rfqId", ["rfqId"])
    .index("by_vendorProfileId", ["vendorProfileId"])
    .index("by_rfqId_vendorProfileId", ["rfqId", "vendorProfileId"]),
```

**Step 2: Verify Convex accepts the schema**

Run: `cd enviroconnect && npx convex dev --once`
Expected: Schema pushed successfully, no errors.

**Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "feat: add attachments field to rfqResponses schema"
```

---

### Task 2: Add file storage mutations and update submitProposal

**Files:**
- Modify: `convex/rfqMutations.ts:77-116`
- Add new export to: `convex/rfqMutations.ts` (at top, after imports)

**Step 1: Add generateUploadUrl mutation**

At the end of `convex/rfqMutations.ts` (after `markAllNotificationsRead`), add:

```typescript
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
```

**Step 2: Update submitProposal to accept attachments**

In the `submitProposal` mutation (line 77), add `attachments` to the args:

```typescript
export const submitProposal = mutation({
  args: {
    rfqId: v.id("rfqs"),
    vendorProfileId: v.id("vendorProfiles"),
    proposalText: v.string(),
    estimatedCost: v.optional(v.string()),
    estimatedTimeline: v.optional(v.string()),
    attachments: v.optional(v.array(v.object({
      storageId: v.id("_storage"),
      fileName: v.string(),
      fileSize: v.number(),
    }))),
  },
  handler: async (ctx, args) => {
    const rfq = await ctx.db.get(args.rfqId);
    if (!rfq || rfq.status !== "open") throw new Error("RFQ is not accepting proposals");

    const profile = await ctx.db.get(args.vendorProfileId);
    if (!profile || !profile.isPublished) throw new Error("Vendor profile not found");

    const existing = await ctx.db
      .query("rfqResponses")
      .withIndex("by_rfqId_vendorProfileId", (q) =>
        q.eq("rfqId", args.rfqId).eq("vendorProfileId", args.vendorProfileId)
      )
      .unique();
    if (existing) throw new Error("You have already responded to this RFQ");

    const now = Date.now();
    await ctx.db.insert("rfqResponses", {
      rfqId: args.rfqId,
      vendorProfileId: args.vendorProfileId,
      proposalText: args.proposalText,
      estimatedCost: args.estimatedCost,
      estimatedTimeline: args.estimatedTimeline,
      attachments: args.attachments,
      status: "submitted",
      createdAt: now,
    });

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
```

**Step 3: Verify Convex accepts the changes**

Run: `cd enviroconnect && npx convex dev --once`
Expected: Functions pushed successfully.

**Step 4: Commit**

```bash
git add convex/rfqMutations.ts
git commit -m "feat: add generateUploadUrl mutation and attachments to submitProposal"
```

---

### Task 3: Update queries to resolve attachment URLs

**Files:**
- Modify: `convex/rfqs.ts:64-80` (getRfqResponses)
- Modify: `convex/rfqs.ts:122-138` (getVendorResponses)

**Step 1: Update getRfqResponses to include attachment URLs**

Replace the `getRfqResponses` query (line 64-80) with:

```typescript
export const getRfqResponses = query({
  args: { rfqId: v.id("rfqs") },
  handler: async (ctx, args) => {
    const responses = await ctx.db
      .query("rfqResponses")
      .withIndex("by_rfqId", (q) => q.eq("rfqId", args.rfqId))
      .collect();

    const withProfiles = await Promise.all(
      responses.map(async (r) => {
        const profile = await ctx.db.get(r.vendorProfileId);
        const attachmentsWithUrls = r.attachments
          ? await Promise.all(
              r.attachments.map(async (a) => ({
                ...a,
                url: await ctx.storage.getUrl(a.storageId),
              }))
            )
          : undefined;
        return { ...r, vendorProfile: profile, attachmentsWithUrls };
      })
    );
    return withProfiles;
  },
});
```

**Step 2: Update getVendorResponses to include attachment count**

Replace the `getVendorResponses` query (line 122-138) with:

```typescript
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
        return {
          ...r,
          rfq,
          attachmentCount: r.attachments?.length ?? 0,
        };
      })
    );
    return withRfqs.sort((a, b) => b.createdAt - a.createdAt);
  },
});
```

**Step 3: Verify Convex accepts the changes**

Run: `cd enviroconnect && npx convex dev --once`
Expected: Functions pushed successfully.

**Step 4: Commit**

```bash
git add convex/rfqs.ts
git commit -m "feat: resolve attachment URLs in getRfqResponses and add count to getVendorResponses"
```

---

### Task 4: Add "My Proposals" section to vendor dashboard

**Files:**
- Modify: `app/dashboard/vendor/page.tsx`

**Step 1: Add the getVendorResponses query hook**

At the top of the `VendorDashboard` component (after the `matchedRfqs` query around line 19-22), add:

```typescript
  const myProposals = useQuery(
    api.rfqs.getVendorResponses,
    profile ? { vendorProfileId: profile._id } : "skip"
  );
```

**Step 2: Add the "My Proposals" section after the RFQ Matches section**

After the closing `</section>` tag of the RFQ Matches section (after line 210), add this new section before the closing `</div>` of the main content area:

```tsx
        {/* My Proposals Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-navy dark:text-cream">
              My Proposals
            </h2>
          </div>

          {myProposals === undefined && (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6 space-y-2"
                >
                  <div className="h-4 bg-cream-dark rounded w-2/3" />
                  <div className="h-3 bg-cream-dark rounded w-1/3" />
                </div>
              ))}
            </div>
          )}

          {myProposals?.length === 0 && (
            <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-10 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                You haven&apos;t submitted any proposals yet.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                Browse RFQs and submit proposals to track them here.
              </p>
              <Link
                href="/rfq"
                className="text-navy dark:text-cream font-medium underline hover:no-underline text-sm"
              >
                Browse the RFQ board
              </Link>
            </div>
          )}

          {myProposals && myProposals.length > 0 && (
            <div className="space-y-3">
              {myProposals.map((proposal) => (
                <Link
                  key={proposal._id}
                  href={`/rfq/${proposal.rfqId}`}
                  className="block bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="text-sm font-semibold text-navy dark:text-cream truncate">
                          {proposal.rfq?.title ?? "Unknown RFQ"}
                        </h3>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full text-white ${
                            proposal.status === "accepted"
                              ? "bg-green"
                              : proposal.status === "declined"
                                ? "bg-red-400"
                                : "bg-navy dark:bg-white/20"
                          }`}
                        >
                          {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                        <span>{new Date(proposal.createdAt).toLocaleDateString()}</span>
                        {proposal.attachmentCount > 0 && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span>{proposal.attachmentCount} attachment{proposal.attachmentCount !== 1 ? "s" : ""}</span>
                          </>
                        )}
                        {proposal.estimatedCost && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span>{proposal.estimatedCost}</span>
                          </>
                        )}
                        {proposal.estimatedTimeline && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span>{proposal.estimatedTimeline}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1">
                        {proposal.proposalText}
                      </p>
                    </div>
                    <span className="text-xs text-green font-medium shrink-0 mt-1">
                      View &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
```

**Step 3: Build check**

Run: `cd enviroconnect && npm run build`
Expected: Build succeeds with no errors.

**Step 4: Commit**

```bash
git add app/dashboard/vendor/page.tsx
git commit -m "feat: add My Proposals section to vendor dashboard"
```

---

### Task 5: Add PDF upload component

**Files:**
- Create: `components/PdfUpload.tsx`

**Step 1: Create the PdfUpload component**

Create `components/PdfUpload.tsx`:

```tsx
"use client";
import { useRef, useState, useCallback } from "react";

interface UploadedFile {
  file: File;
  storageId?: string;
  uploading?: boolean;
  error?: string;
}

interface PdfUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSizeMb?: number;
}

export function PdfUpload({
  files,
  onFilesChange,
  maxFiles = 5,
  maxSizeMb = 20,
}: PdfUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const remaining = maxFiles - files.length;
      if (remaining <= 0) return;

      const valid: UploadedFile[] = [];
      for (const file of fileArray.slice(0, remaining)) {
        if (file.type !== "application/pdf") continue;
        if (file.size > maxSizeMb * 1024 * 1024) continue;
        if (files.some((f) => f.file.name === file.name && f.file.size === file.size)) continue;
        valid.push({ file });
      }
      if (valid.length > 0) {
        onFilesChange([...files, ...valid]);
      }
    },
    [files, onFilesChange, maxFiles, maxSizeMb]
  );

  const removeFile = useCallback(
    (index: number) => {
      onFilesChange(files.filter((_, i) => i !== index));
    },
    [files, onFilesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Attachments (PDF, up to {maxFiles} files)
      </label>

      {files.length < maxFiles && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg px-4 py-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-green bg-green/5"
              : "border-cream-dark hover:border-green/50 dark:border-navy dark:hover:border-green/50"
          }`}
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Drop PDFs here or <span className="text-green font-medium">click to browse</span>
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Max {maxSizeMb}MB per file
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {files.map((f, i) => (
            <div
              key={`${f.file.name}-${i}`}
              className="flex items-center gap-2 bg-cream dark:bg-navy rounded-lg px-3 py-2 text-sm border border-cream-dark dark:border-navy-light"
            >
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8l-6-6H4zm7 1.5L16.5 9H12a1 1 0 01-1-1V3.5zM7 11h6a1 1 0 110 2H7a1 1 0 110-2zm0 3h4a1 1 0 110 2H7a1 1 0 110-2z" />
              </svg>
              <span className="text-navy dark:text-cream truncate max-w-[150px]">
                {f.file.name}
              </span>
              <span className="text-gray-400 text-xs shrink-0">{formatSize(f.file.size)}</span>
              {f.uploading && (
                <span className="text-xs text-green animate-pulse">Uploading...</span>
              )}
              {f.error && (
                <span className="text-xs text-red-500">{f.error}</span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
                className="text-gray-400 hover:text-red-500 transition-colors ml-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export type { UploadedFile };
```

**Step 2: Build check**

Run: `cd enviroconnect && npm run build`
Expected: Build succeeds (component is not imported yet, but should compile).

**Step 3: Commit**

```bash
git add components/PdfUpload.tsx
git commit -m "feat: add PdfUpload component with drag-and-drop"
```

---

### Task 6: Update proposal submission form with file uploads

**Files:**
- Modify: `app/rfq/[id]/page.tsx`

**Step 1: Add imports and upload state**

At the top of `app/rfq/[id]/page.tsx`, add the import (alongside existing imports):

```typescript
import { PdfUpload } from "@/components/PdfUpload";
import type { UploadedFile } from "@/components/PdfUpload";
```

Inside the `RfqDetailPage` component, after the existing `useMutation` calls (around line 43-46), add:

```typescript
  const generateUploadUrl = useMutation(api.rfqMutations.generateUploadUrl);
```

After the existing `useState` calls (around line 48-55), add:

```typescript
  const [uploadFiles, setUploadFiles] = useState<UploadedFile[]>([]);
```

**Step 2: Update the handleSubmitProposal function**

Replace the entire `handleSubmitProposal` function (lines 60-82) with:

```typescript
  const handleSubmitProposal = async () => {
    if (!vendorProfile) return;
    if (!proposalForm.proposalText.trim()) {
      setError("Message is required");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      // Upload all files first
      const attachments: { storageId: string; fileName: string; fileSize: number }[] = [];
      for (const uf of uploadFiles) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": uf.file.type },
          body: uf.file,
        });
        if (!result.ok) throw new Error(`Failed to upload ${uf.file.name}`);
        const { storageId } = await result.json();
        attachments.push({
          storageId,
          fileName: uf.file.name,
          fileSize: uf.file.size,
        });
      }

      await submitProposal({
        rfqId,
        vendorProfileId: vendorProfile._id,
        proposalText: proposalForm.proposalText.trim(),
        estimatedCost: proposalForm.estimatedCost.trim() || undefined,
        estimatedTimeline: proposalForm.estimatedTimeline.trim() || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      setSuccess("Proposal submitted!");
      setProposalForm({ proposalText: "", estimatedCost: "", estimatedTimeline: "" });
      setUploadFiles([]);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit proposal");
    } finally {
      setSubmitting(false);
    }
  };
```

**Step 3: Update the proposal form UI**

Replace the proposal form section (lines 194-242). Find the section starting with `{isVendor && vendorProfile && rfq.status === "open" && !hasResponded && (` and replace it with:

```tsx
            {isVendor && vendorProfile && rfq.status === "open" && !hasResponded && (
              <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-8">
                <h2 className="text-lg font-semibold text-navy dark:text-cream mb-5">Submit a Proposal</h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message *</label>
                    <textarea
                      value={proposalForm.proposalText}
                      onChange={(e) => setProposalForm((prev) => ({ ...prev, proposalText: e.target.value }))}
                      placeholder="Brief cover note with your proposal..."
                      rows={4}
                      maxLength={2000}
                      className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy dark:border-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-green/50 resize-vertical"
                    />
                  </div>
                  <PdfUpload files={uploadFiles} onFilesChange={setUploadFiles} />
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
                    {submitting ? "Uploading & Submitting..." : "Submit Proposal"}
                  </button>
                </div>
              </div>
            )}
```

**Step 4: Build check**

Run: `cd enviroconnect && npm run build`
Expected: Build succeeds with no errors.

**Step 5: Commit**

```bash
git add app/rfq/[id]/page.tsx
git commit -m "feat: add PDF upload to proposal submission form"
```

---

### Task 7: Add PDF preview modal component

**Files:**
- Create: `components/PdfPreviewModal.tsx`

**Step 1: Create the PdfPreviewModal component**

Create `components/PdfPreviewModal.tsx`:

```tsx
"use client";
import { useEffect } from "react";

interface PdfPreviewModalProps {
  url: string;
  fileName: string;
  onClose: () => void;
}

export function PdfPreviewModal({ url, fileName, onClose }: PdfPreviewModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-navy-light rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-dark dark:border-navy">
          <h3 className="text-sm font-semibold text-navy dark:text-cream truncate">
            {fileName}
          </h3>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={url}
              download={fileName}
              className="text-xs text-green font-medium hover:underline"
            >
              Download
            </a>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-navy dark:hover:text-cream transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <iframe
            src={url}
            className="w-full h-full rounded-b-xl"
            title={fileName}
          />
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Build check**

Run: `cd enviroconnect && npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add components/PdfPreviewModal.tsx
git commit -m "feat: add PdfPreviewModal component for in-browser PDF viewing"
```

---

### Task 8: Add attachment display to FM proposal review

**Files:**
- Modify: `app/rfq/[id]/page.tsx`

**Step 1: Add PdfPreviewModal import and state**

At the top of `app/rfq/[id]/page.tsx`, add alongside existing imports:

```typescript
import { PdfPreviewModal } from "@/components/PdfPreviewModal";
```

Inside the component, after the existing `useState` declarations, add:

```typescript
  const [previewFile, setPreviewFile] = useState<{ url: string; fileName: string } | null>(null);
```

**Step 2: Add attachment display inside each proposal card (FM view)**

In the FM proposal review section (the `{isOwner && (` block), find the line that renders `r.proposalText` (the `<p>` with `whitespace-pre-wrap mb-3`). After the cost/timeline div that follows it (the `<div className="flex gap-4 text-sm text-gray-500 mb-3">`), add the attachments display:

After:
```tsx
                        <div className="flex gap-4 text-sm text-gray-500 mb-3">
                          {r.estimatedCost && <span>Cost: <strong className="text-navy dark:text-white">{r.estimatedCost}</strong></span>}
                          {r.estimatedTimeline && <span>Timeline: <strong className="text-navy dark:text-white">{r.estimatedTimeline}</strong></span>}
                        </div>
```

Add:
```tsx
                        {r.attachmentsWithUrls && r.attachmentsWithUrls.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {r.attachmentsWithUrls.map((a, i) => (
                              <button
                                key={i}
                                onClick={() =>
                                  a.url && setPreviewFile({ url: a.url, fileName: a.fileName })
                                }
                                className="flex items-center gap-2 bg-cream dark:bg-navy rounded-lg px-3 py-2 text-sm border border-cream-dark dark:border-navy-light hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200"
                              >
                                <svg className="w-4 h-4 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8l-6-6H4zm7 1.5L16.5 9H12a1 1 0 01-1-1V3.5zM7 11h6a1 1 0 110 2H7a1 1 0 110-2zm0 3h4a1 1 0 110 2H7a1 1 0 110-2z" />
                                </svg>
                                <span className="text-navy dark:text-cream text-xs font-medium truncate max-w-[150px]">
                                  {a.fileName}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
```

**Step 3: Add the modal at the bottom of the page**

Just before the final closing `</main>` tag, add:

```tsx
      {previewFile && (
        <PdfPreviewModal
          url={previewFile.url}
          fileName={previewFile.fileName}
          onClose={() => setPreviewFile(null)}
        />
      )}
```

**Step 4: Build check**

Run: `cd enviroconnect && npm run build`
Expected: Build succeeds with no errors.

**Step 5: Commit**

```bash
git add app/rfq/[id]/page.tsx
git commit -m "feat: add attachment display with PDF preview to FM proposal review"
```

---

### Task 9: Deploy Convex functions and verify build

**Step 1: Deploy Convex functions to dev**

Run: `cd enviroconnect && npx convex dev --once`
Expected: All functions + schema deployed successfully.

**Step 2: Full build check**

Run: `cd enviroconnect && npm run build`
Expected: Clean build, no errors.

**Step 3: Final commit with all changes**

Run `git status` to check for any unstaged changes. If everything is already committed from previous tasks, no action needed.

**Step 4: Push to GitHub**

```bash
git push origin main
```

---

### Task 10: Set up Convex deployment key on Vercel

This task is a configuration step, not code.

**Step 1: Generate a Convex deploy key**

Run: `cd enviroconnect && npx convex deploy key`

If the CLI doesn't support that, go to the Convex dashboard:
1. Open https://dashboard.convex.dev
2. Select the `enviroconnect` project
3. Go to Settings → Deploy Keys (or similar)
4. Generate a new deploy key
5. Copy the key value

**Step 2: Add the deploy key to Vercel**

1. Open https://vercel.com → enviroconnect project → Settings → Environment Variables
2. Add: `CONVEX_DEPLOY_KEY` = (the key from step 1)
3. Set it for Production + Preview environments

**Step 3: Update Vercel build command**

In Vercel project settings → General → Build & Development Settings:
- Change Build Command to: `npx convex deploy --cmd "npm run build" --yes`

**Step 4: Trigger a test deploy**

Push a small change or trigger a redeploy in Vercel dashboard. Verify the build log shows Convex deploying functions before the Next.js build runs.

**Step 5: Verify the live site**

Visit https://enviroconnect.vercel.app and confirm:
- Pages load without errors
- Vendor dashboard shows "My Proposals" section
- RFQ detail page shows file upload area for vendors
