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
  const [editingLink, setEditingLink] = useState(false);
  const [linkValue, setLinkValue] = useState(meeting.meetingLink ?? "");

  const acceptSlot = useMutation(api.meetings.mutations.acceptMeetingSlot);
  const updateMeetingLink = useMutation(api.meetings.mutations.updateMeetingLink);
  const counterPropose = useMutation(api.meetings.mutations.counterProposeMeeting);
  const declineMeeting = useMutation(api.meetings.mutations.declineMeeting);

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

      {/* Location detail */}
      {meeting.locationDetail && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <span className="font-medium text-navy dark:text-cream">
            {meeting.meetingType === "phone" ? "Phone:" : meeting.meetingType === "video" ? "Platform:" : "Location:"}
          </span>
          {meeting.locationDetail}
        </div>
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
            location={meeting.locationDetail}
            meetingLink={meeting.meetingLink}
          />
          {meeting.meetingType === "video" && (
            <div className="mt-2">
              {meeting.meetingLink ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Link:</span>
                  <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-green hover:underline break-all">
                    {meeting.meetingLink}
                  </a>
                  <button onClick={() => { setEditingLink(true); setLinkValue(meeting.meetingLink ?? ""); }} className="text-xs text-gray-400 hover:text-gray-600">Edit</button>
                </div>
              ) : !editingLink ? (
                <button onClick={() => setEditingLink(true)} className="text-xs font-medium text-green hover:underline">
                  + Add meeting link
                </button>
              ) : null}
              {editingLink && (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="url"
                    value={linkValue}
                    onChange={(e) => setLinkValue(e.target.value)}
                    placeholder="Paste meeting link..."
                    className="flex-1 border border-cream-dark rounded-lg px-2 py-1 text-xs bg-white dark:bg-navy dark:text-cream focus:outline-none focus:ring-2 focus:ring-green"
                  />
                  <button
                    onClick={async () => {
                      if (!linkValue.trim()) return;
                      await updateMeetingLink({ meetingRequestId: meeting._id, userId: currentUserId, meetingLink: linkValue.trim() });
                      setEditingLink(false);
                    }}
                    className="text-xs font-medium text-white bg-green px-3 py-1 rounded-lg hover:bg-green-light"
                  >
                    Save
                  </button>
                  <button onClick={() => setEditingLink(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                </div>
              )}
            </div>
          )}
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
