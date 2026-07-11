import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import { fetchAdminProducts, removeProduct } from '../../store/slices/productSlice'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Pagination from '../../components/ui/Pagination'
import Loader from '../../components/ui/Loader'
import Badge from '../../components/ui/Badge'

const AdminProducts = () => {
  const dispatch = useDispatch()
  const { adminProducts, adminPagination, loading } = useSelector((state) => state.product)
  const [search, setSearch] = useState('')

  useEffect(() => {
    dispatch(fetchAdminProducts({ page: 1, search: '' }))
  }, [dispatch])

  const handleSearch = (e) => {
    e.preventDefault()
    dispatch(fetchAdminProducts({ page: 1, search }))
  }

  const handlePageChange = (page) => {
    dispatch(fetchAdminProducts({ page, search }))
  }

  const handleToggle = async (product) => {
    try {
      const result = await dispatch(removeProduct(product.id)).unwrap()
      toast.success(result.message)
    } catch (err) {
      toast.error(err || 'Failed to update product')
    }
  }

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link to="/admin/products/add">
          <Button>+ Add Product</Button>
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 max-w-md">
        <Input
          placeholder="Search products by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="outline">Search</Button>
      </form>

      {loading && adminProducts.length === 0 ? (
        <div className="flex justify-center py-10">
          <Loader />
        </div>
      ) : adminProducts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-500">
          No products found.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminProducts.map((product) => (
                <tr key={product.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.images?.[0]?.url ? (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="h-10 w-10 rounded-lg object-cover border border-gray-100"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-gray-50 border border-gray-100" />
                      )}
                      <span className="font-medium text-gray-800">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{product.category}</td>
                  <td className="px-4 py-3 text-gray-800">{formatPrice(product.price)}</td>
                  <td className="px-4 py-3 text-gray-600">{product.stock}</td>
                  <td className="px-4 py-3">
                    <Badge
                      label={product.is_active ? 'Active' : 'Inactive'}
                      variant={product.is_active ? 'success' : 'default'}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        to={`/admin/products/edit/${product.id}`}
                        className="text-indigo-600 hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleToggle(product)}
                        className={`hover:underline ${product.is_active ? 'text-red-500' : 'text-green-600'}`}
                      >
                        {product.is_active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        currentPage={adminPagination.currentPage}
        totalPages={adminPagination.totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  )
}

export default AdminProducts