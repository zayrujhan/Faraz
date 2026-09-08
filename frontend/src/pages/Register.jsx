import { useState } from 'react'
import { api, setToken } from '../lib/api'

function Register() {
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
      const credentials = new URLSearchParams({ username: form.email, password: form.password })
      const session = await api('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: credentials,
      })
      setToken(session.access_token)
      window.location.hash = '#/'
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4"><div className="w-full max-w-md bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
    <div className="text-center mb-8"><h1 className="text-2xl font-semibold text-gray-700">Create your account</h1><p className="mt-2 text-sm text-gray-500">Join Faraz to start shopping</p></div>
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">Name<input required name="name" value={form.name} onChange={update} type="text" placeholder="Your name" className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400" /></label>
      <label className="block text-sm font-medium text-gray-700">Email<input required name="email" value={form.email} onChange={update} type="email" placeholder="you@example.com" className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400" /></label>
      <label className="block text-sm font-medium text-gray-700">Phone <span className="font-normal text-gray-400">(optional)</span><input name="phone" value={form.phone} onChange={update} type="tel" placeholder="Your phone number" className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400" /></label>
      <label className="block text-sm font-medium text-gray-700">Password<input required minLength="6" name="password" value={form.password} onChange={update} type="password" placeholder="At least 6 characters" className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400" /></label>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button disabled={submitting} type="submit" className="w-full bg-gray-700 text-white py-2 rounded-md hover:bg-gray-800 disabled:opacity-60">{submitting ? 'Creating account...' : 'Create account'}</button>
    </form>
    <p className="text-center text-sm text-gray-500 mt-6">Already registered? <a href="#/login" className="text-gray-700 font-medium hover:underline">Login</a></p>
  </div></div>
}

export default Register
