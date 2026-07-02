import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import StarRating from '../ui/StarRating'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

const ProductCard = ({ product }) => {
  const productImage = product.images?.[0]?.url || null
  const isInStock = product.stock > 0
  const isLowStock = product.stock > 0 && product.stock <= 5

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isInStock) return toast.error('Product is out of stock')
    toast('Cart coming soon!', { icon: '🛒' })
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-indigo-200">
      {/* Product Image */}
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={productImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => { e.target.style.display = 'none' }}
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {!isInStock && <Badge label="Out of Stock" variant="danger" />}
            {isLowStock && isInStock && <Badge label="Low Stock" variant="warning" />}
            {product.ratings >= 4.5 && isInStock && <Badge label="Top Rated" variant="new" />}
          </div>
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4">
        <Link to={`/products/${product.id}`} className="block">
          <h3 className="text-sm font-medium text-gray-800 hover:text-indigo-600 transition-colors line-clamp-2 min-h-10">
            {product.name}
          </h3>
        </Link>

        {product.category && (
          <p className="text-xs text-gray-500 mt-1 capitalize">{product.category}</p>
        )}

        <div className="flex items-center gap-2 mt-2">
          <StarRating rating={product.ratings || 0} size="sm" />
          <span className="text-xs text-gray-500">({product.review_count || 0})</span>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="text-lg font-bold text-indigo-600">
            {formatPrice(product.price)}
          </span>

          <Button
            variant="primary"
            size="sm"
            onClick={handleAddToCart}
            disabled={!isInStock}
            className="px-3 py-1.5 text-xs"
          >
            {!isInStock ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ProductCard