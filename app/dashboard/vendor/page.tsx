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
  const matchedRfqs = useQuery(
    api.rfqs.getMatchedRfqs,
    profile ? { vendorProfileId: profile._id } : "skip"
  );
  const myProposals = useQuery(
    api.rfqs.getVendorResponses,
    profile ? { vendorProfileId: profile._id } : "skip"
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
    <main className="min-h-screen bg-cream">
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
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
        {profile && <ProfileForm profile={profile} userId={dbUser._id} />}

        {/* RFQ Matches Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-navy dark:text-cream">
              RFQ Matches
            </h2>
            <Link
              href="/rfq"
              className="text-sm text-navy dark:text-cream font-medium underline hover:no-underline"
            >
              Browse all RFQs
            </Link>
          </div>

          {matchedRfqs === undefined && (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-5 space-y-2"
                >
                  <div className="h-4 bg-cream-dark rounded w-2/3" />
                  <div className="h-3 bg-cream-dark rounded w-1/3" />
                </div>
              ))}
            </div>
          )}

          {matchedRfqs?.length === 0 && (
            <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-10 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                No matching RFQs right now.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                RFQs will appear here when they match your listed services.
              </p>
              <Link
                href="/rfq"
                className="text-navy dark:text-cream font-medium underline hover:no-underline text-sm"
              >
                Browse the RFQ board
              </Link>
            </div>
          )}

          {matchedRfqs && matchedRfqs.length > 0 && (
            <div className="space-y-3">
              {matchedRfqs.map((rfq) => (
                <Link
                  key={rfq._id}
                  href={`/rfq/${rfq._id}`}
                  className="block bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-semibold text-navy dark:text-cream truncate">
                          {rfq.title}
                        </h3>
                        {rfq.isInvited && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-navy/15 text-navy dark:bg-blue-900/40 dark:text-blue-200">
                            Invited
                          </span>
                        )}
                        {!rfq.isInvited && rfq.isServiceMatch && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green/15 text-green dark:text-green-300">
                            Service Match
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>{rfq.serviceArea}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span>{rfq.timeline}</span>
                        {rfq.budgetRange && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span>{rfq.budgetRange}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 line-clamp-1">
                        {rfq.description}
                      </p>
                    </div>
                    <span className="text-xs text-green font-medium shrink-0 mt-1">
                      View &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* My Proposals Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-navy dark:text-cream">
              My Proposals
            </h2>
          </div>

          {myProposals === undefined && (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6 space-y-2"
                >
                  <div className="h-4 bg-cream-dark rounded w-2/3" />
                  <div className="h-3 bg-cream-dark rounded w-1/3" />
                </div>
              ))}
            </div>
          )}

          {myProposals?.length === 0 && (
            <div className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-10 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                You haven&apos;t submitted any proposals yet.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                Browse RFQs and submit proposals to track them here.
              </p>
              <Link
                href="/rfq"
                className="text-navy dark:text-cream font-medium underline hover:no-underline text-sm"
              >
                Browse the RFQ board
              </Link>
            </div>
          )}

          {myProposals && myProposals.length > 0 && (
            <div className="space-y-3">
              {myProposals.map((proposal) => (
                <Link
                  key={proposal._id}
                  href={`/rfq/${proposal.rfqId}`}
                  className="block bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-6 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="text-sm font-semibold text-navy dark:text-cream truncate">
                          {proposal.rfq?.title ?? "Unknown RFQ"}
                        </h3>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full text-white ${
                            proposal.status === "accepted"
                              ? "bg-green"
                              : proposal.status === "declined"
                                ? "bg-red-400"
                                : "bg-navy dark:bg-white/20"
                          }`}
                        >
                          {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                        <span>{new Date(proposal.createdAt).toLocaleDateString()}</span>
                        {proposal.attachmentCount > 0 && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span>{proposal.attachmentCount} attachment{proposal.attachmentCount !== 1 ? "s" : ""}</span>
                          </>
                        )}
                        {proposal.estimatedCost && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span>{proposal.estimatedCost}</span>
                          </>
                        )}
                        {proposal.estimatedTimeline && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span>{proposal.estimatedTimeline}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1">
                        {proposal.proposalText}
                      </p>
                    </div>
                    <span className="text-xs text-green font-medium shrink-0 mt-1">
                      View &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
