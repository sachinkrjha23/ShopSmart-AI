import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { fetchSellerProducts, toggleSellerProductStatus } from '../../store/slices/sellerSlice'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Pagination from '../../components/ui/Pagination'
import TableSkeleton from '../../components/ui/TableSkeleton'

const SellerProducts = () => {
  const dispatch = useDispatch()
  const { sellerProducts, sellerProductsPagination, loading } = useSelector((state) => state.seller)
  const [search, setSearch] = useState('')

  useEffect(() => {
    dispatch(fetchSellerProducts({ page: 1, search: '' }))
  }, [dispatch])

  const handleSearch = (e) => {
    e.preventDefault()
    dispatch(fetchSellerProducts({ page: 1, search }))
  }

  const handlePageChange = (page) => {
    dispatch(fetchSellerProducts({ page, search }))
  }

  const handleToggle = async (productId) => {
    try {
      const result = await dispatch(toggleSellerProductStatus(productId)).unwrap()
      toast.success(result.message)
    } catch (err) {
      toast.error(err || 'Failed to update product')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link to="/seller/products/add">
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

      {loading && sellerProducts.length === 0 ? (
        <TableSkeleton columns={5} />
      ) : sellerProducts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-500">
          You haven't listed any products yet.
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
              {sellerProducts.map((product) => (
                <tr key={product.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images?.[0]?.url}
                        alt={product.name}
                        className="h-10 w-10 rounded-lg object-cover bg-gray-50"
                      />
                      <span className="font-medium text-gray-800">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{product.category}</td>
                  <td className="px-4 py-3 text-gray-800">
                    ₹{Number(product.price).toLocaleString('en-IN')}
                  </td>
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
                        to={`/seller/products/edit/${product.id}`}
                        className="text-teal-600 hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleToggle(product.id)}
                        className={product.is_active ? 'text-amber-600 hover:underline' : 'text-green-600 hover:underline'}
                      >
                        {product.is_active ? 'Deactivate' : 'Activate'}
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
        currentPage={sellerProductsPagination.currentPage}
        totalPages={sellerProductsPagination.totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  )
}

export default SellerProducts