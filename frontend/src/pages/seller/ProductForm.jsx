import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, Upload, X } from 'lucide-react'
import { api, uploadFile } from '../../lib/api'

export default function ProductForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', category_id: '' })
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [selectedParent, setSelectedParent] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [currentImage, setCurrentImage] = useState(null)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/categories/').then((cats) => {
      const parents = cats.filter(c => !c.parent_id)
      const subs = cats.filter(c => c.parent_id)
      setCategories(parents)
      setSubcategories(subs)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!isEdit) return
    api(`/products/${id}`).then((p) => {
      setForm({ name: p.name, description: p.description || '', price: String(p.price), stock: String(p.stock), category_id: String(p.category_id) })
      if (p.image_url) setCurrentImage(`http://localhost:8000${p.image_url}`)
      const parent = subcategories.find(s => s.id === p.category_id)?.parent_id
      if (parent) setSelectedParent(String(parent))
      setLoading(false)
    }).catch((e) => { setError(e.message); setLoading(false) })
  }, [id, isEdit, subcategories])

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setCurrentImage(null)
  }

  const filteredSubs = selectedParent
    ? subcategories.filter(s => String(s.parent_id) === selectedParent)
    : subcategories

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const body = {
        name: form.name,
        description: form.description || null,
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10),
        category_id: parseInt(form.category_id, 10),
      }
      let product
      if (isEdit) {
        product = await api(`/seller/products/${id}`, { method: 'PUT', body: JSON.stringify(body) })
      } else {
        product = await api('/seller/products', { method: 'POST', body: JSON.stringify(body) })
      }
      if (imageFile) {
        await uploadFile(`/seller/products/${product.id}/images`, imageFile)
      }
      navigate('/seller/products')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">{isEdit ? 'Edit Product' : 'New Product'}</h1>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
          <input
            required
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            placeholder="e.g. Premium Wireless Headphones"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            placeholder="Describe your product..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD) *</label>
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              value={form.price}
              onChange={(e) => updateField('price', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
            <input
              required
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => updateField('stock', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              value={selectedParent}
              onChange={(e) => { setSelectedParent(e.target.value); updateField('category_id', '') }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory *</label>
            <select
              required
              value={form.category_id}
              onChange={(e) => updateField('category_id', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
              disabled={!selectedParent}
            >
              <option value="">Select subcategory</option>
              {filteredSubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
          {(imagePreview || currentImage) ? (
            <div className="relative inline-block">
              <img src={imagePreview || currentImage} alt="" className="w-32 h-32 rounded-md object-cover border border-gray-200" />
              <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full p-0.5 hover:bg-gray-50">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-gray-400">
              <Upload className="w-6 h-6 text-gray-400" />
              <span className="text-xs text-gray-500 mt-1">Upload</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
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
            {submitting ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
          <button type="button" onClick={() => navigate('/seller/products')} className="text-sm text-gray-500 hover:text-gray-700">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
