import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import { fetchProduct, clearSingleProduct } from '../store/slices/productSlice'
import StarRating from '../components/ui/StarRating'
import Breadcrumb from '../components/ui/Breadcrumb'
import Loader from '../components/ui/Loader'
import ReviewCard from '../components/product/ReviewCard'

const ProductDetail = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { singleProduct: product, loading } = useSelector((state) => state.product)
  const { isAuthenticated } = useSelector((state) => state.auth)

  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    dispatch(fetchProduct(id))
    return () => dispatch(clearSingleProduct())
  }, [id, dispatch])

  useEffect(() => {
    setSelectedImage(0)
  }, [product?.id])

  const handleAddToCart = () => {
    // TODO Phase 5: dispatch(addToCart({...}))
    toast('Cart coming soon!', { icon: '🛒' })
  }

  const handleWishlist = () => {
    if (!isAuthenticated) return toast.error('Please login to add to wishlist')
    // TODO Phase 6: dispatch(addToWishlist(id))
    toast('Wishlist coming soon!', { icon: '♡' })
  }

  const handleQuantityChange = (type) => {
    if (type === 'dec' && quantity > 1) setQuantity(q => q - 1)
    if (type === 'inc' && quantity < product.stock) setQuantity(q => q + 1)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (loading) return <Loader fullScreen />

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold text-gray-700">Product not found</h2>
        <Link to="/products" className="text-indigo-600 hover:underline text-sm">
          Back to Products
        </Link>
      </div>
    )
  }

  const images = product.images || []
  const isInStock = product.stock > 0
  const isLowStock = product.stock > 0 && product.stock <= 10

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Products', href: '/products' },
              { label: product.name },
            ]}
          />
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

            {/* Images */}
            <div className="flex flex-col gap-4">
              <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                {images.length > 0 ? (
                  <img
                    src={images[selectedImage]?.url}
                    alt={product.name}
                    className="w-full h-full object-contain p-4"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                    No image available
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === index
                          ? 'border-indigo-500'
                          : 'border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col gap-5">
              <span className="text-xs font-medium text-indigo-500 uppercase tracking-wide">
                {product.category}
              </span>

              <h1 className="text-2xl font-bold text-gray-900 leading-snug">
                {product.name}
              </h1>

              <div className="flex items-center gap-3">
                <StarRating rating={product.ratings || 0} size="md" />
                <span className="text-sm text-gray-500">
                  {Number(product.ratings).toFixed(1)} · {product.reviews?.length || 0} reviews
                </span>
              </div>

              <div className="text-3xl font-bold text-indigo-600">
                {formatPrice(product.price)}
              </div>

              <div>
                {!isInStock && (
                  <span className="text-sm font-medium text-red-500">Out of Stock</span>
                )}
                {isLowStock && (
                  <span className="text-sm font-medium text-yellow-600">
                    Only {product.stock} left in stock
                  </span>
                )}
                {isInStock && !isLowStock && (
                  <span className="text-sm font-medium text-green-600">In Stock</span>
                )}
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">
                {product.description}
              </p>

              <hr className="border-gray-100" />

              {isInStock && (
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">Quantity</span>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => handleQuantityChange('dec')}
                      disabled={quantity <= 1}
                      className="px-3 py-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                    >
                      −
                    </button>
                    <span className="px-4 py-2 text-sm font-medium text-gray-800 border-x border-gray-200">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange('inc')}
                      disabled={quantity >= product.stock}
                      className="px-3 py-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-gray-400">{product.stock} available</span>
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={!isInStock}
                  className="flex-1 bg-indigo-600 text-white text-sm font-medium py-3 rounded-xl hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isInStock ? 'Add to Cart' : 'Out of Stock'}
                </button>

                <button
                  onClick={handleWishlist}
                  className="px-4 py-3 border border-gray-200 rounded-xl text-gray-500 hover:text-red-500 hover:border-red-200 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-12 pt-8 border-t border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Customer Reviews ({product.reviews?.length || 0})
            </h2>

            {product.reviews?.length === 0 && (
              <p className="text-sm text-gray-500">
                No reviews yet. Be the first to review this product.
              </p>
            )}

            {product.reviews?.length > 0 && (
              <div className="space-y-4">
                {product.reviews.map((review) => (
                  <ReviewCard key={review.review_id} review={review} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail