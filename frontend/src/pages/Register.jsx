import { useState } from 'react'
import { UserPlus, ArrowRight, AlertCircle, ShoppingBag } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

function Register() {
  const { login } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api('/signup', {
        method: 'POST',
        body: JSON.stringify({ ...form, phone: form.phone || null, role: 'customer' }),
      })
      await login(form.email, form.password)
      window.location.hash = '#/'
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl mb-4">
            <ShoppingBag className="w-6 h-6 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-2 text-sm text-gray-500">Join Faraz to start shopping and track your orders.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              required
              name="name"
              value={form.name}
              onChange={update}
              type="text"
              placeholder="Your name"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              required
              name="email"
              value={form.email}
              onChange={update}
              type="email"
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="font-normal text-gray-400">(optional)</span></label>
            <input
              name="phone"
              value={form.phone}
              onChange={update}
              type="tel"
              placeholder="Your phone number"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              required
              minLength="6"
              name="password"
              value={form.password}
              onChange={update}
              type="password"
              placeholder="At least 6 characters"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 mt-0.5" /> {error}
            </div>
          )}

          <button
            disabled={submitting}
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-lg transition"
          >
            {submitting ? 'Creating account...' : <><UserPlus className="w-4 h-4" /> Create account</>}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already registered? <a href="#/login" className="text-indigo-600 font-medium hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  )
}

export default Register
