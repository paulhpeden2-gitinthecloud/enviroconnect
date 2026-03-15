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

const VIDEO_PLATFORMS = ["Microsoft Teams", "Zoom", "Google Meet"] as const;

const inputClass =
  "w-full bg-surface border border-mist rounded-md px-3 py-2 text-sm text-deep placeholder:text-slate-custom focus:outline-none focus:border-primary focus:ring-2 focus:ring-focus-ring/40";

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
  const [locationDetail, setLocationDetail] = useState("");
  const [slots, setSlots] = useState<TimeSlot[]>([
    { date: 0, startTime: "09:00", endTime: "10:00" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const createMeeting = useMutation(api.meetings.mutations.createMeetingRequest);

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
    if (!locationDetail.trim()) {
      setError(
        meetingType === "phone" ? "Phone number is required" :
        meetingType === "video" ? "Please select a video platform" :
        "Location is required"
      );
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
        locationDetail: locationDetail.trim(),
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
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-surface border border-mist rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-mist">
          <h2 className="text-lg font-semibold text-deep">
            Schedule Meeting
          </h2>
          <button
            onClick={onClose}
            className="text-slate-custom hover:text-primary transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <p className="text-sm text-slate-custom">
            Request a meeting with <span className="font-medium text-deep">{recipientName}</span>
          </p>

          <div>
            <label className="block text-sm font-medium text-deep mb-1">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Discuss stormwater compliance"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-deep mb-2">Meeting Type</label>
            <div className="flex gap-3">
              {(["phone", "video", "in_person"] as const).map((type) => (
                <label key={type} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="meetingType"
                    value={type}
                    checked={meetingType === type}
                    onChange={() => { setMeetingType(type); setLocationDetail(""); }}
                    className="accent-accent"
                  />
                  <span className="text-sm text-slate-custom">
                    {type === "phone" ? "Phone" : type === "video" ? "Video" : "In Person"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {meetingType === "phone" && (
            <div>
              <label className="block text-sm font-medium text-deep mb-1">Phone Number *</label>
              <input
                type="tel"
                value={locationDetail}
                onChange={(e) => setLocationDetail(e.target.value)}
                placeholder="e.g., (206) 555-0123"
                className={inputClass}
              />
            </div>
          )}

          {meetingType === "video" && (
            <div>
              <label className="block text-sm font-medium text-deep mb-1">Video Platform *</label>
              <select
                value={locationDetail}
                onChange={(e) => setLocationDetail(e.target.value)}
                className={inputClass}
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
              <label className="block text-sm font-medium text-deep mb-1">Location / Address *</label>
              <input
                type="text"
                value={locationDetail}
                onChange={(e) => setLocationDetail(e.target.value)}
                placeholder="e.g., 123 Main St, Seattle, WA"
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-deep mb-2">
              Proposed Times (up to 3) *
            </label>
            <TimeSlotPicker slots={slots} onChange={setSlots} />
          </div>

          <div>
            <label className="block text-sm font-medium text-deep mb-1">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Any additional context..."
              className={`${inputClass} resize-none`}
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-custom hover:bg-cloud rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? "Sending..." : "Send Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
