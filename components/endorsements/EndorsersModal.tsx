"use client";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface EndorsersModalProps {
  vendorProfileId: Id<"vendorProfiles">;
  initialTab?: "peer" | "client";
  onClose: () => void;
}

export function EndorsersModal({
  vendorProfileId,
  initialTab = "peer",
  onClose,
}: EndorsersModalProps) {
  const [tab, setTab] = useState<"peer" | "client">(initialTab);
  const endorsers = useQuery(api.endorsements.queries.getEndorsers, {
    vendorProfileId,
    type: tab,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-navy-light rounded-xl shadow-xl w-full max-w-md max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cream-dark">
          <h3
            className="text-lg font-semibold text-navy dark:text-white"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Endorsements
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-cream-dark">
          <button
            onClick={() => setTab("peer")}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
              tab === "peer"
                ? "text-green border-b-2 border-green"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Peer Endorsements
          </button>
          <button
            onClick={() => setTab("client")}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
              tab === "client"
                ? "text-green border-b-2 border-green"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Client Endorsements
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {endorsers === undefined && (
            <p className="text-sm text-gray-500 text-center py-4">Loading...</p>
          )}
          {endorsers?.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No {tab} endorsements yet
            </p>
          )}
          {endorsers?.map((e) => (
            <div key={e._id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green/10 flex items-center justify-center text-green text-sm font-semibold shrink-0">
                  {e.endorserName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-navy dark:text-white">
                    {e.endorserName}
                  </p>
                  {e.endorserCompany && (
                    <p className="text-xs text-gray-500">{e.endorserCompany}</p>
                  )}
                </div>
              </div>
              {e.note && (
                <p className="text-sm text-gray-600 dark:text-gray-400 italic ml-10">
                  &ldquo;{e.note}&rdquo;
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
