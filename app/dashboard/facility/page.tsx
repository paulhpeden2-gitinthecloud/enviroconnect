"use client";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { VendorCard } from "@/components/VendorCard";
import Link from "next/link";

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

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-navy text-white py-8 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Facility Manager Dashboard</h1>
            <p className="text-gray-300 text-sm mt-1">
              Your saved vendors and browsing tools
            </p>
          </div>
          <Link
            href="/directory"
            className="bg-green hover:bg-green-light text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Browse Directory
          </Link>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-xl font-semibold text-navy mb-6">Saved Vendors</h2>
        {savedVendors === undefined && (
          <p className="text-gray-500">Loading…</p>
        )}
        {savedVendors?.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
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
            {savedVendors.map((p) => p && <VendorCard key={p._id} profile={p} />)}
          </div>
        )}
      </div>
    </main>
  );
}
