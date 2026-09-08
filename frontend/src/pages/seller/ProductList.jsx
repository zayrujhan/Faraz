import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { api, buildQuery, formatPrice } from '../../lib/api'
import DataGrid from '../../components/ui/DataGrid'
import FilterBar, { SearchInput, SelectFilter } from '../../components/ui/FilterBar'
import Pagination from '../../components/ui/Pagination'
import StatusBadge from '../../components/ui/StatusBadge'

const PAGE_SIZE = 20

export default function ProductList() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [categories, setCategories] = useState([])

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {
        search,
        category_id: categoryFilter || undefined,
        sort,
        order: 'desc',
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
        include_inactive: true,
      }
      const data = await api(`/seller/products${buildQuery(params)}`)
      setProducts(data)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }, [search, categoryFilter, sort, page])

  useEffect(() => { loadProducts() }, [loadProducts])

  useEffect(() => {
    api('/categories/').then(setCategories).catch(() => {})
  }, [])

  useEffect(() => { setPage(1) }, [search, categoryFilter])

  const toggleActive = async (product) => {
    try {
      if (product.is_active) {
        await api(`/seller/products/${product.id}`, { method: 'DELETE' })
      } else {
        await api(`/seller/products/${product.id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...product, stock: product.stock }),
        })
      }
      loadProducts()
    } catch (e) {
      setError(e.message)
    }
  }

  const deleteProduct = async (product) => {
    if (!confirm(`Delete "${product.name}"?`)) return
    try {
      await api(`/seller/products/${product.id}`, { method: 'DELETE' })
      loadProducts()
    } catch (e) {
      setError(e.message)
    }
  }

  const columns = [
    {
      key: 'image',
      label: 'Image',
      width: 'w-16',
      render: (row) => (
        row.image_url
          ? <img src={`http://localhost:8000${row.image_url}`} alt="" className="w-10 h-10 rounded object-cover bg-gray-100" />
          : <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-400">No img</div>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      render: (row) => <span className="font-medium text-gray-900">{row.name}</span>,
    },
    {
      key: 'price',
      label: 'Price',
      align: 'right',
      render: (row) => formatPrice(row.price),
    },
    {
      key: 'stock',
      label: 'Stock',
      align: 'right',
      render: (row) => (
        <span className={row.stock === 0 ? 'text-red-600 font-medium' : row.stock <= 10 ? 'text-yellow-600 font-medium' : ''}>
          {row.stock}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.is_active ? 'Active' : 'Inactive'} />,
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      width: 'w-28',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/seller/products/${row.id}`) }}
            className="p-1.5 rounded hover:bg-gray-100"
            title="Edit"
          >
            <Edit className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); toggleActive(row) }}
            className="p-1.5 rounded hover:bg-gray-100"
            title={row.is_active ? 'Deactivate' : 'Activate'}
          >
            {row.is_active ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); deleteProduct(row) }}
            className="p-1.5 rounded hover:bg-gray-100"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">{products.length} products</p>
        </div>
        <button
          onClick={() => navigate('/seller/products/new')}
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search products..." />
        <SelectFilter
          value={categoryFilter}
          onChange={setCategoryFilter}
          label="All categories"
          options={categories.map(c => ({ value: c.id, label: c.name }))}
        />
        <SelectFilter
          value={sort}
          onChange={setSort}
          options={[
            { value: 'newest', label: 'Newest' },
            { value: 'price', label: 'Price' },
            { value: 'name', label: 'Name' },
            { value: 'stock', label: 'Stock' },
          ]}
        />
      </FilterBar>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <DataGrid
            columns={columns}
            data={products}
            onRowClick={(row) => navigate(`/seller/products/${row.id}`)}
            emptyMessage="No products found."
          />
          <Pagination page={page} totalPages={Math.ceil(100 / PAGE_SIZE)} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
