import Link from "next/link";
import { Doc } from "@/convex/_generated/dataModel";
import { EndorsementBadge } from "./EndorsementBadge";

interface VendorCardProps {
  profile: Doc<"vendorProfiles">;
  endorsements?: { peerCount: number; clientCount: number };
}

export function VendorCard({ profile, endorsements }: VendorCardProps) {
  const topServices = profile.services.slice(0, 3);
  const primaryArea = profile.serviceArea[0];
  const preview =
    profile.description.slice(0, 120) +
    (profile.description.length > 120 ? "…" : "");

  return (
    <Link href={`/directory/${profile._id}`}>
      <div className="bg-white dark:bg-navy-light border border-cream-dark rounded-xl p-6 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer h-full flex flex-col">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-navy truncate">
            {profile.companyName}
          </h3>
          {primaryArea && (
            <p className="text-sm text-gray-500 mt-0.5">{primaryArea}</p>
          )}
          {endorsements && (
            <div className="mt-1">
              <EndorsementBadge
                peerCount={endorsements.peerCount}
                clientCount={endorsements.clientCount}
              />
            </div>
          )}
        </div>
        {preview && (
          <p className="text-sm text-gray-600 mb-4 flex-1">{preview}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-auto">
          {topServices.map((s) => (
            <span
              key={s}
              className="text-xs bg-green/10 text-green font-medium px-2.5 py-1 rounded-full"
            >
              {s.split("(")[0].trim()}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
