"use client";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MeetingCard } from "@/components/meetings/MeetingCard";

type Tab = "action" | "upcoming" | "past";

export function MeetingsClient() {
  const { user, isLoaded } = useUser();
  const dbUser = useQuery(
    api.users.queries.getUserByClerkId,
    isLoaded && user ? { clerkId: user.id } : "skip"
  );
  const meetings = useQuery(
    api.meetings.queries.getMyMeetings,
    dbUser ? { userId: dbUser._id } : "skip"
  );
  const [tab, setTab] = useState<Tab>("action");

  if (!isLoaded || !dbUser) {
    return (
      <div className="space-y-4 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6 space-y-2">
            <div className="h-4 bg-cream-dark rounded w-2/3" />
            <div className="h-3 bg-cream-dark rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  const now = Date.now();
  const actionNeeded = meetings?.filter((m) => {
    const isPendingForMe = m.status === "pending" && m.recipientId === dbUser._id;
    const isCounterForMe = m.status === "counterproposed" && m.requesterId === dbUser._id;
    return isPendingForMe || isCounterForMe;
  }) ?? [];

  const upcoming = meetings?.filter(
    (m) => m.status === "confirmed" && m.confirmedSlot && m.confirmedSlot.date >= now
  ).sort((a, b) => a.confirmedSlot!.date - b.confirmedSlot!.date) ?? [];

  const past = meetings?.filter((m) => {
    if (m.status === "declined" || m.status === "expired") return true;
    if (m.status === "confirmed" && m.confirmedSlot && m.confirmedSlot.date < now) return true;
    return false;
  }) ?? [];

  const waiting = meetings?.filter((m) => {
    const isPendingFromMe = m.status === "pending" && m.requesterId === dbUser._id;
    const isCounterFromMe = m.status === "counterproposed" && m.recipientId === dbUser._id;
    return isPendingFromMe || isCounterFromMe;
  }) ?? [];

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "action", label: "Action Needed", count: actionNeeded.length },
    { key: "upcoming", label: "Upcoming", count: upcoming.length },
    { key: "past", label: "Past", count: past.length },
  ];

  const currentList = tab === "action" ? [...actionNeeded, ...waiting]
    : tab === "upcoming" ? upcoming
    : past;

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-cream-dark/50 dark:bg-navy/50 rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 text-sm font-medium py-2 px-3 rounded-md transition-colors ${
              tab === t.key
                ? "bg-white dark:bg-navy-light text-navy dark:text-cream shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-navy dark:hover:text-cream"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded-full ${
                t.key === "action" && t.count > 0
                  ? "bg-red-500 text-white"
                  : "bg-cream-dark dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Meeting list */}
      {meetings === undefined ? (
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6 space-y-2">
              <div className="h-4 bg-cream-dark rounded w-2/3" />
              <div className="h-3 bg-cream-dark rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : currentList.length === 0 ? (
        <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-10 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {tab === "action"
              ? "No meetings need your attention right now."
              : tab === "upcoming"
                ? "No upcoming meetings."
                : "No past meetings."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tab === "action" && actionNeeded.length > 0 && waiting.length > 0 && (
            <>
              {actionNeeded.map((m) => (
                <MeetingCard key={m._id} meeting={m} currentUserId={dbUser._id} />
              ))}
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide pt-2">Waiting on response</p>
              {waiting.map((m) => (
                <MeetingCard key={m._id} meeting={m} currentUserId={dbUser._id} />
              ))}
            </>
          )}
          {tab === "action" && (actionNeeded.length === 0 || waiting.length === 0) && (
            currentList.map((m) => (
              <MeetingCard key={m._id} meeting={m} currentUserId={dbUser._id} />
            ))
          )}
          {tab !== "action" && currentList.map((m) => (
            <MeetingCard key={m._id} meeting={m} currentUserId={dbUser._id} />
          ))}
        </div>
      )}
    </div>
  );
}
