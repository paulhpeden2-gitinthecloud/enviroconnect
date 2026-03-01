"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { VendorCard } from "@/components/VendorCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { SERVICE_TYPES, SERVICE_AREAS, CERTIFICATIONS } from "@/lib/constants";

export function DirectoryClient() {
  const [search, setSearch] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [region, setRegion] = useState("");
  const [certification, setCertification] = useState("");
  const [page, setPage] = useState(1);

  const result = useQuery(api.vendors.getVendorProfiles, {
    search: search || undefined,
    serviceType: serviceType || undefined,
    region: region || undefined,
    certification: certification || undefined,
    page,
  });

  const totalPages = result ? Math.ceil(result.total / result.pageSize) : 1;

  const resetFilters = () => {
    setSearch("");
    setServiceType("");
    setRegion("");
    setCertification("");
    setPage(1);
  };

  const hasFilters = search || serviceType || region || certification;

  return (
    <div>
      <div className="bg-cream border-b border-cream-dark py-4 px-4 mb-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search by company or keyword…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1 min-w-48 border border-cream-dark rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
          <select
            value={serviceType}
            onChange={(e) => {
              setServiceType(e.target.value);
              setPage(1);
            }}
            className="border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          >
            <option value="">All Services</option>
            {(SERVICE_TYPES as unknown as string[]).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={region}
            onChange={(e) => {
              setRegion(e.target.value);
              setPage(1);
            }}
            className="border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          >
            <option value="">All Regions</option>
            {(SERVICE_AREAS as unknown as string[]).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select
            value={certification}
            onChange={(e) => {
              setCertification(e.target.value);
              setPage(1);
            }}
            className="border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          >
            <option value="">All Certifications</option>
            {(CERTIFICATIONS as unknown as string[]).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="text-sm text-gray-500 hover:text-navy underline whitespace-nowrap"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        {result === undefined && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}
        {result?.profiles.length === 0 && (
          <div className="text-center text-gray-500 py-20">
            No vendors found. Try adjusting your filters.
          </div>
        )}
        {result && result.profiles.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {result.total} vendor{result.total !== 1 ? "s" : ""} found
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {result.profiles.map((p) => (
                <VendorCard key={p._id} profile={p} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm border border-cream-dark rounded-lg disabled:opacity-40 hover:bg-cream"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm border border-cream-dark rounded-lg disabled:opacity-40 hover:bg-cream"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
