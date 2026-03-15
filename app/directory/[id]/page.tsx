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
import { MessageSquare, CalendarDays, Lock, CheckCircle2, ArrowLeft } from "lucide-react";

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
      <main className="min-h-screen bg-cloud">
        <div className="bg-primary text-white py-10 px-4">
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
      <div className="text-center py-20 text-slate-custom">
        <p className="text-lg mb-4 text-text-deep">Vendor not found.</p>
        <Link href="/directory" className="text-primary-light underline">
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
    <main className="min-h-screen bg-cloud">
      {/* Hero header */}
      <div className="bg-primary text-white py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/directory"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Directory
          </Link>
          <h1 className="text-3xl font-heading font-bold">{profile.companyName}</h1>
          <p className="text-white/70 mt-1">
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
              <span className="text-white/70 text-sm">
                {ratingSummary.overall.toFixed(1)} ({ratingSummary.count} {ratingSummary.count === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <EndorseButton
              userId={dbUser?._id ?? null}
              vendorProfileId={params.id as Id<"vendorProfiles">}
              isOwnProfile={dbUser?._id === profile?.userId}
            />
            {dbUser && dbUser._id !== profile?.userId && (
              <>
                <Link
                  href="/messages"
                  className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white rounded-lg px-4 py-2 font-medium text-sm transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message
                </Link>
                <button
                  onClick={() => setShowMeetingModal(true)}
                  className="inline-flex items-center gap-2 border border-mist text-white hover:bg-white/10 rounded-lg px-4 py-2 font-medium text-sm transition-colors"
                >
                  <CalendarDays className="w-4 h-4" />
                  Schedule Meeting
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="md:col-span-2 space-y-8">
          {profile.description && (
            <section className="bg-surface border border-mist rounded-lg shadow-md p-6">
              <h2 className="text-xl font-heading font-semibold text-text-deep mb-3">About</h2>
              <p className="text-slate-custom whitespace-pre-wrap leading-relaxed">
                {profile.description}
              </p>
            </section>
          )}

          {profile.services.length > 0 && (
            <section className="bg-surface border border-mist rounded-lg shadow-md p-6">
              <h2 className="text-xl font-heading font-semibold text-text-deep mb-3">Services</h2>
              <div className="flex flex-wrap gap-2">
                {profile.services.map((s) => (
                  <span
                    key={s}
                    className="bg-cloud text-primary-light border border-mist text-xs rounded px-2 py-0.5"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          {profile.certifications.length > 0 && (
            <section className="bg-surface border border-mist rounded-lg shadow-md p-6">
              <h2 className="text-xl font-heading font-semibold text-text-deep mb-3">
                Certifications
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.certifications.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1.5 bg-accent-surface text-accent text-xs font-semibold rounded px-2 py-0.5"
                  >
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    {c}
                  </span>
                ))}
              </div>
            </section>
          )}

          {profile.serviceArea.length > 0 && (
            <section className="bg-surface border border-mist rounded-lg shadow-md p-6">
              <h2 className="text-xl font-heading font-semibold text-text-deep mb-3">
                Service Areas
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.serviceArea.map((a) => (
                  <span
                    key={a}
                    className="bg-cloud text-primary-light border border-mist text-xs rounded px-2 py-0.5"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </section>
          )}

          {vendorReviews && vendorReviews.length > 0 && (
            <section className="bg-surface border border-mist rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-heading font-semibold text-text-deep">Reviews</h2>
                {ratingSummary && (
                  <div className="flex items-center gap-2">
                    <StarRatingDisplay value={ratingSummary.overall} />
                    <span className="text-sm text-slate-custom">{ratingSummary.overall.toFixed(1)} avg</span>
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
                    <div key={label} className="text-center bg-cloud rounded-lg p-3 border border-mist">
                      <p className="text-xs text-slate-custom mb-1">{label}</p>
                      <p className="text-lg font-semibold text-text-deep">{value.toFixed(1)}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-4">
                {vendorReviews.map((review) => (
                  <div key={review._id} className="bg-cloud rounded-lg border border-mist p-5 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-text-deep">{review.reviewerCompany}</p>
                        <p className="text-xs text-slate-custom">{review.serviceType}</p>
                      </div>
                      <div className="text-right">
                        <StarRatingDisplay value={review.overallRating} />
                        <p className="text-xs text-slate-custom mt-0.5">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {review.rfqId ? (
                      <p className="text-xs text-slate-custom">Via RFQ engagement</p>
                    ) : review.projectName ? (
                      <p className="text-xs text-slate-custom">Project: {review.projectName}</p>
                    ) : null}
                    {review.serviceCompletedDate && (
                      <p className="text-xs text-slate-custom">Service completed: {new Date(review.serviceCompletedDate).toLocaleDateString()}</p>
                    )}
                    {review.notes && (
                      <p className="text-sm text-slate-custom">{review.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {dbUser?.role === "facility_manager" ? (
            <button
              onClick={handleSaveToggle}
              className={`w-full font-semibold py-2.5 rounded-lg transition-colors text-sm ${
                isSaved
                  ? "border border-mist text-primary hover:bg-cloud"
                  : "bg-accent hover:bg-accent-hover text-white"
              }`}
            >
              {isSaved ? "Saved" : "Save Vendor"}
            </button>
          ) : isLoaded && !user ? (
            <SignUpButton mode="redirect" forceRedirectUrl="/onboarding">
              <button className="w-full bg-accent hover:bg-accent-hover text-white font-semibold py-2.5 rounded-lg transition-colors text-sm">
                Save Vendor
              </button>
            </SignUpButton>
          ) : null}

          {dbUser?.role === "facility_manager" ? (
            <Link
              href={`/rfq/new?invite=${profile._id}`}
              className="block w-full text-center bg-primary hover:bg-primary-light text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              Request Quote
            </Link>
          ) : isLoaded && !user ? (
            <SignUpButton mode="redirect" forceRedirectUrl="/onboarding">
              <button className="w-full bg-primary hover:bg-primary-light text-white font-semibold py-2.5 rounded-lg transition-colors text-sm">
                Request Quote
              </button>
            </SignUpButton>
          ) : null}

          {dbUser?.role === "facility_manager" && dbUser._id !== profile?.userId && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="w-full border border-mist text-primary hover:bg-cloud font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              Write a Review
            </button>
          )}

          {isLoaded && user ? (
            <div className="bg-surface border border-mist rounded-lg shadow-md p-6">
              <h2 className="text-lg font-heading font-semibold text-text-deep mb-4">Contact</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-custom text-sm mb-1">Email</p>
                  <a
                    href={`mailto:${profile.email}`}
                    className="text-text-deep hover:text-accent-hover hover:underline transition-colors"
                  >
                    {profile.email}
                  </a>
                </div>
                {profile.phone && (
                  <div>
                    <p className="text-slate-custom text-sm mb-1">Phone</p>
                    <a
                      href={`tel:${profile.phone}`}
                      className="text-text-deep hover:underline"
                    >
                      {profile.phone}
                    </a>
                  </div>
                )}
                {profile.website && (
                  <div>
                    <p className="text-slate-custom text-sm mb-1">Website</p>
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:text-accent-hover hover:underline truncate block transition-colors"
                    >
                      {profile.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : isLoaded && !user ? (
            <div className="bg-surface border border-mist rounded-lg shadow-md p-6 text-center">
              <div className="mb-3">
                <Lock className="w-10 h-10 text-accent mx-auto" />
              </div>
              <h2 className="text-lg font-heading font-semibold text-text-deep mb-2">Contact Info</h2>
              <p className="text-sm text-slate-custom mb-4">
                Create a free account to view contact details and connect with this vendor.
              </p>
              <Link
                href="/sign-up"
                className="block w-full bg-accent hover:bg-accent-hover text-white font-semibold py-2.5 rounded-lg transition-colors text-sm text-center"
              >
                Sign Up Free
              </Link>
              <SignInButton mode="modal">
                <button className="w-full mt-2 text-sm text-slate-custom hover:text-text-deep hover:underline transition-colors">
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
