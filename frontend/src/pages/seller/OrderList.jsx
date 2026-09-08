import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, buildQuery, formatPrice, formatDate } from '../../lib/api'
import DataGrid from '../../components/ui/DataGrid'
import FilterBar, { SearchInput } from '../../components/ui/FilterBar'
import Pagination from '../../components/ui/Pagination'
import StatusBadge from '../../components/ui/StatusBadge'

const PAGE_SIZE = 20
const STATUS_TABS = ['', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

export default function OrderList() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {
        status: status || undefined,
        search: search || undefined,
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      }
      const data = await api(`/seller/orders${buildQuery(params)}`)
      setOrders(data)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }, [status, search, page])

  useEffect(() => { loadOrders() }, [loadOrders])
  useEffect(() => { setPage(1) }, [status, search])

  const columns = [
    {
      key: 'id',
      label: 'Order',
      render: (row) => <span className="font-medium text-gray-900">#{row.id}</span>,
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (row) => (
        <div>
          <p className="text-sm text-gray-900">{row.customer.name}</p>
          <p className="text-xs text-gray-500">{row.customer.email}</p>
        </div>
      ),
    },
    {
      key: 'items',
      label: 'Items',
      render: (row) => (
        <div className="text-sm text-gray-600">
          {row.items.map(i => i.product_name).join(', ')}
        </div>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      align: 'right',
      render: (row) => <span className="font-medium">{formatPrice(row.total_amount)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (row) => <span className="text-gray-500">{formatDate(row.created_at)}</span>,
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Manage incoming orders</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-1 border-b border-gray-200">
        {STATUS_TABS.map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatus(s)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              status === s ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by order ID, name, or email..." />
      </FilterBar>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <DataGrid
            columns={columns}
            data={orders}
            onRowClick={(row) => navigate(`/seller/orders/${row.id}`)}
            emptyMessage="No orders found."
          />
          <Pagination page={page} totalPages={Math.max(1, Math.ceil(100 / PAGE_SIZE))} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
