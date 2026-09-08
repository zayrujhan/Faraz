import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Package, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { api, formatPrice, formatDate } from '../lib/api'
import { productImage } from '../lib/images'

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function CustomerOrders() {
  const [searchParams] = useSearchParams()
  const highlightId = searchParams.get('highlight')
  const [orders, setOrders] = useState([])
  const [status, setStatus] = useState('Loading orders...')
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    async function load() {
      try {
        setStatus('Loading orders...')
        const data = await api('/orders/')
        setOrders(data)
        setStatus('')
        if (highlightId) setExpanded({ [highlightId]: true })
      } catch (err) { setStatus(err.message) }
    }
    load()
  }, [highlightId])

  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  if (status) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="container-app py-16 flex-1 text-center">
          <p className="text-gray-500">{status}</p>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="container-app py-10 flex-1">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Package className="w-6 h-6" /> My Orders
        </h1>

        {orders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
            <p className="text-gray-500 mb-4">You have not placed any orders yet.</p>
            <a href="#/shop" className="text-indigo-600 font-medium hover:underline">Start shopping</a>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`bg-white border rounded-xl overflow-hidden transition ${
                  String(order.id) === highlightId ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-200'
                }`}
              >
                <button
                  onClick={() => toggle(order.id)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-gray-900">Order #{order.id}</span>
                    <span className="text-sm text-gray-500">{formatDate(order.created_at)}</span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded capitalize ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900">{formatPrice(order.total_amount)}</span>
                    {expanded[order.id] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </button>

                {expanded[order.id] && (
                  <div className="px-5 pb-5 border-t border-gray-100">
                    <div className="mt-4 space-y-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <img
                            src={productImage(item.product, 80, 80)}
                            alt={item.product?.name || 'Product'}
                            className="w-16 h-16 rounded-lg object-cover bg-gray-100"
                            onError={(e) => { e.target.src = 'https://placehold.co/80x80?text=No+Image' }}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.product?.name || 'Product'}</p>
                            <p className="text-sm text-gray-500">
                              {formatPrice(item.price)} × {item.quantity} = {formatPrice(item.price * item.quantity)}
                            </p>
                            <p className="text-xs mt-1">
                              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${statusColors[item.status?.toLowerCase()] || 'bg-gray-100 text-gray-700'}`}>
                                {item.status}
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {order.items.some((i) => i.status?.toLowerCase() === 'cancelled') && (
                      <div className="mt-4 flex items-start gap-2 text-xs text-orange-700 bg-orange-50 rounded-lg p-3">
                        <AlertCircle className="w-4 h-4 mt-0.5" />
                        One or more items were cancelled by the seller.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
