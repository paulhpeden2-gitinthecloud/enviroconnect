"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface EndorseButtonProps {
  userId: Id<"users"> | null;
  vendorProfileId: Id<"vendorProfiles">;
  isOwnProfile: boolean;
}

export function EndorseButton({
  userId,
  vendorProfileId,
  isOwnProfile,
}: EndorseButtonProps) {
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const isEndorsed = useQuery(
    api.endorsements.queries.hasEndorsed,
    userId ? { endorserId: userId, vendorProfileId } : "skip"
  );
  const toggle = useMutation(api.endorsements.mutations.toggleEndorsement);

  if (isOwnProfile) return null;

  if (!userId) {
    return (
      <p className="text-sm text-[#6E8CA0]">
        <a href="/sign-in" className="text-[#4A7C59] hover:underline font-medium">
          Sign in
        </a>{" "}
        to endorse this vendor
      </p>
    );
  }

  const handleToggle = async () => {
    if (isEndorsed) {
      // Un-endorse directly
      setLoading(true);
      try {
        await toggle({ endorserId: userId, vendorProfileId });
      } catch (err) {
        console.error("Failed to toggle endorsement:", err);
      } finally {
        setLoading(false);
      }
    } else if (!showNote) {
      // Show note input first
      setShowNote(true);
    } else {
      // Submit endorsement with optional note
      setLoading(true);
      try {
        await toggle({
          endorserId: userId,
          vendorProfileId,
          note: note.trim() || undefined,
        });
        setShowNote(false);
        setNote("");
      } catch (err) {
        console.error("Failed to toggle endorsement:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
            isEndorsed
              ? "bg-[#4A7C59] hover:bg-[#3D6649] text-white"
              : "border border-[#D5DDE5] text-[#1C3144] hover:bg-[#F0F4F8]"
          } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loading ? "..." : isEndorsed ? "✓ Endorsed" : "Endorse"}
        </button>
        {showNote && !isEndorsed && (
          <button
            onClick={() => {
              setShowNote(false);
              setNote("");
            }}
            className="text-sm text-[#6E8CA0] hover:text-[#1C3144] transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>
      {showNote && !isEndorsed && (
        <div className="flex gap-2">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 200))}
            placeholder="Add a short note (optional)"
            className="flex-1 text-sm border border-[#D5DDE5] rounded-lg px-3 py-2 bg-white text-[#0F1D2B] focus:outline-none focus:ring-2 focus:ring-[#93C5FD]"
            maxLength={200}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleToggle();
            }}
          />
          <button
            onClick={handleToggle}
            disabled={loading}
            className="px-4 py-2 bg-[#4A7C59] text-white text-sm font-medium rounded-lg hover:bg-[#3D6649] transition-colors disabled:opacity-50 cursor-pointer"
          >
            Submit
          </button>
        </div>
      )}
    </div>
  );
}
