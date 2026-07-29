import { useState, useRef, useEffect } from 'react'
import { Send, X, MessageSquare, Loader2 } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { useAuth } from '../hooks/useAuth'
import { useChat } from '../hooks/useData'

/** Мессежийн цагийг товч харуулна. */
function stamp(iso) {
  const d = new Date(iso)
  if (isToday(d)) return format(d, 'HH:mm')
  if (isYesterday(d)) return `Өчигдөр ${format(d, 'HH:mm')}`
  return format(d, 'MM-dd HH:mm')
}

/**
 * Чатын самбар.
 * Утасны дугаар солилцохгүйгээр холбогдох арга — зөвшөөрөгдсөн
 * хүсэлт дээр л нээгдэнэ.
 */
export default function ChatPanel({ threadId, title, subtitle, onClose }) {
  const { user } = useAuth()
  const { messages, loading, error, send } = useChat(threadId)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)
  const bottomRef = useRef(null)

  // Шинэ мессеж ирэхэд доош гүйлгэнэ
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const submit = async e => {
    e.preventDefault()
    const value = text.trim()
    if (!value || sending) return

    setSending(true)
    setSendError(null)
    const result = await send(value)
    setSending(false)

    if (!result.ok) {
      setSendError(result.error)
      return
    }
    setText('')
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/95 border border-white/12 rounded-2xl overflow-hidden">
      {/* Толгой */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <MessageSquare className="w-4 h-4 text-white flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-medium text-white truncate">{title}</p>
            {subtitle && <p className="text-xs text-white/55 truncate">{subtitle}</p>}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Хаах"
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Мессежүүд */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
        ) : error ? (
          <p className="text-center text-sm text-red-300 py-10">{error}</p>
        ) : messages.length === 0 ? (
          <div className="text-center py-10">
            <MessageSquare className="w-8 h-8 text-white/25 mx-auto mb-2" />
            <p className="text-sm text-white/60">Мессеж алга.</p>
            <p className="text-xs text-white/40 mt-1">Ажлын талаар асуухаас эхлээрэй.</p>
          </div>
        ) : (
          messages.map(m => {
            const mine = m.senderId === user?.id
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2 ${
                    mine
                      ? 'bg-white/15 text-white rounded-br-sm'
                      : 'bg-white/[0.06] text-white rounded-bl-sm border border-white/10'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                  <p className="text-[10px] text-white/45 mt-1 text-right">{stamp(m.createdAt)}</p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Бичих */}
      <form onSubmit={submit} className="px-3 py-3 border-t border-white/10 flex-shrink-0">
        {sendError && <p className="text-xs text-red-300 mb-2 px-1">{sendError}</p>}
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              // Enter илгээнэ, Shift+Enter мөр таслана
              if (e.key === 'Enter' && !e.shiftKey) submit(e)
            }}
            rows={1}
            maxLength={2000}
            placeholder="Мессеж бичих..."
            className="flex-1 resize-none bg-white/[0.06] border border-white/12 rounded-xl px-3.5 py-2.5
                       text-sm text-white placeholder-white/35 outline-none focus:border-white/30
                       max-h-28"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            aria-label="Илгээх"
            className="w-10 h-10 rounded-xl bg-white/15 border border-white/15 flex items-center justify-center
                       text-white hover:bg-white/25 transition-colors disabled:opacity-40 flex-shrink-0"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  )
}
