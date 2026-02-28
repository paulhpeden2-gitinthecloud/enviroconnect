import Link from "next/link";
import { Doc } from "@/convex/_generated/dataModel";

export function VendorCard({ profile }: { profile: Doc<"vendorProfiles"> }) {
  const topServices = profile.services.slice(0, 3);
  const primaryArea = profile.serviceArea[0];
  const preview =
    profile.description.slice(0, 120) +
    (profile.description.length > 120 ? "…" : "");

  return (
    <Link href={`/directory/${profile._id}`}>
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-navy/30 transition-all cursor-pointer h-full flex flex-col">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-navy truncate">
            {profile.companyName}
          </h3>
          {primaryArea && (
            <p className="text-sm text-gray-500 mt-0.5">{primaryArea}</p>
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
