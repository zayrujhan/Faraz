import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

export default function Settings() {
  const { user, fetchUser } = useAuth()
  const [form, setForm] = useState({
    store_name: '',
    store_description: '',
    phone: '',
    logo_url: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setForm({
        store_name: user.store_name || '',
        store_description: user.store_description || '',
        phone: user.phone || '',
        logo_url: user.logo_url || '',
      })
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      await api('/seller/profile', {
        method: 'PUT',
        body: JSON.stringify({
          store_name: form.store_name || null,
          store_description: form.store_description || null,
          phone: form.phone || null,
          logo_url: form.logo_url || null,
        }),
      })
      await fetchUser()
      setSuccess('Profile updated successfully.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Store Settings</h1>
      <p className="text-sm text-gray-500 mb-6">Manage your store profile</p>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Store Name
          </label>
          <input
            value={form.store_name}
            onChange={(e) => setForm({ ...form, store_name: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            placeholder="Your Store Name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Store Description
          </label>
          <textarea
            value={form.store_description}
            onChange={(e) => setForm({ ...form, store_description: e.target.value })}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            placeholder="Tell customers about your store..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            placeholder="Contact phone number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Logo URL
          </label>
          <input
            value={form.logo_url}
            onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            placeholder="https://example.com/logo.png"
          />
          {form.logo_url && (
            <div className="mt-2">
              <img
                src={form.logo_url}
                alt="Logo preview"
                className="w-24 h-24 rounded-md object-cover border border-gray-200"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
