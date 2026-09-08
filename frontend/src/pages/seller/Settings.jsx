import { useEffect, useState } from 'react'
import { Save, Upload, X } from 'lucide-react'
import { api, uploadFile } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

export default function Settings() {
  const { user, fetchUser } = useAuth()
  const [form, setForm] = useState({ store_name: '', store_description: '', phone: '' })
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setForm({
        store_name: user.store_name || '',
        store_description: user.store_description || '',
        phone: user.phone || '',
      })
      if (user.logo_url) setLogoPreview(`http://localhost:8000${user.logo_url}`)
    }
  }, [user])

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      let logoUrl = user?.logo_url || null
      if (logoFile) {
        const result = await uploadFile('/seller/products/0/images', logoFile)
        logoUrl = result.image_url
      }
      await api('/seller/profile', {
        method: 'PUT',
        body: JSON.stringify({ ...form, logo_url: logoUrl }),
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

      {success && <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-700">{success}</div>}
      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
          <input
            value={form.store_name}
            onChange={(e) => setForm({ ...form, store_name: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            placeholder="Your Store Name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Store Description</label>
          <textarea
            value={form.store_description}
            onChange={(e) => setForm({ ...form, store_description: e.target.value })}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            placeholder="Tell customers about your store..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            placeholder="Contact phone number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Store Logo</label>
          {logoPreview ? (
            <div className="relative inline-block">
              <img src={logoPreview} alt="" className="w-24 h-24 rounded-md object-cover border border-gray-200" />
              <button
                type="button"
                onClick={() => { setLogoFile(null); setLogoPreview(null) }}
                className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full p-0.5 hover:bg-gray-50"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-gray-400">
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500 mt-1">Upload</span>
              <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            </label>
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
