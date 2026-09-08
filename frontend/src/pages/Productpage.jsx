import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import ProductCard from '../components/ProductCard'
import Footer from '../components/Footer'
import { api } from '../lib/api'

function Shop({ search }) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubcategory, setSelectedSubcategory] = useState('')
  const [status, setStatus] = useState('Loading products...')

  const parentCategories = categories.filter(c => !c.parent_id)
  const subcategories = selectedCategory
    ? categories.filter(c => String(c.parent_id) === selectedCategory)
    : []

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setStatus('Loading products...')
      try {
        const params = new URLSearchParams({ limit: '100' })
        if (search) params.set('search', search)
        if (selectedSubcategory) params.set('category_id', selectedSubcategory)
        else if (selectedCategory) params.set('category_id', selectedCategory)
        const [productData, categoryData] = await Promise.all([api(`/products/?${params}`, { signal: controller.signal }), api('/categories/', { signal: controller.signal })])
        setProducts(productData); setCategories(categoryData); setStatus('')
      } catch (err) { if (err.name !== 'AbortError') setStatus(err.message) }
    }
    load(); return () => controller.abort()
  }, [search, selectedCategory, selectedSubcategory])

  return <div className="min-h-screen bg-white"><Navbar />
    <main className="px-6 md:px-10 lg:px-16 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-medium text-gray-700">Shop</h1>
          <p className="text-sm text-gray-500">{search ? `Results for “${search}”` : 'Browse our catalogue'}</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setSelectedSubcategory('') }} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="">All categories</option>
            {parentCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <select value={selectedSubcategory} onChange={(e) => setSelectedSubcategory(e.target.value)} disabled={!selectedCategory} className="border border-gray-300 rounded-md px-3 py-2 text-sm disabled:opacity-50">
            <option value="">{selectedCategory ? 'All subcategories' : 'Select category first'}</option>
            {subcategories.map((sub) => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
          </select>
          {(selectedCategory || selectedSubcategory) && (
            <button onClick={() => { setSelectedCategory(''); setSelectedSubcategory('') }} className="text-xs text-gray-600 underline hover:text-gray-900">Clear</button>
          )}
        </div>
      </div>
      {status ? <p className="mt-8 text-gray-500">{status}</p> : products.length === 0 ? <p className="mt-8 text-gray-500">No products match your selection.</p> : <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 mt-8">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
    </main><Footer />
  </div>
}

export default Shop
