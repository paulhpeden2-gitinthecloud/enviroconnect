export function SkeletonProfile() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8 animate-pulse">
      <div className="md:col-span-2 space-y-8">
        <div>
          <div className="h-6 bg-cream-dark rounded w-1/4 mb-3" />
          <div className="space-y-2">
            <div className="h-4 bg-cream-dark rounded w-full" />
            <div className="h-4 bg-cream-dark rounded w-5/6" />
            <div className="h-4 bg-cream-dark rounded w-4/6" />
          </div>
        </div>
        <div>
          <div className="h-6 bg-cream-dark rounded w-1/4 mb-3" />
          <div className="flex flex-wrap gap-2">
            <div className="h-8 bg-cream-dark rounded-full w-28" />
            <div className="h-8 bg-cream-dark rounded-full w-32" />
            <div className="h-8 bg-cream-dark rounded-full w-24" />
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="bg-white dark:bg-navy-light rounded-xl p-6 border border-cream-dark">
          <div className="h-5 bg-cream-dark rounded w-1/2 mb-4" />
          <div className="space-y-3">
            <div className="h-3 bg-cream-dark rounded w-full" />
            <div className="h-3 bg-cream-dark rounded w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
