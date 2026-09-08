import { useEffect, useState } from 'react'
import { User, MapPin, Save, Package } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { api, getToken, formatDate } from '../lib/api'

const fieldClass = 'mt-1 w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400'

export default function Account() {
  const [user, setUser] = useState(null)
  const [address, setAddress] = useState({ street: '', city: '', state: '', country: '', postal_code: '' })
  const [hasAddress, setHasAddress] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', password: '' })
  const [status, setStatus] = useState('Loading...')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!getToken()) { window.location.hash = '#/login'; return }
    async function load() {
      try {
        const [me, addresses] = await Promise.all([api('/me'), api('/addresses/')])
        setUser(me)
        setProfileForm({ name: me.name || '', phone: me.phone || '', password: '' })
        if (addresses.length) {
          const a = addresses[0]
          setAddress({ street: a.street, city: a.city, state: a.state, country: a.country, postal_code: a.postal_code })
          setHasAddress(true)
        }
        setStatus('')
      } catch (err) { setStatus(err.message) }
    }
    load()
  }, [])

  const updateProfile = async (e) => {
    e.preventDefault()
    setMessage(''); setError('')
    try {
      const body = { name: profileForm.name || undefined, phone: profileForm.phone || undefined }
      if (profileForm.password.trim()) body.password = profileForm.password.trim()
      await api('/users/', { method: 'PUT', body: JSON.stringify(body) })
      setMessage('Profile updated successfully.')
      setProfileForm(f => ({ ...f, password: '' }))
    } catch (err) { setError(err.message) }
  }

  const updateAddress = async (e) => {
    e.preventDefault()
    setMessage(''); setError('')
    try {
      await api(hasAddress ? '/addresses/update' : '/addresses/', {
        method: 'POST',
        body: JSON.stringify(address),
      })
      setHasAddress(true)
      setMessage('Address saved successfully.')
    } catch (err) { setError(err.message) }
  }

  if (status) return <div className="min-h-screen bg-gray-50"><Navbar /><main className="max-w-5xl mx-auto bg-white border border-gray-200 p-6 md:p-10 shadow-sm mt-6 text-gray-600">{status}</main></div>

  return <div className="min-h-screen bg-gray-50"><Navbar />
    <main className="max-w-5xl mx-auto bg-white border border-gray-200 p-6 md:p-10 shadow-sm mt-6">
      <h1 className="text-2xl font-semibold text-gray-700 mb-2">My Account</h1>
      <p className="text-sm text-gray-500 mb-6">Manage your profile and addresses.</p>

      {message && <p className="mb-4 text-sm text-green-700 bg-green-50 rounded-md p-3">{message}</p>}
      {error && <p className="mb-4 text-sm text-red-700 bg-red-50 rounded-md p-3">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2"><User className="w-4 h-4 text-gray-500" /><h2 className="text-sm font-semibold text-gray-700">Account</h2></div>
          <p className="text-sm text-gray-600">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
          <p className="text-xs text-gray-400 mt-2">Joined {formatDate(user.created_at)}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 md:col-span-2">
          <div className="flex items-center gap-2 mb-2"><Package className="w-4 h-4 text-gray-500" /><h2 className="text-sm font-semibold text-gray-700">Quick links</h2></div>
          <a href="#/orders" className="text-sm text-gray-700 underline">My Orders</a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Profile Details</h2>
          <form onSubmit={updateProfile} className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Name<input value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} className={fieldClass} /></label>
            <label className="block text-sm font-medium text-gray-700">Phone<input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} className={fieldClass} /></label>
            <label className="block text-sm font-medium text-gray-700">New Password (leave blank to keep)<input type="password" value={profileForm.password} onChange={e => setProfileForm({ ...profileForm, password: e.target.value })} className={fieldClass} /></label>
            <button type="submit" className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800"><Save className="w-4 h-4" /> Save profile</button>
          </form>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2"><MapPin className="w-4 h-4" /> Shipping Address</h2>
          <form onSubmit={updateAddress} className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Street<input value={address.street} onChange={e => setAddress({ ...address, street: e.target.value })} required className={fieldClass} /></label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-gray-700">City<input value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} required className={fieldClass} /></label>
              <label className="block text-sm font-medium text-gray-700">State<input value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} required className={fieldClass} /></label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-gray-700">Country<input value={address.country} onChange={e => setAddress({ ...address, country: e.target.value })} required className={fieldClass} /></label>
              <label className="block text-sm font-medium text-gray-700">Postal Code<input value={address.postal_code} onChange={e => setAddress({ ...address, postal_code: e.target.value })} required className={fieldClass} /></label>
            </div>
            <button type="submit" className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800"><Save className="w-4 h-4" /> {hasAddress ? 'Update address' : 'Add address'}</button>
          </form>
        </section>
      </div>
    </main>
    <Footer />
  </div>
}
