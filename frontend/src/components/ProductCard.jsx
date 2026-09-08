import { formatPrice } from '../lib/api'
import { productImage } from '../lib/images'

function ProductCard({ product }) {

    return (
        <a href={`#/products/${product.id}`} className="w-full border border-gray-200 rounded-lg overflow-hidden bg-white hover:border-gray-400 transition-colors">
            <div className="w-full h-48 bg-gray-50 overflow-hidden">
                <img
                    src={productImage(product)}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'https://placehold.co/400x400?text=No+Image' }}
                />
            </div>
            <div className="p-3">
                <h3 className="text-sm font-medium text-gray-800 line-clamp-1">{product.name}</h3>
                <p className="mt-1 text-sm font-semibold text-gray-700">{formatPrice(product.price)}</p>
                {product.description && (
                    <p className="mt-2 text-xs text-gray-500 line-clamp-2">{product.description}</p>
                )}
            </div>
        </a>
    )
}

export default ProductCard
