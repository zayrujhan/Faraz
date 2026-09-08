import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import ProductCard from '../components/ProductCard'
import Footer from '../components/Footer'
import { api } from '../lib/api'

function Shop({ search }) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [status, setStatus] = useState('Loading products...')

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setStatus('Loading products...')
      try {
        const params = new URLSearchParams({ limit: '100' })
        if (search) params.set('search', search)
        if (selectedCategory) params.set('category_id', selectedCategory)
        const [productData, categoryData] = await Promise.all([api(`/products/?${params}`, { signal: controller.signal }), api('/categories/', { signal: controller.signal })])
        setProducts(productData); setCategories(categoryData); setStatus('')
      } catch (err) { if (err.name !== 'AbortError') setStatus(err.message) }
    }
    load(); return () => controller.abort()
  }, [search, selectedCategory])

  return <div className="min-h-screen bg-white"><Navbar />
    <main className="px-6 md:px-10 lg:px-16 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-medium text-gray-700">Shop</h1><p className="text-sm text-gray-500">{search ? `Results for “${search}”` : 'Browse our catalogue'}</p></div>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm"><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
      </div>
      {status ? <p className="mt-8 text-gray-500">{status}</p> : products.length === 0 ? <p className="mt-8 text-gray-500">No products match your selection.</p> : <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 mt-8">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
    </main><Footer />
  </div>
}

export default Shop
