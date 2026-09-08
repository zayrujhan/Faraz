import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, setToken } from '../lib/api'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault(); setError(''); setSubmitting(true)
    try {
      const body = new URLSearchParams({ username: email, password })
      const result = await api('/login', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
      setToken(result.access_token)
      const me = await api('/me')
      if (me.role === 'seller' || me.role === 'admin') {
        navigate('/seller')
      } else {
        navigate('/')
      }
    } catch (err) { setError(err.message) } finally { setSubmitting(false) }
  }

  return <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4"><div className="w-full max-w-md bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
    <div className="text-center mb-8"><h1 className="text-2xl font-semibold text-gray-700">Welcome Back</h1><p className="mt-2 text-sm text-gray-500">Login to your Faraz account</p></div>
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="block text-sm font-medium text-gray-700">Email<input required value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Enter your email" className="mt-2 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400" /></label>
      <label className="block text-sm font-medium text-gray-700">Password<input required value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Enter your password" className="mt-2 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400" /></label>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button disabled={submitting} type="submit" className="w-full bg-gray-700 text-white py-2 rounded-md hover:bg-gray-800 disabled:opacity-60">{submitting ? 'Logging in...' : 'Login'}</button>
    </form><p className="text-center text-sm text-gray-500 mt-6">Don't have an account? <Link to="/register" className="text-gray-700 font-medium hover:underline">Register</Link></p><p className="text-center text-sm text-gray-500 mt-3"><Link to="/" className="hover:underline">Continue shopping</Link></p>
  </div></div>
}

export default Login
