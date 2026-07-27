import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import {
  fetchSellerSingleProduct,
  editSellerProduct,
  clearSellerSingleProduct,
} from '../../store/slices/sellerSlice'
import { fetchCategories } from '../../store/slices/productSlice'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Loader from '../../components/ui/Loader'
import ImageCarousel from '../../components/ui/ImageCarousel'
import AIDescriptionHelper from "../../components/product/AIDescriptionHelper";

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 2 * 1024 * 1024

const EditProduct = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { sellerSingleProduct: product, loading } = useSelector((state) => state.seller)
  const { categories } = useSelector((state) => state.product)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
  })
  const [newImages, setNewImages] = useState([])
  const [previews, setPreviews] = useState([])

  useEffect(() => {
    dispatch(fetchCategories())
    dispatch(fetchSellerSingleProduct(id))
    return () => dispatch(clearSellerSingleProduct())
  }, [dispatch, id])

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        category: product.category || '',
        stock: product.stock ?? '',
      })
    }
  }, [product])

  useEffect(() => {
    const urls = newImages.map((file) => ({
      url: URL.createObjectURL(file),
      file: file,
    }))
    setPreviews(urls)
    return () => urls.forEach(({ url }) => URL.revokeObjectURL(url))
  }, [newImages])

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

    setNewImages((prev) => [...prev, ...files])
  }

  const handleRemoveNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const data = new FormData()
    data.append('name', formData.name.trim())
    data.append('description', formData.description.trim())
    data.append('price', formData.price)
    data.append('category', formData.category)
    data.append('stock', formData.stock)
    newImages.forEach((file) => data.append('images', file))

    try {
      await dispatch(editSellerProduct({ id, data })).unwrap()
      toast.success('Product updated successfully!')
      navigate('/seller/products')
    } catch (err) {
      toast.error(err || 'Failed to update product')
    }
  }

  if (loading && !product) {
    return (
      <div className="flex justify-center py-16">
        <Loader />
      </div>
    )
  }

  if (!product) return null

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Product</h1>

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
          <label className="text-sm font-medium text-gray-700">Current Images</label>
          {product.images?.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {product.images.map((img, i) => (
                <img
                  key={i}
                  src={img.url}
                  alt=""
                  className="h-16 w-16 rounded-lg object-cover border border-gray-100"
                />
              ))}
            </div>
          )}

          <label className="text-sm font-medium text-gray-700 mt-2">
            Replace Images (optional)
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
                {newImages.length > 0
                  ? `${newImages.length} new image${newImages.length > 1 ? 's' : ''} selected`
                  : 'Choose New Images'}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Leave blank to keep current images. Uploading new ones replaces all existing images.
          </p>

          {previews.length > 0 && (
            <div className="mt-2">
              <ImageCarousel images={previews} onRemove={handleRemoveNewImage} isEditMode={true} />
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-4 mt-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default EditProduct