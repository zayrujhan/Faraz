import { productImage } from '../lib/images'
import { formatPrice } from '../lib/api'

export default function ProductCard({ product }) {
  const image = productImage(product, 400, 400)

  return (
    <a
      href={`#/products/${product.id}`}
      className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all"
    >
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        <img
          src={image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = 'https://placehold.co/400x400?text=No+Image' }}
        />
        {product.stock === 0 && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded">
            Out of stock
          </span>
        )}
      </div>
      <div className="p-4 text-left">
        <p className="text-xs text-indigo-600 font-medium mb-1">
          {product.category?.name || 'Shop'}
        </p>
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-indigo-700 transition">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{product.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-base font-bold text-gray-900">{formatPrice(product.price)}</span>
          <span className={`text-xs font-medium ${product.stock <= 5 && product.stock > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
            {product.stock > 0 ? `${product.stock} left` : 'Sold out'}
          </span>
        </div>
      </div>
    </a>
  )
}
