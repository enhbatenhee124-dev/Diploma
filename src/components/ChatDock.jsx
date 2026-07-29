import { useState } from 'react'
import { Bot, MessageSquare, X, ChevronLeft, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useMyThreads, useProfiles } from '../hooks/useData'
import ChatPanel from './ChatPanel'

// ------------------------------
// Баруун доод буланд байрлах хоёр дугуй товч
// ------------------------------
// 1. AI туслах — LLM холболт хийгдээгүй
// 2. Чат — ажил олгогч / ажилтантай ярих (зөвшөөрөгдсөн ажил дээр)
// ------------------------------

export default function ChatDock() {
  const { user } = useAuth()
  const [open, setOpen] = useState(null)          // 'ai' | 'chat'
  const [activeThread, setActiveThread] = useState(null)

  const threadsQ = useMyThreads()
  const profilesQ = useProfiles()

  const isEmployer = user?.role === 'employer'

  /** Тухайн чатын нөгөө талын нэр. */
  const partnerName = thread => {
    const partnerId = isEmployer ? thread.workerId : thread.employerId
    return profilesQ.data.find(p => p.id === partnerId)?.name || 'Хэрэглэгч'
  }

  const buttons = [
    { id: 'ai', label: 'AI туслах', icon: Bot },
    { id: 'chat', label: 'Чат', icon: MessageSquare, badge: threadsQ.data.length },
  ]

  const closeAll = () => {
    setOpen(null)
    setActiveThread(null)
  }

  return (
    <div className="fixed bottom-5 right-4 lg:right-8 z-50 flex flex-col items-end gap-3">
      {/* ---------- AI самбар ---------- */}
      {open === 'ai' && (
        <div className="w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-white/15 bg-slate-900/95 backdrop-blur-xl shadow-2xl p-4 animate-slide-up">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="font-semibold text-white">AI туслахтай чатлах</h3>
            <button onClick={closeAll} aria-label="Хаах" className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-white/70">Ажил хайх, анкет бичих, ярилцлагад бэлдэхэд тусална.</p>
          <p className="mt-3 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            AI холболт хараахан хийгдээгүй байна.
          </p>
        </div>
      )}

      {/* ---------- Чат ---------- */}
      {open === 'chat' && (
        <div className="w-[min(23rem,calc(100vw-2rem))] h-[min(30rem,calc(100vh-9rem))] animate-slide-up">
          {activeThread ? (
            <ChatPanel
              threadId={activeThread.id}
              title={partnerName(activeThread)}
              subtitle={activeThread.shiftTitle}
              onClose={() => setActiveThread(null)}
            />
          ) : (
            <div className="flex flex-col h-full bg-slate-900/95 border border-white/12 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <h3 className="font-semibold text-white">Чатууд</h3>
                <button onClick={closeAll} aria-label="Хаах" className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {threadsQ.loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                ) : threadsQ.data.length === 0 ? (
                  <div className="text-center py-10 px-3">
                    <MessageSquare className="w-8 h-8 text-white/25 mx-auto mb-2" />
                    <p className="text-sm text-white/60">Чат алга.</p>
                    <p className="text-xs text-white/40 mt-1">
                      Хүсэлт зөвшөөрөгдсөний дараа чат автоматаар нээгдэнэ.
                    </p>
                  </div>
                ) : (
                  threadsQ.data.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setActiveThread(t)}
                      className="w-full text-left p-3 rounded-xl bg-white/[0.04] border border-white/10
                                 hover:bg-white/[0.08] transition-colors"
                    >
                      <p className="font-medium text-white truncate">{partnerName(t)}</p>
                      <p className="text-xs text-white/55 truncate">{t.shiftTitle}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------- Дугуй товчнууд ---------- */}
      <div className="flex items-center gap-3 flex-row-reverse">
        {buttons.map(btn => {
          const Icon = btn.icon
          const isOpen = open === btn.id
          return (
            <button
              key={btn.id}
              onClick={() => {
                setOpen(isOpen ? null : btn.id)
                setActiveThread(null)
              }}
              title={btn.label}
              aria-label={btn.label}
              aria-expanded={isOpen}
              className={`relative w-14 h-14 rounded-full flex items-center justify-center
                          bg-slate-900/90 backdrop-blur border border-white/15
                          text-white shadow-lg shadow-black/40
                          transition-all duration-200 hover:scale-110 hover:bg-slate-800
                          ${isOpen ? 'ring-2 ring-white/40 scale-110 bg-slate-800' : ''}`}
            >
              <Icon className="w-6 h-6" />
              {btn.badge > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-white text-slate-900 text-[11px] font-bold flex items-center justify-center">
                  {btn.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
