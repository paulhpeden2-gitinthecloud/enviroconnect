"use client";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProfileForm } from "./ProfileForm";
import { useEffect } from "react";
import Link from "next/link";
import { MeetingCard } from "@/components/meetings/MeetingCard";

export default function VendorDashboard() {
  const { user, isLoaded } = useUser();
  const dbUser = useQuery(
    api.users.queries.getUserByClerkId,
    isLoaded && user ? { clerkId: user.id } : "skip"
  );
  const profile = useQuery(
    api.vendors.queries.getVendorProfileByUserId,
    dbUser ? { userId: dbUser._id } : "skip"
  );
  const matchedRfqs = useQuery(
    api.rfq.queries.getMatchedRfqs,
    profile ? { vendorProfileId: profile._id } : "skip"
  );
  const myProposals = useQuery(
    api.rfq.queries.getVendorResponses,
    profile ? { vendorProfileId: profile._id } : "skip"
  );
  const upcomingMeetings = useQuery(
    api.meetings.queries.getUpcomingMeetings,
    dbUser ? { userId: dbUser._id } : "skip"
  );
  const pendingMeetingCount = useQuery(
    api.meetings.queries.getPendingMeetingCount,
    dbUser ? { userId: dbUser._id } : "skip"
  );
  const createProfile = useMutation(api.vendors.mutations.createVendorProfile);
  const togglePublish = useMutation(api.vendors.mutations.togglePublishProfile);

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
      <main className="min-h-screen bg-cloud">
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 animate-pulse">
          <div className="bg-surface border border-mist rounded-lg shadow-md p-6 space-y-4">
            <div className="h-5 bg-mist rounded w-1/3" />
            <div className="h-10 bg-mist rounded w-full" />
            <div className="h-10 bg-mist rounded w-full" />
            <div className="h-10 bg-mist rounded w-2/3" />
          </div>
          <div className="bg-surface border border-mist rounded-lg shadow-md p-6 space-y-4">
            <div className="h-5 bg-mist rounded w-1/4" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-5 bg-mist rounded" />
              <div className="h-5 bg-mist rounded" />
              <div className="h-5 bg-mist rounded" />
              <div className="h-5 bg-mist rounded" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cloud">
      {/* Page header — TopBar handles the page title chrome; this row holds status + actions */}
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-2 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-deep">Vendor Dashboard</h1>
          <p className="text-slate-custom text-sm mt-1">
            Manage your profile and listing
          </p>
        </div>
        {profile && (
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                profile.isPublished
                  ? "bg-accent-surface text-accent"
                  : "bg-cloud text-slate-custom border border-mist"
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
                  ? "border border-mist text-primary hover:bg-cloud"
                  : "bg-accent hover:bg-accent-hover text-white"
              }`}
            >
              {profile.isPublished ? "Unpublish" : "Publish Listing"}
            </button>
            {profile.isPublished && (
              <Link
                href={`/directory/${profile._id}`}
                target="_blank"
                className="text-sm text-slate-custom hover:text-text-deep underline"
              >
                View public profile
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
        {profile && <ProfileForm profile={profile} userId={dbUser._id} />}

        {/* RFQ Matches Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-text-deep">
              RFQ Matches
            </h2>
            <Link
              href="/rfq"
              className="text-sm text-primary font-medium underline hover:no-underline"
            >
              Browse all RFQs
            </Link>
          </div>

          {matchedRfqs === undefined && (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-surface border border-mist rounded-lg p-5 space-y-2"
                >
                  <div className="h-4 bg-mist rounded w-2/3" />
                  <div className="h-3 bg-mist rounded w-1/3" />
                </div>
              ))}
            </div>
          )}

          {matchedRfqs?.length === 0 && (
            <div className="bg-surface border border-mist rounded-lg shadow-md p-10 text-center">
              <p className="text-slate-custom mb-2">
                No matching RFQs right now.
              </p>
              <p className="text-xs text-slate-custom mb-4">
                RFQs will appear here when they match your listed services.
              </p>
              <Link
                href="/rfq"
                className="text-primary font-medium underline hover:no-underline text-sm"
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
                  className="block bg-surface border border-mist rounded-lg p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-semibold text-text-deep truncate">
                          {rfq.title}
                        </h3>
                        {rfq.isInvited && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent-surface text-accent">
                            Invited
                          </span>
                        )}
                        {!rfq.isInvited && rfq.isServiceMatch && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent-surface text-accent">
                            Service Match
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-custom">
                        <span>{rfq.serviceArea}</span>
                        <span className="w-1 h-1 rounded-full bg-mist" />
                        <span>{rfq.timeline}</span>
                        {rfq.budgetRange && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-mist" />
                            <span>{rfq.budgetRange}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-slate-custom mt-1.5 line-clamp-1">
                        {rfq.description}
                      </p>
                    </div>
                    <span className="text-xs text-accent font-medium shrink-0 mt-1">
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
            <h2 className="text-xl font-semibold text-text-deep">
              My Proposals
            </h2>
          </div>

          {myProposals === undefined && (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-surface border border-mist rounded-lg p-6 space-y-2"
                >
                  <div className="h-4 bg-mist rounded w-2/3" />
                  <div className="h-3 bg-mist rounded w-1/3" />
                </div>
              ))}
            </div>
          )}

          {myProposals?.length === 0 && (
            <div className="bg-surface border border-mist rounded-lg shadow-md p-10 text-center">
              <p className="text-slate-custom mb-2">
                You haven&apos;t submitted any proposals yet.
              </p>
              <p className="text-xs text-slate-custom mb-4">
                Browse RFQs and submit proposals to track them here.
              </p>
              <Link
                href="/rfq"
                className="text-primary font-medium underline hover:no-underline text-sm"
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
                  className="block bg-surface border border-mist rounded-lg p-6 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="text-sm font-semibold text-text-deep truncate">
                          {proposal.rfq?.title ?? "Unknown RFQ"}
                        </h3>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            proposal.status === "accepted"
                              ? "bg-accent-surface text-accent"
                              : proposal.status === "declined"
                                ? "bg-danger-surface text-danger"
                                : "bg-warning-surface text-warning"
                          }`}
                        >
                          {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-custom mb-1.5">
                        <span>{new Date(proposal.createdAt).toLocaleDateString()}</span>
                        {proposal.attachmentCount > 0 && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-mist" />
                            <span>{proposal.attachmentCount} attachment{proposal.attachmentCount !== 1 ? "s" : ""}</span>
                          </>
                        )}
                        {proposal.estimatedCost && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-mist" />
                            <span>{proposal.estimatedCost}</span>
                          </>
                        )}
                        {proposal.estimatedTimeline && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-mist" />
                            <span>{proposal.estimatedTimeline}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-slate-custom line-clamp-1">
                        {proposal.proposalText}
                      </p>
                    </div>
                    <span className="text-xs text-accent font-medium shrink-0 mt-1">
                      View &rarr;
                    </span>
                  </div>
                </Link>
              ))}
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
