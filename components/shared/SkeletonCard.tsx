export function SkeletonCard() {
  return (
    <div className="bg-surface border border-mist rounded-xl p-6 h-full flex flex-col animate-pulse">
      <div className="h-5 bg-mist rounded w-3/4 mb-2" />
      <div className="h-3 bg-mist rounded w-1/3 mb-4" />
      <div className="space-y-2 flex-1 mb-4">
        <div className="h-3 bg-mist rounded w-full" />
        <div className="h-3 bg-mist rounded w-5/6" />
      </div>
      <div className="flex gap-2 mt-auto">
        <div className="h-6 bg-mist rounded-full w-20" />
        <div className="h-6 bg-mist rounded-full w-16" />
        <div className="h-6 bg-mist rounded-full w-24" />
      </div>
    </div>
  );
}
