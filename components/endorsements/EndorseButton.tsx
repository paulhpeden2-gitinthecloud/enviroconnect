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
      <p className="text-sm text-gray-500">
        <a href="/sign-in" className="text-green hover:underline font-medium">
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
              ? "bg-green text-white hover:bg-green-light"
              : "border-2 border-green text-green hover:bg-green/5"
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
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
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
            className="flex-1 text-sm border border-cream-dark rounded-lg px-3 py-2 bg-white dark:bg-navy dark:border-navy-light dark:text-white focus:outline-none focus:ring-2 focus:ring-green/30"
            maxLength={200}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleToggle();
            }}
          />
          <button
            onClick={handleToggle}
            disabled={loading}
            className="px-4 py-2 bg-green text-white text-sm font-medium rounded-lg hover:bg-green-light transition-colors disabled:opacity-50 cursor-pointer"
          >
            Submit
          </button>
        </div>
      )}
    </div>
  );
}
