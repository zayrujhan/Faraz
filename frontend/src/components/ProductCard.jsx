function ProductCard() {
    return (
        <div className="w-52 border border-gray-200 rounded-lg overflow-hidden">
            {/* Product image */}
            <div  className="w-full h-48 flex items-center justify-center bg-gray-50">
                <img src="" alt="Product Image" className="w-full h-full object-contain" />
            </div>

            {/* Product information */}
            <div className="p-3">
                <h3 className="text-sm font-medium text-gray-800">Product Name</h3>
                <p className="mt-1 text-sm font-semibold text-gray-700">$Product Price</p>
            </div>
        </div>
    )
}

export default ProductCard