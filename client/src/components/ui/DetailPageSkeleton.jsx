const DetailPageSkeleton = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-start justify-between gap-3 mb-6">
          <div className="space-y-2">
            <div className="h-3 rounded w-20 skeleton-shimmer" />
            <div className="h-4 rounded w-32 skeleton-shimmer" />
            <div className="h-3 rounded w-40 skeleton-shimmer" />
          </div>
          <div className="h-6 rounded-full w-24 skeleton-shimmer" />
        </div>
        <div className="h-2 rounded-full w-full skeleton-shimmer" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <div className="h-4 rounded w-32 skeleton-shimmer" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-lg shrink-0 skeleton-shimmer" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 rounded w-3/4 skeleton-shimmer" />
              <div className="h-3 rounded w-1/3 skeleton-shimmer" />
            </div>
            <div className="h-3.5 rounded w-16 skeleton-shimmer" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
        <div className="h-4 rounded w-28 skeleton-shimmer" />
        <div className="h-3 rounded w-full skeleton-shimmer" />
        <div className="h-3 rounded w-2/3 skeleton-shimmer" />
      </div>
    </div>
  )
}

export default DetailPageSkeleton