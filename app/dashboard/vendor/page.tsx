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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        Loading…
      </div>
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
