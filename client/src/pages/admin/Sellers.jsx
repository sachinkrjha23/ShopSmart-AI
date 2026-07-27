import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAdminSellers } from '../../store/slices/sellerSlice'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Pagination from '../../components/ui/Pagination'
import TableSkeleton from '../../components/ui/TableSkeleton'

const STATUS_TABS = ['All', 'Pending', 'Approved', 'Rejected', 'Suspended']

const STATUS_VARIANTS = {
  Pending: 'default',
  Approved: 'success',
  Rejected: 'danger',
  Suspended: 'warning',
}

const AdminSellers = () => {
  const dispatch = useDispatch()
  const { adminSellers, adminSellersPagination, loading } = useSelector((state) => state.seller)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('All')

  useEffect(() => {
    dispatch(fetchAdminSellers({ page: 1, search: '', status: '' }))
  }, [dispatch])

  const handleSearch = (e) => {
    e.preventDefault()
    dispatch(fetchAdminSellers({ page: 1, search, status: activeTab === 'All' ? '' : activeTab }))
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    dispatch(fetchAdminSellers({ page: 1, search, status: tab === 'All' ? '' : tab }))
  }

  const handlePageChange = (page) => {
    dispatch(fetchAdminSellers({ page, search, status: activeTab === 'All' ? '' : activeTab }))
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Sellers</h1>

      <div className="flex gap-2 border-b border-gray-100">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 max-w-md">
        <Input
          placeholder="Search by store name, applicant, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="outline">Search</Button>
      </form>

      {loading && adminSellers.length === 0 ? (
        <TableSkeleton columns={5} />
      ) : adminSellers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-500">
          No seller applications found.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Store</th>
                <th className="px-4 py-3 font-medium">Applicant</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Applied On</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminSellers.map((seller) => (
                <tr key={seller.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-800">{seller.store_name}</td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700">{seller.applicant_name}</p>
                    <p className="text-xs text-gray-400">{seller.applicant_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={seller.status} variant={STATUS_VARIANTS[seller.status]} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(seller.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/sellers/${seller.id}`} className="text-teal-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        currentPage={adminSellersPagination.currentPage}
        totalPages={adminSellersPagination.totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  )
}

export default AdminSellers