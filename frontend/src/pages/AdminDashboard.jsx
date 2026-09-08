import { useEffect, useState } from 'react'
import { Users, Package, ShoppingCart, DollarSign, Shield, Store, TrendingUp, AlertCircle } from 'lucide-react'
import { api, formatPrice, formatDate } from '../lib/api'
import DataGrid from '../components/ui/DataGrid'
import MetricCard from '../components/ui/MetricCard'

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const [usersData, productsData, ordersData, metricsData] = await Promise.all([
          api('/users/'),
          api('/seller/products?include_inactive=true&limit=100'),
          api('/seller/orders?limit=50'),
          api('/seller/dashboard'),
        ])
        setUsers(usersData)
        setProducts(productsData)
        setOrders(ordersData)
        setMetrics(metricsData)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const customers = users.filter((u) => u.role === 'customer')
  const sellers = users.filter((u) => u.role === 'seller')
  const admins = users.filter((u) => u.role === 'admin')
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)

  const userColumns = [
    { key: 'id', label: 'ID', width: 'w-12' },
    { key: 'name', label: 'Name', render: (row) => <span className="font-medium text-gray-900">{row.name}</span> },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (row) => <span className="capitalize">{row.role}</span> },
    { key: 'is_active', label: 'Active', render: (row) => <span className={row.is_active ? 'text-green-600' : 'text-red-600'}>{row.is_active ? 'Yes' : 'No'}</span> },
  ]

  const productColumns = [
    { key: 'id', label: 'ID', width: 'w-12' },
    { key: 'name', label: 'Product', render: (row) => <span className="font-medium text-gray-900">{row.name}</span> },
    { key: 'price', label: 'Price', render: (row) => formatPrice(row.price) },
    { key: 'stock', label: 'Stock' },
    { key: 'seller', label: 'Seller', render: (row) => row.seller?.name || '-' },
    { key: 'is_active', label: 'Status', render: (row) => <span className={row.is_active ? 'text-green-600' : 'text-red-600'}>{row.is_active ? 'Active' : 'Inactive'}</span> },
  ]

  const orderColumns = [
    { key: 'id', label: 'Order', render: (row) => <span className="font-medium text-gray-900">#{row.id}</span> },
    { key: 'customer', label: 'Customer', render: (row) => row.customer?.name || '-' },
    { key: 'total_amount', label: 'Total', render: (row) => formatPrice(row.total_amount) },
    { key: 'status', label: 'Status', render: (row) => <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[row.status?.toLowerCase()] || 'bg-gray-100 text-gray-700'}`}>{row.status}</span> },
    { key: 'created_at', label: 'Date', render: (row) => formatDate(row.created_at) },
    { key: 'items', label: 'Items', render: (row) => row.items?.length || 0 },
  ]

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-gray-200 rounded-lg animate-pulse" />)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
        <AlertCircle className="w-5 h-5 mt-0.5" /> {error}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-6 h-6" /> Admin Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">Platform-wide overview and management</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Users" value={users.length} icon={Users} trend={customers.length} trendLabel="customers" />
        <MetricCard label="Sellers" value={sellers.length} icon={Store} trend={admins.length} trendLabel="admins" />
        <MetricCard label="Total Products" value={products.length} icon={Package} trend={products.filter((p) => p.is_active).length} trendLabel="active" />
        <MetricCard label="Total Revenue" value={formatPrice(totalRevenue)} icon={DollarSign} trend={orders.length} trendLabel="orders" />
      </div>

      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Platform Sales</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{formatPrice(metrics.total_sales)}</p>
            <p className="text-xs text-gray-500 mt-1">All sellers combined</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Orders</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{metrics.pending_orders}</p>
            <p className="text-xs text-gray-500 mt-1">Across all sellers</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed Orders</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{metrics.completed_orders}</p>
            <p className="text-xs text-gray-500 mt-1">All delivered/cancelled items</p>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4" /> Users ({users.length})
          </h2>
        </div>
        <DataGrid columns={userColumns} data={users} emptyMessage="No users found." />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4" /> Products ({products.length})
          </h2>
        </div>
        <DataGrid columns={productColumns} data={products} emptyMessage="No products found." />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" /> Recent Orders ({orders.length})
          </h2>
        </div>
        <DataGrid columns={orderColumns} data={orders} emptyMessage="No orders found." />
      </div>
    </div>
  )
}
