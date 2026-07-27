// src/components/home/FeaturedProducts.jsx
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProducts } from '../../store/slices/productSlice'
import ProductGrid from '../product/ProductGrid'

const FeaturedProducts = () => {
  const dispatch = useDispatch()
  const { newProducts, topRatedProducts, loading } = useSelector((state) => state.product)

  useEffect(() => {
    dispatch(fetchProducts())
  }, [dispatch])

  return (
    <>
      {/* New Arrivals */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">New Arrivals</h2>
              <p className="mt-2 text-lg text-gray-500">Fresh additions from the last 30 days</p>
            </div>
            <Link
              to="/products"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
            >
              View All
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {!loading && newProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No new arrivals right now — check back soon.</p>
            </div>
          ) : (
            <ProductGrid products={newProducts} loading={loading} />
          )}
        </div>
      </section>

      {/* Top Rated */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Top Rated</h2>
              <p className="mt-2 text-lg text-gray-500">Loved by customers, rated 4.5★ and above</p>
            </div>
            <Link
              to="/products?ratings=4.5"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
            >
              View All
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {!loading && topRatedProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No top-rated products yet.</p>
            </div>
          ) : (
            <ProductGrid products={topRatedProducts} loading={loading} />
          )}
        </div>
      </section>
    </>
  )
}

export default FeaturedProducts