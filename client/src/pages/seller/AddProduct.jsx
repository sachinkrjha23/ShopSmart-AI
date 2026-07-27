import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import { addSellerProduct } from '../../store/slices/sellerSlice'
import { fetchCategories } from '../../store/slices/productSlice'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import ImageCarousel from '../../components/ui/ImageCarousel'
import AIDescriptionHelper from "../../components/product/AIDescriptionHelper";

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 2 * 1024 * 1024

const AddProduct = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { categories } = useSelector((state) => state.product)
  const { loading } = useSelector((state) => state.seller)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
  })
  const [images, setImages] = useState([])
  const [previews, setPreviews] = useState([])

  useEffect(() => {
    dispatch(fetchCategories())
  }, [dispatch])

  useEffect(() => {
    const urls = images.map((file) => ({
      url: URL.createObjectURL(file),
      file: file,
    }))
    setPreviews(urls)
    return () => urls.forEach(({ url }) => URL.revokeObjectURL(url))
  }, [images])

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}`)
        return
      }
      if (file.size > MAX_SIZE) {
        toast.error(`File too large: ${file.name}. Max 2MB.`)
        return
      }
    }

    setImages((prev) => [...prev, ...files])
  }

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const validate = () => {
    const { name, description, price, category, stock } = formData
    if (!name.trim() || !description.trim() || !price || !category || stock === '') {
      toast.error('Please fill in all required fields')
      return false
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      toast.error('Please provide a valid price')
      return false
    }
    if (isNaN(parseInt(stock)) || parseInt(stock) < 0) {
      toast.error('Please provide a valid stock quantity')
      return false
    }
    if (images.length === 0) {
      toast.error('Please upload at least one product image')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    const data = new FormData()
    data.append('name', formData.name.trim())
    data.append('description', formData.description.trim())
    data.append('price', formData.price)
    data.append('category', formData.category)
    data.append('stock', formData.stock)
    images.forEach((file) => data.append('images', file))

    try {
      await dispatch(addSellerProduct(data)).unwrap()
      toast.success('Product created successfully!')
      navigate('/seller/products')
    } catch (err) {
      toast.error(err || 'Failed to create product')
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Product</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col gap-4"
      >
        <Input
          label="Product Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          disabled={loading}
          required
        />

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Description <span className="text-red-500">*</span></label>
            <AIDescriptionHelper
              draft={formData.description}
              productName={formData.name}
              category={formData.category}
              onGenerated={(text) => setFormData((prev) => ({ ...prev, description: text }))}
              disabled={loading}
            />
          </div>
          <textarea name="description" value={formData.description} onChange={handleChange} disabled={loading} rows={4} className="..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Price (₹)"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            disabled={loading}
            required
          />
          <Input
            label="Stock"
            name="stock"
            type="number"
            value={formData.stock}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all duration-200 bg-white"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-gray-700">
            Product Images <span className="text-red-500">*</span>
          </label>

          <div className="relative">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={handleImageChange}
              disabled={loading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-100 hover:border-teal-300 transition-all duration-200">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="text-sm font-medium">
                {images.length > 0
                  ? `${images.length} image${images.length > 1 ? 's' : ''} selected`
                  : 'Choose Images'}
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            JPEG, PNG, WEBP, or GIF. Max 2MB each. At least one image required.
          </p>

          {previews.length > 0 && (
            <div className="mt-2">
              <ImageCarousel images={previews} onRemove={handleRemoveImage} isEditMode={true} />
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-4 mt-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Product'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default AddProduct