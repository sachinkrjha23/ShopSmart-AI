import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import { fetchAdminProducts, removeProduct } from '../../store/slices/productSlice'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Pagination from '../../components/ui/Pagination'
import TableSkeleton from '../../components/ui/TableSkeleton'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'

const AdminProducts = () => {
  const dispatch = useDispatch()
  const { adminProducts, adminPagination, loading } = useSelector((state) => state.product)
  const [search, setSearch] = useState('')
  const [reasonTarget, setReasonTarget] = useState(null) // product object, while reason modal is open
  const [reasonText, setReasonText] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

  const runToggle = async (id, reason) => {
    try {
      const result = await dispatch(removeProduct({ id, reason })).unwrap()
      toast.success(result.message)
    } catch (err) {
      toast.error(err || 'Failed to update product')
    }
  }

  const handleToggle = (product) => {
    // deactivating (not reactivating) a SELLER's product requires a reason -> open modal
    if (product.seller_id && product.is_active) {
      setReasonTarget(product)
      setReasonText('')
      return
    }
    // admin-owned products, and reactivating anything, stay instant as before
    runToggle(product.id, undefined)
  }

  const handleReasonSubmit = async () => {
    if (!reasonText.trim()) {
      toast.error('Please enter a reason.')
      return
    }
    setSubmitting(true)
    await runToggle(reasonTarget.id, reasonText.trim())
    setSubmitting(false)
    setReasonTarget(null)
    setReasonText('')
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
        <TableSkeleton columns={6} />
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
                      <div>
                        <span className="font-medium text-gray-800">{product.name}</span>
                        {product.seller_id && (
                          <span className="block text-xs text-gray-400">Seller-owned</span>
                        )}
                      </div>
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
                      {product.seller_id ? (
                        <span
                          className="text-gray-300 cursor-not-allowed"
                          title="This product belongs to a seller — admins can only deactivate it, not edit its details"
                        >
                          Edit
                        </span>
                      ) : (
                        <Link
                          to={`/admin/products/edit/${product.id}`}
                          className="text-teal-600 hover:underline"
                        >
                          Edit
                        </Link>
                      )}
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

      <Modal
        isOpen={reasonTarget !== null}
        onClose={() => { setReasonTarget(null); setReasonText('') }}
        title="Deactivate Seller Product"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-3">
          You're deactivating <span className="font-medium">{reasonTarget?.name}</span>, which belongs to a seller.
          Please provide a reason — the seller will be notified.
        </p>
        <textarea
          value={reasonText}
          onChange={(e) => setReasonText(e.target.value)}
          rows={3}
          placeholder="e.g. Listing violates prohibited items policy"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 mb-4"
          autoFocus
        />
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={() => { setReasonTarget(null); setReasonText('') }}>Cancel</Button>
          <Button variant="danger" onClick={handleReasonSubmit} disabled={submitting || !reasonText.trim()}>
            {submitting ? 'Deactivating...' : 'Deactivate'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default AdminProducts