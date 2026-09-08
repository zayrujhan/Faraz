import { logoImage } from '../lib/images'

export default function Footer() {
  // Footer is used in both customer and public pages; user context isn't available here.
  const logoUrl = logoImage(null, 32)

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container-app py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <a href="#/" className="flex items-center gap-2 mb-4">
              <img src={logoUrl} alt="Faraz" className="h-8 w-8 object-contain" />
              <span className="text-xl font-bold text-gray-900">Faraz</span>
            </a>
            <p className="text-sm text-gray-500">
              A modern marketplace connecting buyers with trusted sellers.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Shop</h3>
            <div className="space-y-2 text-sm">
              <a href="#/" className="block text-gray-500 hover:text-gray-900">Home</a>
              <a href="#/shop" className="block text-gray-500 hover:text-gray-900">All Products</a>
              <a href="#/cart" className="block text-gray-500 hover:text-gray-900">Cart</a>
              <a href="#/orders" className="block text-gray-500 hover:text-gray-900">My Orders</a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Sell</h3>
            <div className="space-y-2 text-sm">
              <a href="#/seller/login" className="block text-gray-500 hover:text-gray-900">Seller Login</a>
              <a href="#/seller" className="block text-gray-500 hover:text-gray-900">Seller Dashboard</a>
              <a href="#/seller/products" className="block text-gray-500 hover:text-gray-900">Manage Products</a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Support</h3>
            <div className="space-y-2 text-sm">
              <a href="#" className="block text-gray-500 hover:text-gray-900">Help Center</a>
              <a href="#" className="block text-gray-500 hover:text-gray-900">Contact Us</a>
              <a href="#" className="block text-gray-500 hover:text-gray-900">Privacy Policy</a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-10 pt-6 text-sm text-gray-500 text-center md:text-left">
          &copy; {new Date().getFullYear()} Faraz Marketplace. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
