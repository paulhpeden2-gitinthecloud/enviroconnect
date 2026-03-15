export function SkeletonRfq() {
  return (
    <div className="bg-surface border border-mist rounded-lg p-6 h-full flex flex-col animate-pulse shadow-md">
      <div className="h-5 bg-mist rounded w-3/4 mb-2" />
      <div className="h-3 bg-mist rounded w-1/3 mb-4" />
      <div className="space-y-2 flex-1 mb-4">
        <div className="h-3 bg-mist rounded w-full" />
        <div className="h-3 bg-mist rounded w-5/6" />
      </div>
      <div className="flex gap-2 mb-3">
        <div className="h-6 bg-cloud rounded w-20" />
        <div className="h-6 bg-cloud rounded w-16" />
      </div>
      <div className="flex justify-between pt-3 border-t border-mist">
        <div className="h-5 bg-mist rounded w-24" />
        <div className="h-4 bg-mist rounded w-16" />
      </div>
    </div>
  );
}
