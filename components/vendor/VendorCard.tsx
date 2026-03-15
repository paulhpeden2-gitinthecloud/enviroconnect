import Link from "next/link";
import { MapPin } from "lucide-react";
import { Doc } from "@/convex/_generated/dataModel";
import { EndorsementBadge } from "@/components/endorsements/EndorsementBadge";
import { StarRatingDisplay } from "@/components/reviews/StarRating";

interface VendorCardProps {
  profile: Doc<"vendorProfiles">;
  endorsements?: { peerCount: number; clientCount: number };
  rating?: { overall: number; count: number };
}

export function VendorCard({ profile, endorsements, rating }: VendorCardProps) {
  const topServices = profile.services.slice(0, 3);
  const primaryArea = profile.serviceArea[0];
  const preview =
    profile.description.slice(0, 120) +
    (profile.description.length > 120 ? "…" : "");

  return (
    <Link href={`/directory/${profile._id}`}>
      <div className="bg-surface border border-mist rounded-lg p-6 shadow-md hover:shadow-lg hover:border-mist-hover transition-all duration-200 cursor-pointer h-full flex flex-col">
        <div className="mb-3">
          <h3 className="text-lg font-heading font-semibold text-text-deep truncate">
            {profile.companyName}
          </h3>
          {primaryArea && (
            <p className="flex items-center gap-1 text-sm text-slate-custom mt-0.5">
              <MapPin size={13} className="shrink-0" />
              {primaryArea}
            </p>
          )}
          {endorsements && (
            <div className="mt-1">
              <EndorsementBadge
                peerCount={endorsements.peerCount}
                clientCount={endorsements.clientCount}
              />
            </div>
          )}
          {rating && (
            <div className="flex items-center gap-1.5 mt-1">
              <StarRatingDisplay value={rating.overall} />
              <span className="text-xs text-slate-custom">({rating.count})</span>
            </div>
          )}
        </div>
        {preview && (
          <p className="text-sm text-text-deep mb-4 flex-1">{preview}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-auto">
          {topServices.map((s) => (
            <span
              key={s}
              className="text-xs bg-cloud text-primary-light border border-mist px-2.5 py-1 rounded"
            >
              {s.split("(")[0].trim()}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
