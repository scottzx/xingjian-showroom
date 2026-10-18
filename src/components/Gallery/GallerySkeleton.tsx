export function GallerySkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="bg-tesla-black/60 border border-tesla-dark/50 rounded-xl overflow-hidden"
        >
          {/* Image skeleton */}
          <div className="aspect-square bg-gradient-to-br from-tesla-dark/20 to-tesla-black/40 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
          </div>

          {/* Info skeleton */}
          <div className="p-4 space-y-2">
            <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse" />
            <div className="flex items-center justify-between">
              <div className="h-3 bg-white/5 rounded w-1/2 animate-pulse" />
              <div className="h-3 bg-white/5 rounded w-8 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
