import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchSellerDashboardStats } from '../../store/slices/sellerSlice'
import StatsCard from '../../components/admin/StatsCard'
import RevenueChart from '../../components/admin/RevenueChart'
import TopProductsTable from '../../components/admin/TopProductsTable'
import LowStockAlert from '../../components/admin/LowStockAlert'
import Loader from '../../components/ui/Loader'
import OrderStatusPieChart, { STATUS_COLORS } from '../../components/admin/OrderStatusPieChart'
import DashboardSummary from '../../components/admin/DashboardSummary'

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const SellerDashboard = () => {
  const dispatch = useDispatch()
  const { dashboardStats: stats, loading } = useSelector((state) => state.seller)

  useEffect(() => {
    dispatch(fetchSellerDashboardStats())
  }, [dispatch])

  if (loading && !stats) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  if (!stats) return null

  const statusEntries = Object.entries(stats.fulfillmentStatusCounts || {})

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total Revenue (All Time)" value={formatCurrency(stats.totalRevenueAllTime)} />
        <StatsCard
          label="Today's Revenue"
          value={formatCurrency(stats.todayRevenue)}
          growth={stats.todayGrowth}
        />
        <StatsCard label="Yesterday's Revenue" value={formatCurrency(stats.yesterdayRevenue)} />
        <StatsCard
          label="This Month's Sales"
          value={formatCurrency(stats.currentMonthSales)}
          growth={stats.revenueGrowth}
        />
        <StatsCard label="Previous Month's Sales" value={formatCurrency(stats.lastMonthRevenue)} />
        <StatsCard label="Total Customers" value={stats.totalCustomers} />
        <StatsCard label="New Customers This Month" value={stats.newCustomersThisMonth} />
        <StatsCard label="Total Products" value={stats.totalProducts} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Item Status Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <OrderStatusPieChart counts={stats.fulfillmentStatusCounts} />
              <div className="grid grid-cols-2 gap-4">
                {statusEntries.map(([status, count]) => (
                  <div key={status} className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: STATUS_COLORS[status] || '#9ca3af' }}
                    />
                    <div>
                      <p className="text-lg font-bold text-gray-800">{count}</p>
                      <p className="text-xs text-gray-400">{status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <RevenueChart data={stats.monthlySales} growth={stats.revenueGrowth} />
        </div>

        <div className="flex flex-col gap-6">
          <TopProductsTable products={stats.topSellingProducts} />
          <LowStockAlert products={stats.lowStockProducts} />
          <DashboardSummary
            stats={{ ...stats, newUsersThisMonth: stats.newCustomersThisMonth }}
          />
        </div>
      </div>
    </div>
  )
}

export default SellerDashboard