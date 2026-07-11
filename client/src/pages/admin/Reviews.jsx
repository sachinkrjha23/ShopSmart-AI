import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import { fetchAdminReviews, removeAdminReview } from '../../store/slices/productSlice'
import StarRating from '../../components/ui/StarRating'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Pagination from '../../components/ui/Pagination'
import Loader from '../../components/ui/Loader'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

const AdminReviews = () => {
  const dispatch = useDispatch()
  const { adminReviews, adminReviewsPagination, loading } = useSelector((state) => state.product)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    dispatch(fetchAdminReviews({ page: 1, search: '' }))
  }, [dispatch])

  const handleSearch = (e) => {
    e.preventDefault()
    dispatch(fetchAdminReviews({ page: 1, search }))
  }

  const handlePageChange = (page) => {
    dispatch(fetchAdminReviews({ page, search }))
  }

  const handleDeleteConfirm = async () => {
    const id = deleteTarget
    setDeleteTarget(null)
    try {
      await dispatch(removeAdminReview(id)).unwrap()
      toast.success('Review deleted successfully.')
    } catch (err) {
      toast.error(err || 'Failed to delete review')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>

      <form onSubmit={handleSearch} className="flex gap-3 max-w-md">
        <Input
          placeholder="Search by product, reviewer name, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="outline">Search</Button>
      </form>

      {loading && adminReviews.length === 0 ? (
        <div className="flex justify-center py-10">
          <Loader />
        </div>
      ) : adminReviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-500">
          No reviews found.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {adminReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-2">
                <div>
                  <Link
                    to={`/products/${review.product_id}`}
                    className="text-sm font-semibold text-indigo-600 hover:underline"
                  >
                    {review.product_name}
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {review.reviewer_name} · {review.reviewer_email}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StarRating rating={review.rating} size="sm" />
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(review.id)}
                    className="text-red-500 hover:underline text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                {new Date(review.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </p>
            </div>
          ))}
        </div>
      )}

      <Pagination
        currentPage={adminReviewsPagination.currentPage}
        totalPages={adminReviewsPagination.totalPages}
        onPageChange={handlePageChange}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Review"
        message="This will permanently delete this review and recalculate the product's average rating. This cannot be undone."
        confirmLabel="Delete Review"
        variant="danger"
      />
    </div>
  )
}

export default AdminReviews