"use client";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { VendorCard } from "@/components/VendorCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import Link from "next/link";

function StatusBadge({ status }: { status: "open" | "closed" | "awarded" }) {
  const styles = {
    open: "bg-green/15 text-green dark:text-green-300",
    closed: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
    awarded: "bg-navy/15 text-navy dark:bg-navy-light/30 dark:text-blue-200",
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
    api.users.getUserByClerkId,
    isLoaded && user ? { clerkId: user.id } : "skip"
  );
  const savedVendors = useQuery(
    api.vendors.getSavedVendors,
    dbUser ? { facilityManagerId: dbUser._id } : "skip"
  );
  const myRfqs = useQuery(
    api.rfqs.getMyRfqs,
    dbUser ? { facilityManagerId: dbUser._id } : "skip"
  );

  return (
    <main className="min-h-screen bg-cream">
      <div className="bg-navy text-white py-8 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Facility Manager Dashboard</h1>
            <p className="text-gray-300 text-sm mt-1">
              Your RFQs, saved vendors, and browsing tools
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/rfq/new"
              className="bg-white text-navy text-sm font-medium px-4 py-2 rounded-lg hover:bg-cream transition-colors"
            >
              Post an RFQ
            </Link>
            <Link
              href="/directory"
              className="bg-green hover:bg-green-light text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Browse Directory
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
        {/* My RFQs Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-navy dark:text-cream">
              My RFQs
            </h2>
            <Link
              href="/rfq/new"
              className="text-sm text-navy dark:text-cream font-medium underline hover:no-underline"
            >
              Post new RFQ
            </Link>
          </div>

          {myRfqs === undefined && (
            <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6 animate-pulse space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-4 bg-cream-dark rounded w-1/3" />
                  <div className="h-4 bg-cream-dark rounded w-16" />
                  <div className="h-4 bg-cream-dark rounded w-24 ml-auto" />
                </div>
              ))}
            </div>
          )}

          {myRfqs?.length === 0 && (
            <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-10 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                You haven&apos;t posted any RFQs yet.
              </p>
              <Link
                href="/rfq/new"
                className="text-navy dark:text-cream font-medium underline hover:no-underline"
              >
                Post your first RFQ
              </Link>
            </div>
          )}

          {myRfqs && myRfqs.length > 0 && (
            <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark overflow-hidden">
              {/* Table header */}
              <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 bg-cream dark:bg-navy text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-cream-dark">
                <span>Title</span>
                <span className="w-20 text-center">Status</span>
                <span className="w-24 text-center">Responses</span>
                <span className="w-20 text-right">Action</span>
              </div>
              {/* Rows */}
              {myRfqs.map((rfq) => (
                <div
                  key={rfq._id}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 sm:gap-4 px-5 py-4 border-b border-cream-dark last:border-b-0 hover:bg-cream/50 dark:hover:bg-navy/30 transition-colors items-center"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/rfq/${rfq._id}`}
                      className="text-sm font-medium text-navy dark:text-cream hover:underline truncate block"
                    >
                      {rfq.title}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5 sm:hidden">
                      {rfq.responseCount}{" "}
                      {rfq.responseCount === 1 ? "response" : "responses"}
                    </p>
                  </div>
                  <div className="w-20 flex justify-center">
                    <StatusBadge status={rfq.status} />
                  </div>
                  <div className="hidden sm:flex w-24 justify-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {rfq.responseCount}{" "}
                      {rfq.responseCount === 1 ? "response" : "responses"}
                    </span>
                  </div>
                  <div className="w-20 text-right">
                    <Link
                      href={`/rfq/${rfq._id}`}
                      className="text-xs text-green hover:underline font-medium"
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
          <h2 className="text-xl font-semibold text-navy dark:text-cream mb-6">
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
            <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-10 text-center">
              <p className="text-gray-500 mb-4">
                You haven&apos;t saved any vendors yet.
              </p>
              <Link
                href="/directory"
                className="text-navy font-medium underline hover:no-underline"
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
      </div>
    </main>
  );
}
