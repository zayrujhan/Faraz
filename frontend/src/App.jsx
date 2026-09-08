import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import HomePage from './pages/Home'
import Login from './pages/login'
import Register from './pages/Register'
import Shop from './pages/Productpage'
import ProductDetails from './pages/ProductDetails'
import ShoppingCart from './pages/ShoppingCart'
import SellerLayout from './components/seller/SellerLayout'
import Dashboard from './pages/seller/Dashboard'
import ProductList from './pages/seller/ProductList'
import ProductForm from './pages/seller/ProductForm'
import OrderList from './pages/seller/OrderList'
import OrderDetail from './pages/seller/OrderDetail'
import Analytics from './pages/seller/Analytics'
import Settings from './pages/seller/Settings'

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Loading...</p></div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function LoginRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user && (user.role === 'seller' || user.role === 'admin')) return <Navigate to="/seller" replace />
  if (user) return <Navigate to="/" replace />
  return <Login />
}

function RegisterRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return <Register />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRedirect />} />
      <Route path="/register" element={<RegisterRedirect />} />
      <Route path="/" element={<HomePage />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/products/:id" element={<ProductDetails />} />
      <Route path="/cart" element={<ShoppingCart />} />

      <Route
        path="/seller"
        element={
          <ProtectedRoute roles={['seller', 'admin']}>
            <SellerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<ProductList />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id" element={<ProductForm />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  )
}
