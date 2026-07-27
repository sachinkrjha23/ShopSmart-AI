// src/components/home/TestimonialsSection.jsx
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchTopReviews } from '../../store/slices/productSlice'
import StarRating from '../ui/StarRating'

const avatarColors = [
  'bg-teal-100 text-teal-600',
  'bg-purple-100 text-purple-600',
  'bg-pink-100 text-pink-600',
  'bg-amber-100 text-amber-600',
  'bg-emerald-100 text-emerald-600',
  'bg-rose-100 text-rose-600',
]

const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return parts[0].slice(0, 2).toUpperCase()
}

const TestimonialsSection = () => {
  const dispatch = useDispatch()
  const { topReviews, topReviewsLoading } = useSelector((state) => state.product)

  useEffect(() => {
    dispatch(fetchTopReviews())
  }, [dispatch])

  // ✅ No fake data — if no real reviews, don't render anything
  if (!topReviewsLoading && topReviews.length === 0) {
    return null
  }

  return (
    <section className="py-16 sm:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            What Our Customers Say
          </h2>
          <p className="mt-3 text-lg text-gray-500">
            Real reviews from verified buyers
          </p>
        </div>

        {topReviewsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-pulse"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="h-4 w-4 bg-gray-200 rounded" />
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-5/6" />
                  <div className="h-4 bg-gray-200 rounded w-4/6" />
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-full" />
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-24" />
                    <div className="h-3 bg-gray-200 rounded w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topReviews.map((review, index) => {
              const avatarUrl = review.reviewer_avatar?.url || null
              const reviewerName = review.reviewer_name || 'Anonymous'
              const initials = getInitials(reviewerName)

              return (
                <div
                  key={review.id || index}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 p-6 flex flex-col"
                >
                  <StarRating rating={review.rating || 0} size="sm" />

                  <p className="mt-4 text-sm text-gray-600 leading-relaxed flex-1 line-clamp-4">
                    "{review.comment || 'No comment provided.'}"
                  </p>

                  <div className="mt-6 flex items-center gap-3 pt-4 border-t border-gray-50">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={reviewerName}
                        className="h-10 w-10 rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${avatarColors[index % avatarColors.length]}`}
                      >
                        {initials}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {reviewerName}
                      </p>
                      <p className="text-xs text-gray-500">
                        Reviewed {review.product_name || 'a product'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default TestimonialsSection