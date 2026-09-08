import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingCart, BarChart3, Settings, Store, Shield, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const sellerNavItems = [
  { to: '/seller', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/seller/products', icon: Package, label: 'Products' },
  { to: '/seller/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/seller/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/seller/settings', icon: Settings, label: 'Settings' },
]

const adminNavItems = [
  { to: '/admin', icon: Shield, label: 'Admin', end: true },
  { to: '/seller', icon: LayoutDashboard, label: 'Seller Dashboard', end: true },
  { to: '/seller/products', icon: Package, label: 'Products' },
  { to: '/seller/orders', icon: ShoppingCart, label: 'Orders' },
]

export default function SellerSidebar() {
  const { user, logout, isAdmin } = useAuth()
  const navItems = isAdmin ? adminNavItems : sellerNavItems

  return (
    <aside className="w-60 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="px-4 py-5 border-b border-gray-700">
        <div className="flex items-center gap-2">
          {isAdmin ? <Shield className="w-5 h-5 text-gray-400" /> : <Store className="w-5 h-5 text-gray-400" />}
          <span className="font-semibold text-sm">{isAdmin ? 'Admin' : (user?.store_name || user?.name || 'Seller')}</span>
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-2 py-4 border-t border-gray-700">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-400 hover:bg-gray-800 hover:text-white w-full"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
