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
