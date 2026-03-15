"use client";
import { useState } from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { RfqCard } from "@/components/rfq/RfqCard";
import { SkeletonRfq } from "@/components/rfq/SkeletonRfq";
import { SERVICE_TYPES, SERVICE_AREAS, TIMELINE_OPTIONS } from "@/lib/constants";
import Link from "next/link";

export default function RfqBoardClient() {
  const { user, isLoaded } = useUser();
  const dbUser = useQuery(
    api.users.queries.getUserByClerkId,
    isLoaded && user ? { clerkId: user.id } : "skip"
  );

  const [search, setSearch] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [region, setRegion] = useState("");
  const [timeline, setTimeline] = useState("");
  const [page, setPage] = useState(1);

  const result = useQuery(api.rfq.queries.getRfqs, {
    search: search || undefined,
    serviceType: serviceType || undefined,
    region: region || undefined,
    timeline: timeline || undefined,
    page,
  });

  const totalPages = result ? Math.ceil(result.total / result.pageSize) : 1;
  const hasFilters = search || serviceType || region || timeline;

  return (
    <main className="min-h-screen bg-cloud">
      <div className="bg-primary text-white py-8 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">RFQ Board</h1>
            <p className="text-white/70 text-sm mt-1">
              Browse open requests for quotes from facility managers
            </p>
          </div>
          {dbUser?.role === "facility_manager" && (
            <Link
              href="/rfq/new"
              className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Post an RFQ
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            placeholder="Search RFQs..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 min-w-[200px] bg-surface border border-mist rounded-md px-3 py-2 text-sm text-text-deep placeholder:text-slate-custom focus:outline-none focus:border-primary-light focus:ring-2 focus:ring-focus-ring/40"
          />
          <select
            value={serviceType}
            onChange={(e) => { setServiceType(e.target.value); setPage(1); }}
            className="bg-surface border border-mist rounded-md px-3 py-2 text-sm text-text-deep focus:outline-none focus:border-primary-light focus:ring-2 focus:ring-focus-ring/40"
          >
            <option value="">All Services</option>
            {SERVICE_TYPES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={region}
            onChange={(e) => { setRegion(e.target.value); setPage(1); }}
            className="bg-surface border border-mist rounded-md px-3 py-2 text-sm text-text-deep focus:outline-none focus:border-primary-light focus:ring-2 focus:ring-focus-ring/40"
          >
            <option value="">All Regions</option>
            {SERVICE_AREAS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select
            value={timeline}
            onChange={(e) => { setTimeline(e.target.value); setPage(1); }}
            className="bg-surface border border-mist rounded-md px-3 py-2 text-sm text-text-deep focus:outline-none focus:border-primary-light focus:ring-2 focus:ring-focus-ring/40"
          >
            <option value="">All Timelines</option>
            {TIMELINE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setServiceType(""); setRegion(""); setTimeline(""); setPage(1); }}
              className="text-sm text-primary-light hover:underline font-medium"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Results */}
        {result === undefined && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonRfq key={i} />
            ))}
          </div>
        )}

        {result && result.rfqs.length === 0 && (
          <div className="bg-surface border border-mist rounded-lg p-10 text-center shadow-md">
            <p className="text-slate-custom mb-2">No open RFQs found.</p>
            {hasFilters && (
              <p className="text-sm text-slate-custom/70">Try adjusting your filters.</p>
            )}
          </div>
        )}

        {result && result.rfqs.length > 0 && (
          <>
            <p className="text-sm text-slate-custom mb-4">{result.total} open RFQ{result.total !== 1 ? "s" : ""}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {result.rfqs.map((rfq) => (
                <RfqCard key={rfq._id} rfq={rfq} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="text-sm text-primary-light font-medium disabled:opacity-40 hover:underline"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-custom">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="text-sm text-primary-light font-medium disabled:opacity-40 hover:underline"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
