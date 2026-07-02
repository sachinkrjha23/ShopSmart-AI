// src/components/home/CategoryGrid.jsx
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCategories } from '../../store/slices/productSlice'

const categoryIcons = {
  'electronics': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  ),
  'fashion': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 4l3-1 3 1 4 2-2 3-2-1v11H8V8L6 9 4 6l5-2z" />
  ),
  'home & kitchen': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.5z" />
  ),
  'beauty & personal care': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a4 4 0 014 4c0 1.5-.8 2.6-2 3.4V12h2l1 9H7l1-9h2V9.4C8.8 8.6 8 7.5 8 6a4 4 0 014-4z" />
  ),
  'books': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.25C10.5 5 8.5 4 6 4a4 4 0 00-2 .5v13A4 4 0 016 17c2.5 0 4.5 1 6 2.25M12 6.25c1.5-1.25 3.5-2.25 6-2.25a4 4 0 012 .5v13a4 4 0 00-2-.5c-2.5 0-4.5 1-6 2.25M12 6.25v13" />
  ),
  'sports & fitness': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2c2.5 2.5 4 6 4 10s-1.5 7.5-4 10c-2.5-2.5-4-6-4-10s1.5-7.5 4-10z" />
  ),
  'toys & games': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.4 7.2 16.9l.9-5.4-3.9-3.8 5.4-.8L12 2z" />
  ),
  'grocery': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l3-8H5.4M7 13L5.4 5M7 13l-1.5 5h11M9 21a1 1 0 100-2 1 1 0 000 2zM17 21a1 1 0 100-2 1 1 0 000 2z" />
  ),
  'health & wellness': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
  ),
  'automotive': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 17h14M5 17a2 2 0 104 0M15 17a2 2 0 104 0M5 17l1.5-5h11L19 17M6.5 12l1-3.5A2 2 0 019.4 7h5.2a2 2 0 011.9 1.5l1 3.5" />
  ),
}

const defaultIcon = (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5.586a2 2 0 011.414.586l7 7a2 2 0 010 2.828l-6.586 6.586a2 2 0 01-2.828 0l-7-7A2 2 0 013 11V7a4 4 0 014-4z" />
)

const CategoryGrid = () => {
  const dispatch = useDispatch()
  const { categories, categoriesLoading } = useSelector((state) => state.product)

  useEffect(() => {
    dispatch(fetchCategories())
  }, [dispatch])

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Shop by Category</h2>
          <p className="mt-3 text-lg text-gray-500">Find exactly what you need, faster</p>
        </div>

        {categoriesLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-2xl bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No categories available right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {categories.map((category) => (
              <Link
                key={category}
                to={`/products?category=${encodeURIComponent(category)}`}
                className="group flex flex-col items-center justify-center gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {categoryIcons[category.toLowerCase()] || defaultIcon}
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700 text-center">
                  {category}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default CategoryGrid