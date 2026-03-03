"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useState } from "react";
import { PdfUpload } from "@/components/PdfUpload";
import type { UploadedFile } from "@/components/PdfUpload";
import { PdfPreviewModal } from "@/components/PdfPreviewModal";

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
  const generateUploadUrl = useMutation(api.rfqMutations.generateUploadUrl);

  const [proposalForm, setProposalForm] = useState({
    proposalText: "",
    estimatedCost: "",
    estimatedTimeline: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadFiles, setUploadFiles] = useState<UploadedFile[]>([]);
  const [previewFile, setPreviewFile] = useState<{ url: string; fileName: string } | null>(null);

  const isOwner = dbUser && rfq && rfq.facilityManagerId === dbUser._id;
  const isVendor = dbUser?.role === "vendor";

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
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6">
              <h2 className="text-lg font-semibold text-navy mb-3">Description</h2>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{rfq.description}</p>
            </div>

            {rfq.requirements && (
              <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6">
                <h2 className="text-lg font-semibold text-navy mb-3">Additional Requirements</h2>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{rfq.requirements}</p>
              </div>
            )}

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

            {isVendor && hasResponded && (
              <div className="bg-green/5 border border-green/20 rounded-xl p-6 text-center">
                <p className="text-green font-medium">You have already submitted a proposal for this RFQ.</p>
              </div>
            )}

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
      {previewFile && (
        <PdfPreviewModal
          url={previewFile.url}
          fileName={previewFile.fileName}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </main>
  );
}
