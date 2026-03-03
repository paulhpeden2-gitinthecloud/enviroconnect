"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import { SkeletonProfile } from "@/components/SkeletonProfile";

export default function VendorProfilePage() {
  const params = useParams();
  const { user, isLoaded } = useUser();

  const profile = useQuery(api.vendors.getVendorProfile, {
    id: params.id as Id<"vendorProfiles">,
  });
  const dbUser = useQuery(
    api.users.getUserByClerkId,
    isLoaded && user ? { clerkId: user.id } : "skip"
  );
  const isSaved = useQuery(
    api.vendors.isVendorSaved,
    dbUser && profile
      ? { facilityManagerId: dbUser._id, vendorProfileId: profile._id }
      : "skip"
  );
  const saveVendor = useMutation(api.mutations.saveVendor);
  const unsaveVendor = useMutation(api.mutations.unsaveVendor);

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
    </main>
  );
}
