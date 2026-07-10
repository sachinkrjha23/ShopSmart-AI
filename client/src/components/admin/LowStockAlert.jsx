const LowStockAlert = ({ products }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Alert</h2>

      {!products || products.length === 0 ? (
        <p className="text-sm text-gray-400">All products are well stocked.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {products.map((product, index) => (
            <div
              key={`${product.name}-${index}`}
              className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2"
            >
              <span className="text-sm text-gray-700 truncate">{product.name}</span>
              <span className="text-xs font-semibold text-red-600 whitespace-nowrap ml-2">
                {product.stock} left
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default LowStockAlert