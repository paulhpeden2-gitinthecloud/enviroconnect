import Link from "next/link";
import { Doc } from "@/convex/_generated/dataModel";

function timelineColor(timeline: string) {
  if (timeline.includes("Urgent")) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  if (timeline.includes("1–3")) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
  return "bg-green/10 text-green";
}

function deadlineText(deadline: number) {
  const now = Date.now();
  const days = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
  if (days < 0) return "Expired";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `${days} days left`;
}

export function RfqCard({
  rfq,
  badge,
}: {
  rfq: Doc<"rfqs"> & { responseCount?: number };
  badge?: "Matched" | "Invited";
}) {
  const topServices = rfq.services.slice(0, 3);
  const preview =
    rfq.description.slice(0, 120) + (rfq.description.length > 120 ? "..." : "");

  return (
    <Link href={`/rfq/${rfq._id}`}>
      <div className="bg-white dark:bg-navy-light border border-cream-dark rounded-xl p-6 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer h-full flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-lg font-semibold text-navy truncate flex-1">
            {rfq.title}
          </h3>
          {badge && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
              badge === "Invited"
                ? "bg-navy/10 text-navy dark:bg-white/10 dark:text-white"
                : "bg-green/10 text-green"
            }`}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-1">{rfq.serviceArea}</p>
        <p className="text-sm text-gray-600 mb-4 flex-1">{preview}</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {topServices.map((s) => (
            <span
              key={s}
              className="text-xs bg-green/10 text-green font-medium px-2.5 py-1 rounded-full"
            >
              {s.split("(")[0].trim()}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-cream-dark">
          <span className={`px-2 py-0.5 rounded-full font-medium ${timelineColor(rfq.timeline)}`}>
            {rfq.timeline}
          </span>
          <span>{deadlineText(rfq.deadline)}</span>
          {rfq.responseCount !== undefined && (
            <span>{rfq.responseCount} proposal{rfq.responseCount !== 1 ? "s" : ""}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
