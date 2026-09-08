import { useEffect, useState } from 'react'
import { Shield, Users, Package, ShoppingCart, AlertTriangle, Plus, Trash2, Ban, CheckCircle } from 'lucide-react'
import { api, formatPrice } from '../lib/api'

const fieldClass = 'mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400'

export default function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [fraudReport, setFraudReport] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showAddSeller, setShowAddSeller] = useState(false)
  const [sellerForm, setSellerForm] = useState({ name: '', email: '', phone: '', password: '', store_name: '' })

  const load = async () => {
    setLoading(true); setError('')
    try {
      const [u, p, o, f] = await Promise.all([
        api('/users/'),
        api('/seller/products?include_inactive=true&limit=100'),
        api('/seller/orders?limit=100'),
        api('/admin/fraud-report'),
      ])
      setUsers(u); setProducts(p); setOrders(o); setFraudReport(f)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const toggleActive = async (user) => {
    try {
      await api(`/users/${user.id}`, { method: 'PUT', body: JSON.stringify({ is_active: !user.is_active }) })
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u))
      setMessage(`User ${user.name} ${user.is_active ? 'blocked' : 'activated'}.`)
    } catch (e) { setError(e.message) }
  }

  const deleteUser = async (user) => {
    if (!confirm(`Delete ${user.name} (${user.email})? This cannot be undone.`)) return
    try {
      await api(`/users/${user.id}`, { method: 'DELETE' })
      setUsers(prev => prev.filter(u => u.id !== user.id))
      setMessage(`User ${user.name} deleted.`)
    } catch (e) { setError(e.message) }
  }

  const createSeller = async (e) => {
    e.preventDefault(); setError(''); setMessage('')
    try {
      await api('/admin/sellers', {
        method: 'POST',
        body: JSON.stringify({
          ...sellerForm,
          phone: sellerForm.phone || null,
          role: 'seller',
        }),
      })
      setMessage('Seller created successfully.')
      setSellerForm({ name: '', email: '', phone: '', password: '', store_name: '' })
      setShowAddSeller(false)
      load()
    } catch (e) { setError(e.message) }
  }

  const sellers = users.filter(u => u.role === 'seller')
  const customers = users.filter(u => u.role === 'customer')
  const admins = users.filter(u => u.role === 'admin')
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)

  if (loading) return <div className="p-10 text-gray-500">Loading admin dashboard...</div>

  return <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6 text-gray-700" />
        <h1 className="text-2xl font-semibold text-gray-700">Admin Dashboard</h1>
      </div>
      <button onClick={() => setShowAddSeller(!showAddSeller)} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700">
        <Plus className="w-4 h-4" /> Add Seller
      </button>
    </div>

    {error && <p className="text-sm text-red-700 bg-red-50 rounded-md p-3">{error}</p>}
    {message && <p className="text-sm text-green-700 bg-green-50 rounded-md p-3">{message}</p>}

    {showAddSeller && (
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Create Seller</h2>
        <form onSubmit={createSeller} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm text-gray-700">Name<input value={sellerForm.name} onChange={e => setSellerForm({ ...sellerForm, name: e.target.value })} required className={fieldClass} /></label>
          <label className="text-sm text-gray-700">Email<input type="email" value={sellerForm.email} onChange={e => setSellerForm({ ...sellerForm, email: e.target.value })} required className={fieldClass} /></label>
          <label className="text-sm text-gray-700">Phone<input value={sellerForm.phone} onChange={e => setSellerForm({ ...sellerForm, phone: e.target.value })} className={fieldClass} /></label>
          <label className="text-sm text-gray-700">Store Name<input value={sellerForm.store_name} onChange={e => setSellerForm({ ...sellerForm, store_name: e.target.value })} className={fieldClass} /></label>
          <label className="text-sm text-gray-700 md:col-span-2">Password<input type="password" value={sellerForm.password} onChange={e => setSellerForm({ ...sellerForm, password: e.target.value })} required minLength={6} className={fieldClass} /></label>
          <div className="md:col-span-2 flex gap-3">
            <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700">Create</button>
            <button type="button" onClick={() => setShowAddSeller(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-300">Cancel</button>
          </div>
        </form>
      </div>
    )}

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4"><div className="flex items-center gap-2 text-gray-500 text-sm mb-1"><Users className="w-4 h-4" /> Users</div><p className="text-2xl font-semibold text-gray-700">{users.length}</p></div>
      <div className="bg-white border border-gray-200 rounded-lg p-4"><div className="flex items-center gap-2 text-gray-500 text-sm mb-1"><Users className="w-4 h-4" /> Sellers</div><p className="text-2xl font-semibold text-gray-700">{sellers.length}</p></div>
      <div className="bg-white border border-gray-200 rounded-lg p-4"><div className="flex items-center gap-2 text-gray-500 text-sm mb-1"><Package className="w-4 h-4" /> Products</div><p className="text-2xl font-semibold text-gray-700">{products.length}</p></div>
      <div className="bg-white border border-gray-200 rounded-lg p-4"><div className="flex items-center gap-2 text-gray-500 text-sm mb-1"><ShoppingCart className="w-4 h-4" /> Revenue</div><p className="text-2xl font-semibold text-gray-700">{formatPrice(totalRevenue)}</p></div>
    </div>

    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Sellers</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500"><tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Store</th><th className="px-3 py-2">Status</th><th className="px-3 py-2 text-right">Actions</th></tr></thead>
          <tbody>
            {sellers.map(seller => <tr key={seller.id} className="border-t border-gray-100">
              <td className="px-3 py-2 font-medium text-gray-700">{seller.name}</td>
              <td className="px-3 py-2 text-gray-500">{seller.email}</td>
              <td className="px-3 py-2 text-gray-500">{seller.store_name || '-'}</td>
              <td className="px-3 py-2"><span className={`text-xs font-semibold px-2 py-1 rounded ${seller.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{seller.is_active ? 'Active' : 'Blocked'}</span></td>
              <td className="px-3 py-2 text-right">
                <button onClick={() => toggleActive(seller)} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 mr-2">{seller.is_active ? <><Ban className="w-3 h-3" /> Block</> : <><CheckCircle className="w-3 h-3" /> Activate</>}</button>
                <button onClick={() => deleteUser(seller)} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100"><Trash2 className="w-3 h-3" /> Delete</button>
              </td>
            </tr>)}
          </tbody>
        </table>
        {sellers.length === 0 && <p className="text-sm text-gray-500 py-4">No sellers found.</p>}
      </div>
    </div>

    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Fraud / Risk Report</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500"><tr><th className="px-3 py-2">Seller</th><th className="px-3 py-2">Products</th><th className="px-3 py-2">Out of Stock</th><th className="px-3 py-2">Low Stock</th><th className="px-3 py-2">Cancel Rate</th><th className="px-3 py-2">Flag</th></tr></thead>
          <tbody>
            {fraudReport.map(row => <tr key={row.seller_id} className={`border-t border-gray-100 ${row.flagged ? 'bg-red-50' : ''}`}>
              <td className="px-3 py-2 font-medium text-gray-700">{row.seller_name}<br/><span className="text-xs text-gray-500">{row.seller_email}</span></td>
              <td className="px-3 py-2">{row.total_products}</td>
              <td className="px-3 py-2">{row.out_of_stock}</td>
              <td className="px-3 py-2">{row.low_stock}</td>
              <td className="px-3 py-2">{row.cancellation_rate}%</td>
              <td className="px-3 py-2">{row.flagged ? <span className="text-xs font-semibold px-2 py-1 rounded bg-red-100 text-red-700">Flagged</span> : <span className="text-xs text-gray-500">OK</span>}</td>
            </tr>)}
          </tbody>
        </table>
        {fraudReport.length === 0 && <p className="text-sm text-gray-500 py-4">No data available.</p>}
      </div>
    </div>
  </div>
}
