"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

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
    return <div className="text-center py-20 text-gray-500">Loading…</div>;

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
    <main className="min-h-screen bg-gray-50">
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
                    className="bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-full"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          {dbUser?.role === "facility_manager" && (
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
          )}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
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
        </aside>
      </div>
    </main>
  );
}
