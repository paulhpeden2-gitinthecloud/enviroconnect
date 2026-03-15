"use client";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { VendorCard } from "@/components/vendor/VendorCard";
import { SkeletonCard } from "@/components/shared/SkeletonCard";
import Link from "next/link";
import { MeetingCard } from "@/components/meetings/MeetingCard";

function StatusBadge({ status }: { status: "open" | "closed" | "awarded" }) {
  const styles = {
    open: "bg-accent-surface text-accent",
    closed: "bg-cloud text-slate-custom border border-mist",
    awarded: "bg-warning-surface text-warning",
  };
  const labels = { open: "Open", closed: "Closed", awarded: "Awarded" };
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export default function FacilityDashboard() {
  const { user, isLoaded } = useUser();
  const dbUser = useQuery(
    api.users.queries.getUserByClerkId,
    isLoaded && user ? { clerkId: user.id } : "skip"
  );
  const savedVendors = useQuery(
    api.vendors.queries.getSavedVendors,
    dbUser ? { facilityManagerId: dbUser._id } : "skip"
  );
  const myRfqs = useQuery(
    api.rfq.queries.getMyRfqs,
    dbUser ? { facilityManagerId: dbUser._id } : "skip"
  );
  const upcomingMeetings = useQuery(
    api.meetings.queries.getUpcomingMeetings,
    dbUser ? { userId: dbUser._id } : "skip"
  );
  const pendingMeetingCount = useQuery(
    api.meetings.queries.getPendingMeetingCount,
    dbUser ? { userId: dbUser._id } : "skip"
  );

  return (
    <main className="min-h-screen bg-cloud">
      {/* Page header — TopBar handles the page title chrome; this row holds the quick actions */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-2 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-deep">Facility Manager Dashboard</h1>
          <p className="text-slate-custom text-sm mt-1">
            Your RFQs, saved vendors, and browsing tools
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/rfq/new"
            className="border border-mist text-primary text-sm font-medium px-4 py-2 rounded-lg hover:bg-cloud transition-colors"
          >
            Post an RFQ
          </Link>
          <Link
            href="/directory"
            className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Browse Directory
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* My RFQs Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-text-deep">
              My RFQs
            </h2>
            <Link
              href="/rfq/new"
              className="text-sm text-primary font-medium underline hover:no-underline"
            >
              Post new RFQ
            </Link>
          </div>

          {myRfqs === undefined && (
            <div className="bg-surface border border-mist rounded-lg p-6 animate-pulse space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-4 bg-mist rounded w-1/3" />
                  <div className="h-4 bg-mist rounded w-16" />
                  <div className="h-4 bg-mist rounded w-24 ml-auto" />
                </div>
              ))}
            </div>
          )}

          {myRfqs?.length === 0 && (
            <div className="bg-surface border border-mist rounded-lg shadow-md p-10 text-center">
              <p className="text-slate-custom mb-4">
                You haven&apos;t posted any RFQs yet.
              </p>
              <Link
                href="/rfq/new"
                className="text-primary font-medium underline hover:no-underline"
              >
                Post your first RFQ
              </Link>
            </div>
          )}

          {myRfqs && myRfqs.length > 0 && (
            <div className="bg-surface border border-mist rounded-lg shadow-md overflow-hidden">
              {/* Table header */}
              <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 bg-cloud text-xs font-medium text-slate-custom uppercase tracking-wide border-b border-mist">
                <span>Title</span>
                <span className="w-20 text-center">Status</span>
                <span className="w-24 text-center">Responses</span>
                <span className="w-20 text-right">Action</span>
              </div>
              {/* Rows */}
              {myRfqs.map((rfq) => (
                <div
                  key={rfq._id}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 sm:gap-4 px-5 py-4 border-b border-mist last:border-b-0 hover:bg-cloud/60 transition-colors items-center"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/rfq/${rfq._id}`}
                      className="text-sm font-medium text-text-deep hover:underline truncate block"
                    >
                      {rfq.title}
                    </Link>
                    <p className="text-xs text-slate-custom mt-0.5 sm:hidden">
                      {rfq.responseCount}{" "}
                      {rfq.responseCount === 1 ? "response" : "responses"}
                    </p>
                  </div>
                  <div className="w-20 flex justify-center">
                    <StatusBadge status={rfq.status} />
                  </div>
                  <div className="hidden sm:flex w-24 justify-center">
                    <span className="text-sm text-slate-custom">
                      {rfq.responseCount}{" "}
                      {rfq.responseCount === 1 ? "response" : "responses"}
                    </span>
                  </div>
                  <div className="w-20 text-right">
                    <Link
                      href={`/rfq/${rfq._id}`}
                      className="text-xs text-accent hover:underline font-medium"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Saved Vendors Section */}
        <section>
          <h2 className="text-xl font-semibold text-text-deep mb-6">
            Saved Vendors
          </h2>
          {savedVendors === undefined && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}
          {savedVendors?.length === 0 && (
            <div className="bg-surface border border-mist rounded-lg shadow-md p-10 text-center">
              <p className="text-slate-custom mb-4">
                You haven&apos;t saved any vendors yet.
              </p>
              <Link
                href="/directory"
                className="text-primary font-medium underline hover:no-underline"
              >
                Browse the directory
              </Link>
            </div>
          )}
          {savedVendors && savedVendors.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedVendors.map(
                (p) => p && <VendorCard key={p._id} profile={p} />
              )}
            </div>
          )}
        </section>

        {/* Upcoming Meetings Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-text-deep">
                Meetings
              </h2>
              {(pendingMeetingCount ?? 0) > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-warning-surface text-warning">
                  {pendingMeetingCount} pending
                </span>
              )}
            </div>
            <Link
              href="/meetings"
              className="text-sm text-primary font-medium underline hover:no-underline"
            >
              View all meetings
            </Link>
          </div>

          {upcomingMeetings === undefined && (
            <div className="space-y-3 animate-pulse">
              <div className="bg-surface border border-mist rounded-lg p-5 space-y-2">
                <div className="h-4 bg-mist rounded w-2/3" />
                <div className="h-3 bg-mist rounded w-1/3" />
              </div>
            </div>
          )}

          {upcomingMeetings?.length === 0 && (
            <div className="bg-surface border border-mist rounded-lg shadow-md p-10 text-center">
              <p className="text-slate-custom mb-2">
                No upcoming meetings.
              </p>
              <Link
                href="/meetings"
                className="text-primary font-medium underline hover:no-underline text-sm"
              >
                View all meetings
              </Link>
            </div>
          )}

          {upcomingMeetings && upcomingMeetings.length > 0 && (
            <div className="space-y-3">
              {upcomingMeetings.slice(0, 3).map((m) => (
                <MeetingCard key={m._id} meeting={m} currentUserId={dbUser!._id} />
              ))}
              {upcomingMeetings.length > 3 && (
                <Link
                  href="/meetings"
                  className="block text-center text-sm text-accent hover:underline font-medium py-2"
                >
                  View {upcomingMeetings.length - 3} more →
                </Link>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
