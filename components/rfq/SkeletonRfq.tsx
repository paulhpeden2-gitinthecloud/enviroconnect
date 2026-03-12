export function SkeletonRfq() {
  return (
    <div className="bg-white dark:bg-navy-light border border-cream-dark rounded-xl p-6 h-full flex flex-col animate-pulse">
      <div className="h-5 bg-cream-dark rounded w-3/4 mb-2" />
      <div className="h-3 bg-cream-dark rounded w-1/3 mb-4" />
      <div className="space-y-2 flex-1 mb-4">
        <div className="h-3 bg-cream-dark rounded w-full" />
        <div className="h-3 bg-cream-dark rounded w-5/6" />
      </div>
      <div className="flex gap-2 mb-3">
        <div className="h-6 bg-cream-dark rounded-full w-20" />
        <div className="h-6 bg-cream-dark rounded-full w-16" />
      </div>
      <div className="flex justify-between pt-3 border-t border-cream-dark">
        <div className="h-5 bg-cream-dark rounded-full w-24" />
        <div className="h-4 bg-cream-dark rounded w-16" />
      </div>
    </div>
  );
}
