import { useEffect, useRef, useState } from 'react'
import { MessageCircle, X, Send, Bot } from 'lucide-react'
import { api, getToken } from '../lib/api'
import { productImage } from '../lib/images'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [remaining, setRemaining] = useState(0)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, open])

  const token = getToken()

  useEffect(() => {
    if (token) {
      setMessages([{ role: 'assistant', text: 'Hi! I am the Faraz assistant. Ask me about products, orders, shipping, or how to use the site. You have 5 messages per day.' }])
    } else {
      setMessages([{ role: 'assistant', text: 'Please log in to chat with the Faraz assistant.' }])
    }
  }, [token])

  useEffect(() => {
    function handleOpen(event) {
      setOpen(true)
      if (event.detail?.message) {
        setInput(event.detail.message)
      }
    }
    window.addEventListener('open-faraz-chat', handleOpen)
    return () => window.removeEventListener('open-faraz-chat', handleOpen)
  }, [])

  async function sendMessage() {
    if (!input.trim() || loading || !token) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg, products: [] }])
    setLoading(true)
    try {
      const res = await api('/chat', { method: 'POST', body: JSON.stringify({ message: userMsg }) })
      setRemaining(res.remaining_messages)
      const ids = extractProductIds(res.reply)
      let products = []
      if (ids.length > 0) {
        products = (await Promise.all(ids.map(id => api(`/products/${id}`).catch(() => null)))).filter(Boolean)
      }
      setMessages(prev => [...prev, { role: 'assistant', text: res.reply, products }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: `Sorry: ${err.message}` }])
    } finally {
      setLoading(false)
    }
  }

  function extractProductIds(text) {
    const matches = text.match(/product\s*#?(\d+)/gi) || []
    return matches.map(m => Number(m.replace(/[^\d]/g, ''))).filter(Boolean)
  }

  const suggestions = [
    'Show me products under TK. 5000',
    'What products are in stock?',
    'How do I track my order?',
  ]

  return <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
    {open && (
      <div className="mb-3 w-80 sm:w-96 bg-white border border-gray-300 rounded-lg shadow-lg flex flex-col max-h-[80vh] overflow-hidden">
        <div className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            <div>
              <p className="text-sm font-semibold">Faraz Assistant</p>
              <p className="text-xs text-gray-300">{token ? `${remaining} messages left today` : 'Login required'}</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-gray-300 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>
                <p className="whitespace-pre-wrap">{m.text}</p>
                {m.products && m.products.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {m.products.map(p => (
                      <a key={p.id} href={`#/products/${p.id}`} className="flex items-center gap-2 bg-gray-50 rounded p-2 border border-gray-100 hover:bg-gray-100">
                        <img src={productImage(p, 48, 48)} alt="" className="w-10 h-10 rounded object-cover bg-gray-200" onError={(e) => { e.target.style.display = 'none' }} />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate">{p.name}</p>
                          <p className="text-xs text-gray-600 font-semibold">{formatMini(p.price)}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && <div className="flex justify-start"><div className="bg-white border border-gray-200 rounded-lg px-3 py-2"><div className="flex gap-1"><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" /><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:120ms]" /><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:240ms]" /></div></div></div>}
        </div>
        {token && (
          <div className="px-3 pt-2 pb-1 flex flex-wrap gap-1">
            {suggestions.map(s => <button key={s} onClick={() => setInput(s)} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200">{s}</button>)}
          </div>
        )}
        <div className="p-3 border-t border-gray-200 bg-white flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={token ? 'Ask a question...' : 'Log in to chat'}
            disabled={!token}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:bg-gray-100"
          />
          <button onClick={sendMessage} disabled={!token || !input.trim() || loading} className="p-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-300">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    )}
    <button onClick={() => setOpen(!open)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all">
      {open ? <X className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
      {open ? 'Close' : 'Ask AI Assistant'}
      {!open && <span className="ml-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
    </button>
  </div>
}

function formatMini(price) {
  return `TK. ${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
