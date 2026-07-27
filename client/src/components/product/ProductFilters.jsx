// src/components/product/ProductFilters.jsx
import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setFilters, resetFilters } from '../../store/slices/productSlice'
import { getCategories } from '../../api/productApi'
import Button from '../ui/Button'
import Input from '../ui/Input'

const ProductFilters = ({ onClose }) => {
  const dispatch = useDispatch()
  const { filters } = useSelector((state) => state.product)

  const [localFilters, setLocalFilters] = useState(filters)
  const [categories, setCategories] = useState([])

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await getCategories()
        setCategories(data.categories || [])
      } catch (err) {
        console.error('Failed to fetch categories:', err)
      }
    }
    fetchCategories()
  }, [])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setLocalFilters((prev) => ({ ...prev, [name]: value }))
  }

  const handleApplyFilters = () => {
    dispatch(setFilters(localFilters))
    if (onClose) onClose()
  }

  const handleResetFilters = () => {
    dispatch(resetFilters())
    setLocalFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      rating: '',
      sort: '',
      availability: '',
    })
    if (onClose) onClose()
  }

  const ratings = [
    { value: '4', label: '4 ★ & above' },
    { value: '3', label: '3 ★ & above' },
    { value: '2', label: '2 ★ & above' },
    { value: '1', label: '1 ★ & above' },
  ]

  const availabilityOptions = [
    { value: 'in-stock', label: 'In Stock' },
    { value: 'limited', label: 'Limited Stock' },
    { value: 'out-of-stock', label: 'Out of Stock' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800">Filter Products</h3>
        <button
          onClick={handleResetFilters}
          className="text-sm text-teal-600 hover:text-teal-800 font-medium transition-colors"
        >
          Reset All
        </button>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Category
        </label>
        <select
          name="category"
          value={localFilters.category}
          onChange={handleFilterChange}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all duration-200 bg-white"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Price Range (₹)
        </label>
        <div className="flex items-center gap-3">
          <Input
            name="minPrice"
            type="number"
            value={localFilters.minPrice}
            onChange={handleFilterChange}
            placeholder="Min"
            className="w-full"
          />
          <span className="text-gray-500 text-sm">to</span>
          <Input
            name="maxPrice"
            type="number"
            value={localFilters.maxPrice}
            onChange={handleFilterChange}
            placeholder="Max"
            className="w-full"
          />
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Rating
        </label>
        <select
          name="rating"
          value={localFilters.rating}
          onChange={handleFilterChange}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all duration-200 bg-white"
        >
          <option value="">All Ratings</option>
          {ratings.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* Availability */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Availability
        </label>
        <select
          name="availability"
          value={localFilters.availability}
          onChange={handleFilterChange}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all duration-200 bg-white"
        >
          <option value="">All Products</option>
          {availabilityOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Apply Filters Button */}
      <Button 
        variant="primary" 
        fullWidth 
        onClick={handleApplyFilters} 
        className="mt-4"
        size="lg"
      >
        Apply Filters
      </Button>
    </div>
  )
}

export default ProductFilters