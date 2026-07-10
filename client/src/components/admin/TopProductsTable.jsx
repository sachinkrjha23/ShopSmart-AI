import StarRating from '../ui/StarRating'

const TopProductsTable = ({ products }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h2>

      {!products || products.length === 0 ? (
        <p className="text-sm text-gray-400">No sales data yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {products.map((product, index) => (
            <div key={`${product.name}-${index}`} className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-400 w-4">{index + 1}</span>
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-10 w-10 rounded-lg object-cover border border-gray-100"
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-gray-50 border border-gray-100" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 capitalize">{product.category}</span>
                  <StarRating rating={product.ratings || 0} size="sm" />
                </div>
              </div>
              <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                {product.total_sold} sold
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TopProductsTable