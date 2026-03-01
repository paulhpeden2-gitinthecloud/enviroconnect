"use client";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProfileForm } from "./ProfileForm";
import { useEffect } from "react";
import Link from "next/link";

export default function VendorDashboard() {
  const { user, isLoaded } = useUser();
  const dbUser = useQuery(
    api.users.getUserByClerkId,
    isLoaded && user ? { clerkId: user.id } : "skip"
  );
  const profile = useQuery(
    api.vendors.getVendorProfileByUserId,
    dbUser ? { userId: dbUser._id } : "skip"
  );
  const createProfile = useMutation(api.mutations.createVendorProfile);
  const togglePublish = useMutation(api.mutations.togglePublishProfile);

  useEffect(() => {
    if (dbUser && profile === null) {
      createProfile({
        userId: dbUser._id,
        companyName: dbUser.company,
        email: dbUser.email,
        city: "",
        state: "WA",
      });
    }
  }, [dbUser, profile, createProfile]);

  if (!dbUser || profile === undefined) {
    return (
      <main className="min-h-screen bg-cream">
        <div className="bg-navy text-white py-8 px-4">
          <div className="max-w-4xl mx-auto animate-pulse">
            <div className="h-7 bg-white/20 rounded w-48 mb-2" />
            <div className="h-4 bg-white/20 rounded w-64" />
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 animate-pulse">
          <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6 space-y-4">
            <div className="h-5 bg-cream-dark rounded w-1/3" />
            <div className="h-10 bg-cream-dark rounded w-full" />
            <div className="h-10 bg-cream-dark rounded w-full" />
            <div className="h-10 bg-cream-dark rounded w-2/3" />
          </div>
          <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6 space-y-4">
            <div className="h-5 bg-cream-dark rounded w-1/4" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-5 bg-cream-dark rounded" />
              <div className="h-5 bg-cream-dark rounded" />
              <div className="h-5 bg-cream-dark rounded" />
              <div className="h-5 bg-cream-dark rounded" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-navy text-white py-8 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
            <p className="text-gray-300 text-sm mt-1">
              Manage your profile and listing
            </p>
          </div>
          {profile && (
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  profile.isPublished
                    ? "bg-green/20 text-green-200"
                    : "bg-white/10 text-gray-300"
                }`}
              >
                {profile.isPublished ? "Published" : "Draft"}
              </span>
              <button
                onClick={() =>
                  togglePublish({ id: profile._id, userId: dbUser._id })
                }
                className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                  profile.isPublished
                    ? "bg-white/10 hover:bg-white/20 text-white"
                    : "bg-green hover:bg-green-light text-white"
                }`}
              >
                {profile.isPublished ? "Unpublish" : "Publish Listing"}
              </button>
              {profile.isPublished && (
                <Link
                  href={`/directory/${profile._id}`}
                  target="_blank"
                  className="text-sm text-gray-300 hover:text-white underline"
                >
                  View public profile
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-10">
        {profile && <ProfileForm profile={profile} userId={dbUser._id} />}
      </div>
    </main>
  );
}
