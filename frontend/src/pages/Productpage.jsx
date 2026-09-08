import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X, Sparkles } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ProductCard from '../components/ProductCard'
import { api, buildQuery } from '../lib/api'

function Shop() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [status, setStatus] = useState('Loading products...')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [sort, setSort] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)
  const [limit] = useState(100)

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setStatus('Loading products...')
      try {
        const params = {
          limit,
          sort,
          order: sort === 'price' || sort === 'newest' ? 'desc' : 'asc',
        }
        if (search) params.search = search
        if (selectedCategory) params.category_id = selectedCategory
        const [productData, categoryData] = await Promise.all([
          api(`/products/${buildQuery(params)}`, { signal: controller.signal }),
          api('/categories/', { signal: controller.signal }),
        ])
        setProducts(productData)
        setCategories(categoryData)
        setStatus('')
      } catch (err) {
        if (err.name !== 'AbortError') setStatus(err.message)
      }
    }
    load()
    return () => controller.abort()
  }, [search, selectedCategory, sort, limit])

  // Keep URL in sync with filters for shareable links
  useEffect(() => {
    const params = {}
    if (search) params.search = search
    if (selectedCategory) params.category = selectedCategory
    if (sort !== 'newest') params.sort = sort
    setSearchParams(params, { replace: true })
  }, [search, selectedCategory, sort, setSearchParams])

  const clearFilters = () => {
    setSearch('')
    setSelectedCategory('')
    setSort('newest')
  }

  const activeFilters = [
    ...(selectedCategory ? ['Category'] : []),
    ...(search ? ['Search'] : []),
    ...(sort !== 'newest' ? ['Sort'] : []),
  ]

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="container-app py-8 flex-1">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shop</h1>
            <p className="text-sm text-gray-500 mt-1">
              {search ? `Results for “${search}”` : 'Browse our catalogue'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition ${
                showFilters ? 'border-indigo-500 text-indigo-700 bg-indigo-50' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
          </div>
        </div>

        {/* AI hint */}
        <div className="mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-indigo-900">AI-assisted search</p>
            <p className="text-sm text-indigo-700">
              Can not find what you are looking for? Open the chat assistant and ask in plain English, e.g. “Show me affordable wireless headphones.”
            </p>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Sort by</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="newest">Newest</option>
                <option value="price">Price: High to Low</option>
                <option value="name">Name</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-2"
              >
                <X className="w-4 h-4" /> Clear filters
              </button>
            </div>
          </div>
        )}

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs text-gray-500">Active:</span>
            {activeFilters.map((f) => (
              <span key={f} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">
                {f}
              </span>
            ))}
          </div>
        )}

        {/* Results */}
        {status ? (
          <p className="text-gray-500">{status}</p>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-2">No products match your selection.</p>
            <button onClick={clearFilters} className="text-indigo-600 font-medium hover:underline">Clear all filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default Shop
