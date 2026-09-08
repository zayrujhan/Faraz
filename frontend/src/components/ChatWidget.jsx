import { useEffect, useRef, useState } from 'react'
import { MessageCircle, X, Send, Sparkles, Bot } from 'lucide-react'
import { api, getToken } from '../lib/api'
import { productImage } from '../lib/images'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hi! I am the Faraz assistant. Ask me to find products, check stock, or help with your orders.',
      products: [],
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, open])

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: userMsg, products: [] }])
    setLoading(true)
    try {
      const res = await api('/chat', {
        method: 'POST',
        body: JSON.stringify({ message: userMsg }),
      })

      // Try to surface products if the assistant mentions IDs in the reply.
      // This is a light heuristic for the demo so the AI reply feels actionable.
      const ids = extractProductIds(res.reply)
      let products = []
      if (ids.length > 0) {
        products = await loadProductsByIds(ids)
      }
      setMessages((prev) => [...prev, { role: 'assistant', text: res.reply, products }])
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', text: `Sorry, I could not answer that: ${err.message}`, products: [] }])
    } finally {
      setLoading(false)
    }
  }

  function extractProductIds(text) {
    const matches = text.match(/product\s*#?(\d+)/gi) || []
    return matches.map((m) => Number(m.replace(/[^\d]/g, ''))).filter(Boolean)
  }

  async function loadProductsByIds(ids) {
    try {
      const results = await Promise.all(ids.map((id) => api(`/products/${id}`).catch(() => null)))
      return results.filter(Boolean)
    } catch {
      return []
    }
  }

  // Quick action chips
  const suggestions = [
    'Show me products under $50',
    'What are your best sellers?',
    'Do you have wireless headphones?',
  ]

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {open && (
        <div className="mb-3 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
          <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Faraz Assistant</p>
                <p className="text-xs text-indigo-100">AI-powered help</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                }`}>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {m.products && m.products.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {m.products.map((p) => (
                        <a
                          key={p.id}
                          href={`#/products/${p.id}`}
                          className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 hover:bg-gray-100 transition"
                        >
                          <img src={productImage(p, 48, 48)} alt="" className="w-10 h-10 rounded object-cover bg-gray-200" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">{p.name}</p>
                            <p className="text-xs text-indigo-600 font-semibold">${p.price}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:120ms]" />
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:240ms]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-3 pt-2 pb-1 flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => { setInput(s) }}
                className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full hover:bg-indigo-100 transition"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask anything..."
              className="flex-1 border border-gray-300 rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-gray-300 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-3 rounded-full shadow-lg transition"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        <span className="text-sm">{open ? 'Close' : 'Ask AI'}</span>
        <Sparkles className="w-4 h-4 text-indigo-200" />
      </button>
    </div>
  )
}
