import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import { fetchWishlist, clearWishlist } from '../store/slices/wishlistSlice'
import WishlistCard from '../components/wishlist/WishlistCard'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Loader from '../components/ui/Loader'

const Wishlist = () => {
  const dispatch = useDispatch()
  const { items, loading } = useSelector((state) => state.wishlist)
  const [clearDialogOpen, setClearDialogOpen] = useState(false)

  useEffect(() => {
    dispatch(fetchWishlist())
  }, [dispatch])

  const handleClearConfirm = async () => {
    setClearDialogOpen(false)
    try {
      await dispatch(clearWishlist()).unwrap()
      toast.success('Wishlist cleared')
    } catch (err) {
      toast.error(err || 'Failed to clear wishlist')
    }
  }

  if (loading && items.length === 0) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
        {items.length > 0 && (
            <button
                type="button"
                onClick={() => setClearDialogOpen(true)}
                className="text-sm font-semibold text-gray-700 hover:text-red-500 transition-colors"
                >
                Clear All
            </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <p className="text-gray-500 mb-4">Your wishlist is empty.</p>
          <Link to="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <WishlistCard key={item.wishlist_id} item={item} />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        onConfirm={handleClearConfirm}
        title="Clear Wishlist"
        message="Are you sure you want to remove all items from your wishlist? This cannot be undone."
        confirmLabel="Clear All"
        variant="danger"
      />
    </div>
  )
}

export default Wishlist