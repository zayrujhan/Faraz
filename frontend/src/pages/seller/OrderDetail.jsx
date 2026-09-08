import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, User, Package } from 'lucide-react'
import { api, formatPrice, formatDate } from '../../lib/api'
import StatusBadge from '../../components/ui/StatusBadge'

const STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadOrder = async () => {
    setLoading(true)
    setError('')
    try {
      const orders = await api(`/seller/orders?search=${id}`)
      setOrder(orders.find(o => String(o.id) === id) || null)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  useEffect(() => { loadOrder() }, [id])

  const updateItemStatus = async (itemId, newStatus) => {
    try {
      await api(`/seller/orders/${id}/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      loadOrder()
    } catch (e) {
      setError(e.message)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-100 rounded w-48 animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/seller/orders')} className="text-sm text-gray-500 hover:text-gray-700">
          &larr; Back to orders
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/seller/orders')} className="text-sm text-gray-500 hover:text-gray-700">
          &larr; Back to orders
        </button>
        <p className="text-gray-500">Order not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/seller/orders')} className="p-1.5 rounded hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Order #{order.id}</h1>
          <p className="text-sm text-gray-500">Placed on {formatDate(order.created_at)}</p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">Customer</h2>
          </div>
          <p className="text-sm text-gray-900">{order.customer.name}</p>
          <p className="text-sm text-gray-500">{order.customer.email}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">Shipping Address</h2>
          </div>
          <p className="text-sm text-gray-900">{order.shipping_address.street}</p>
          <p className="text-sm text-gray-500">
            {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
          </p>
          <p className="text-sm text-gray-500">{order.shipping_address.country}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">Order Items</h2>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
              <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100 last:border-0">
                <td className="px-5 py-3">
                  <Link to={`/seller/products/${item.product_id}`} className="text-sm font-medium text-gray-900 hover:underline">
                    {item.product_name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-center text-sm text-gray-600">{item.quantity}</td>
                <td className="px-5 py-3 text-right text-sm text-gray-900">{formatPrice(item.price)}</td>
                <td className="px-5 py-3">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-5 py-3">
                  <select
                    value={item.status}
                    onChange={(e) => updateItemStatus(item.id, e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-between">
          <span className="text-sm font-medium text-gray-900">Total</span>
          <span className="text-sm font-semibold text-gray-900">{formatPrice(order.total_amount)}</span>
        </div>
      </div>
    </div>
  )
}
