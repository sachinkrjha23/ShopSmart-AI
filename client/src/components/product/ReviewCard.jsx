import StarRating from '../ui/StarRating'

const ReviewCard = ({ review }) => {
  const { rating, comment, reviewer } = review

  const avatarUrl = reviewer?.avatar?.url || null
  const initial = reviewer?.name?.charAt(0).toUpperCase() || '?'

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={reviewer?.name}
            className="h-9 w-9 rounded-full object-cover shrink-0"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold shrink-0">
            {initial}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm font-medium text-gray-800">{reviewer?.name || 'Anonymous'}</p>
            <StarRating rating={rating || 0} size="sm" />
          </div>
          {comment && (
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">{comment}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReviewCard