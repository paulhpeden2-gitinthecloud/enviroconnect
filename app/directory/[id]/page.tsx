"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import { SkeletonProfile } from "@/components/shared/SkeletonProfile";
import { EndorseButton } from "@/components/endorsements/EndorseButton";
import { EndorsementBadge } from "@/components/endorsements/EndorsementBadge";
import { EndorsersModal } from "@/components/endorsements/EndorsersModal";
import { MeetingRequestModal } from "@/components/meetings/MeetingRequestModal";
import { ReviewModal } from "@/components/reviews/ReviewModal";
import { StarRatingDisplay } from "@/components/reviews/StarRating";

export default function VendorProfilePage() {
  const params = useParams();
  const { user, isLoaded } = useUser();

  const profile = useQuery(api.vendors.queries.getVendorProfile, {
    id: params.id as Id<"vendorProfiles">,
  });
  const dbUser = useQuery(
    api.users.queries.getUserByClerkId,
    isLoaded && user ? { clerkId: user.id } : "skip"
  );
  const isSaved = useQuery(
    api.vendors.queries.isVendorSaved,
    dbUser && profile
      ? { facilityManagerId: dbUser._id, vendorProfileId: profile._id }
      : "skip"
  );
  const saveVendor = useMutation(api.vendors.mutations.saveVendor);
  const unsaveVendor = useMutation(api.vendors.mutations.unsaveVendor);
  const endorsementCounts = useQuery(api.endorsements.queries.getEndorsementCounts, {
    vendorProfileId: params.id as Id<"vendorProfiles">,
  });
  const [showEndorsersModal, setShowEndorsersModal] = useState(false);
  const [endorsersModalTab, setEndorsersModalTab] = useState<"peer" | "client">("peer");
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const ratingSummary = useQuery(api.reviews.queries.getVendorRatingSummary, profile ? { vendorId: profile.userId } : "skip");
  const vendorReviews = useQuery(api.reviews.queries.getVendorReviews, profile ? { vendorId: profile.userId } : "skip");

  if (profile === undefined)
    return (
      <main className="min-h-screen bg-cream">
        <div className="bg-navy text-white py-10 px-4">
          <div className="max-w-4xl mx-auto animate-pulse">
            <div className="h-4 bg-white/20 rounded w-32 mb-4" />
            <div className="h-8 bg-white/20 rounded w-2/3" />
            <div className="h-4 bg-white/20 rounded w-1/4 mt-2" />
          </div>
        </div>
        <SkeletonProfile />
      </main>
    );

  if (!profile || !profile.isPublished) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-lg mb-4">Vendor not found.</p>
        <Link href="/directory" className="text-navy underline">
          Back to directory
        </Link>
      </div>
    );
  }

  const handleSaveToggle = () => {
    if (!dbUser) return;
    if (isSaved)
      unsaveVendor({ facilityManagerId: dbUser._id, vendorProfileId: profile._id });
    else
      saveVendor({ facilityManagerId: dbUser._id, vendorProfileId: profile._id });
  };

  return (
    <main className="min-h-screen bg-cream">
      <div className="bg-navy text-white py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/directory"
            className="text-sm text-gray-300 hover:text-white mb-4 inline-block"
          >
            ← Back to Directory
          </Link>
          <h1 className="text-3xl font-bold">{profile.companyName}</h1>
          <p className="text-gray-300 mt-1">
            {profile.city}, {profile.state}
          </p>
          {endorsementCounts && (
            <div className="mt-2">
              <EndorsementBadge
                peerCount={endorsementCounts.peerCount}
                clientCount={endorsementCounts.clientCount}
                size="md"
                onPeerClick={() => { setEndorsersModalTab("peer"); setShowEndorsersModal(true); }}
                onClientClick={() => { setEndorsersModalTab("client"); setShowEndorsersModal(true); }}
              />
            </div>
          )}
          {ratingSummary && (
            <div className="flex items-center gap-2 mt-2">
              <StarRatingDisplay value={ratingSummary.overall} size="md" />
              <span className="text-gray-300 text-sm">{ratingSummary.overall.toFixed(1)} ({ratingSummary.count} {ratingSummary.count === 1 ? "review" : "reviews"})</span>
            </div>
          )}
          <div className="mt-3 flex items-center gap-3">
            <EndorseButton
              userId={dbUser?._id ?? null}
              vendorProfileId={params.id as Id<"vendorProfiles">}
              isOwnProfile={dbUser?._id === profile?.userId}
            />
            {dbUser && dbUser._id !== profile?.userId && (
              <>
                <Link
                  href="/messages"
                  className="inline-flex items-center gap-2 px-4 py-2 border-2 border-navy dark:border-white text-navy dark:text-white text-sm font-medium rounded-lg hover:bg-navy hover:text-white dark:hover:bg-white dark:hover:text-navy transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                  </svg>
                  Message
                </Link>
                <button
                  onClick={() => setShowMeetingModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 border-2 border-green text-green text-sm font-medium rounded-lg hover:bg-green hover:text-white transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  Schedule Meeting
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {profile.description && (
            <section>
              <h2 className="text-xl font-semibold text-navy mb-3">About</h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {profile.description}
              </p>
            </section>
          )}
          {profile.services.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-navy mb-3">Services</h2>
              <div className="flex flex-wrap gap-2">
                {profile.services.map((s) => (
                  <span
                    key={s}
                    className="bg-green/10 text-green text-sm font-medium px-3 py-1.5 rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}
          {profile.certifications.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-navy mb-3">
                Certifications
              </h2>
              <ul className="space-y-1">
                {profile.certifications.map((c) => (
                  <li
                    key={c}
                    className="text-gray-700 text-sm flex items-center gap-2"
                  >
                    <span className="text-green">✓</span> {c}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {profile.serviceArea.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-navy mb-3">
                Service Areas
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.serviceArea.map((a) => (
                  <span
                    key={a}
                    className="bg-cream-dark/50 text-gray-700 text-sm px-3 py-1.5 rounded-full"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </section>
          )}
          {vendorReviews && vendorReviews.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-navy">Reviews</h2>
                {ratingSummary && (
                  <div className="flex items-center gap-2">
                    <StarRatingDisplay value={ratingSummary.overall} />
                    <span className="text-sm text-gray-500">{ratingSummary.overall.toFixed(1)} avg</span>
                  </div>
                )}
              </div>
              {ratingSummary && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                  {[
                    { label: "Quality", value: ratingSummary.categories.qualityOfWork },
                    { label: "Communication", value: ratingSummary.categories.communication },
                    { label: "Timeliness", value: ratingSummary.categories.timeliness },
                    { label: "Compliance", value: ratingSummary.categories.complianceKnowledge },
                    { label: "Value", value: ratingSummary.categories.value },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center bg-white dark:bg-navy-light rounded-lg p-3 border border-cream-dark">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
                      <p className="text-lg font-semibold text-navy dark:text-cream">{value.toFixed(1)}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-4">
                {vendorReviews.map((review) => (
                  <div key={review._id} className="bg-white dark:bg-navy-light rounded-xl border border-cream-dark p-5 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-navy dark:text-cream">{review.reviewerCompany}</p>
                        <p className="text-xs text-gray-500">{review.serviceType}</p>
                      </div>
                      <div className="text-right">
                        <StarRatingDisplay value={review.overallRating} />
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {review.rfqId ? (
                      <p className="text-xs text-gray-400">Via RFQ engagement</p>
                    ) : review.projectName ? (
                      <p className="text-xs text-gray-400">Project: {review.projectName}</p>
                    ) : null}
                    {review.serviceCompletedDate && (
                      <p className="text-xs text-gray-400">Service completed: {new Date(review.serviceCompletedDate).toLocaleDateString()}</p>
                    )}
                    {review.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">{review.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          {dbUser?.role === "facility_manager" ? (
            <button
              onClick={handleSaveToggle}
              className={`w-full font-semibold py-2.5 rounded-lg transition-colors text-sm ${
                isSaved
                  ? "border border-navy text-navy hover:bg-navy/5"
                  : "bg-navy text-white hover:bg-navy-light"
              }`}
            >
              {isSaved ? "Saved" : "Save Vendor"}
            </button>
          ) : isLoaded && !user ? (
            <SignUpButton mode="redirect" forceRedirectUrl="/onboarding">
              <button className="w-full bg-navy text-white font-semibold py-2.5 rounded-lg hover:bg-navy-light transition-colors text-sm">
                Save Vendor
              </button>
            </SignUpButton>
          ) : null}

          {dbUser?.role === "facility_manager" ? (
            <Link
              href={`/rfq/new?invite=${profile._id}`}
              className="block w-full text-center bg-navy hover:bg-navy-light text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              Request Quote
            </Link>
          ) : isLoaded && !user ? (
            <SignUpButton mode="redirect" forceRedirectUrl="/onboarding">
              <button className="w-full bg-navy text-white font-semibold py-2.5 rounded-lg hover:bg-navy-light transition-colors text-sm">
                Request Quote
              </button>
            </SignUpButton>
          ) : null}

          {dbUser?.role === "facility_manager" && dbUser._id !== profile?.userId && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="w-full border-2 border-green text-green hover:bg-green hover:text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              Write a Review
            </button>
          )}

          {isLoaded && user ? (
            <div className="bg-white dark:bg-navy-light rounded-xl p-6 border border-cream-dark shadow-sm">
              <h2 className="text-lg font-semibold text-navy mb-4">Contact</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                    Email
                  </p>
                  <a
                    href={`mailto:${profile.email}`}
                    className="text-green hover:underline"
                  >
                    {profile.email}
                  </a>
                </div>
                {profile.phone && (
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                      Phone
                    </p>
                    <a
                      href={`tel:${profile.phone}`}
                      className="text-navy hover:underline"
                    >
                      {profile.phone}
                    </a>
                  </div>
                )}
                {profile.website && (
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                      Website
                    </p>
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green hover:underline truncate block"
                    >
                      {profile.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : isLoaded && !user ? (
            <div className="bg-white dark:bg-navy-light rounded-xl p-6 border border-cream-dark shadow-sm text-center">
              <div className="mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-green mx-auto">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-navy mb-2">Contact Info</h2>
              <p className="text-sm text-gray-500 mb-4">
                Create a free account to view contact details and connect with this vendor.
              </p>
              <Link
                href="/sign-up"
                className="block w-full bg-green hover:bg-green-light text-white font-semibold py-2.5 rounded-lg transition-colors text-sm text-center"
              >
                Sign Up Free
              </Link>
              <SignInButton mode="modal">
                <button className="w-full mt-2 text-sm text-navy hover:underline">
                  Already have an account? Sign in
                </button>
              </SignInButton>
            </div>
          ) : null}
        </aside>
      </div>
      {showEndorsersModal && (
        <EndorsersModal
          vendorProfileId={params.id as Id<"vendorProfiles">}
          initialTab={endorsersModalTab}
          onClose={() => setShowEndorsersModal(false)}
        />
      )}
      {showMeetingModal && dbUser && (
        <MeetingRequestModal
          requesterId={dbUser._id}
          recipientId={profile.userId}
          recipientName={profile.companyName}
          onClose={() => setShowMeetingModal(false)}
        />
      )}
      {showReviewModal && dbUser && profile && (
        <ReviewModal
          reviewerId={dbUser._id}
          vendorId={profile.userId}
          vendorName={profile.companyName}
          onClose={() => setShowReviewModal(false)}
        />
      )}
    </main>
  );
}
