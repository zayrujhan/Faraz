import { useState } from 'react'
import { Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function AdminLogin() {
  const { login, logout } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault(); setError(''); setSubmitting(true)
    try {
      const me = await login(email, password)
      if (me.role !== 'admin') {
        logout()
        setError('This account is not an admin.')
      } else {
        window.location.hash = '#/admin'
      }
    } catch (err) { setError(err.message) } finally { setSubmitting(false) }
  }

  return <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4"><div className="w-full max-w-md bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
    <div className="text-center mb-8"><div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4"><Shield className="w-6 h-6 text-gray-700" /></div><h1 className="text-2xl font-semibold text-gray-700">Admin Sign In</h1><p className="mt-2 text-sm text-gray-500">Administrator access only</p></div>
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="block text-sm font-medium text-gray-700">Email<input required value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="admin@example.com" className="mt-2 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400" /></label>
      <label className="block text-sm font-medium text-gray-700">Password<input required value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Enter your password" className="mt-2 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400" /></label>
      {error && <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-md p-2">{error}</p>}
      <button disabled={submitting} type="submit" className="w-full bg-gray-900 text-white py-2 rounded-md hover:bg-gray-800 disabled:opacity-60">{submitting ? 'Signing in...' : 'Admin Login'}</button>
    </form>
    <p className="text-center text-sm text-gray-500 mt-6"><a href="#/login" className="text-gray-700 font-medium hover:underline">Customer sign in</a> · <a href="#/seller/login" className="text-gray-700 font-medium hover:underline">Seller sign in</a></p>
  </div></div>
}

export default AdminLogin
