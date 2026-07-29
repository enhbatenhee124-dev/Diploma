import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNotification } from '../hooks/useNotification'

// ============================================================
// Нууц үг сэргээх (нэвтрэх хуудасны "Мартсан уу?"-гийн үргэлжлэл)
// ============================================================
// Supabase-ийн илгээсэн захианы холбоос энэ хуудас руу авчирна. Холбоос
// дээр дарахад supabase-js нь URL дахь токеныг уншиж түр сешн үүсгэдэг
// (`detectSessionInUrl: true`). Тэр сешнээр л нууц үг солих боломжтой.
//
// ⚠ Холбоосгүйгээр шууд орж ирсэн хүнд формыг харуулах нь утгагүй —
//   тэдгээрт тодорхой мессеж өгнө.
// ============================================================

const MIN_LENGTH = 8

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { notify } = useNotification()

  const [ready, setReady] = useState(null)   // null = шалгаж байна
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  // Сэргээх сешн үүссэн эсэхийг шалгана
  useEffect(() => {
    let active = true

    const check = async () => {
      const { data } = await supabase.auth.getSession()
      if (active) setReady(Boolean(data.session))
    }

    // Токеныг уншиж дуустал бага зэрэг хүлээнэ
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true)
    })

    check()
    return () => { active = false; sub.subscription.unsubscribe() }
  }, [])

  const submit = async e => {
    e.preventDefault()

    if (password.length < MIN_LENGTH) {
      notify({ type: 'error', message: `Нууц үг хамгийн багадаа ${MIN_LENGTH} тэмдэгт байна` })
      return
    }
    if (password !== confirm) {
      notify({ type: 'error', message: 'Хоёр нууц үг таарахгүй байна' })
      return
    }

    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSaving(false)

    if (error) {
      notify({ type: 'error', message: 'Солиж чадсангүй', description: error.message })
      return
    }

    setDone(true)
    // Шинэ нууц үгээр дахин нэвтрүүлэхийн тулд сешнийг хаана
    await supabase.auth.signOut()
    setTimeout(() => navigate('/login'), 2500)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <h1 className="text-2xl font-bold mb-2">Шинэ нууц үг</h1>

          {ready === null && (
            <p className="text-slate-400">Шалгаж байна…</p>
          )}

          {ready === false && (
            <>
              <p className="text-slate-400 mb-6">
                Нууц үг сэргээх холбоос хүчингүй эсвэл хугацаа нь дууссан байна.
                Нэвтрэх хуудаснаас дахин хүсэлт илгээнэ үү.
              </p>
              <Link
                to="/login"
                className="inline-block px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-medium transition-colors"
              >
                Нэвтрэх хуудас руу
              </Link>
            </>
          )}

          {ready && done && (
            <div className="flex items-start gap-3 text-emerald-200">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>Нууц үг солигдлоо. Нэвтрэх хуудас руу шилжиж байна…</p>
            </div>
          )}

          {ready && !done && (
            <form onSubmit={submit} className="space-y-5">
              <p className="text-slate-400 text-sm">
                Шинэ нууц үгээ оруулна уу. Хамгийн багадаа {MIN_LENGTH} тэмдэгт.
              </p>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={show ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Шинэ нууц үг"
                  className="w-full pl-12 pr-12 py-4 rounded-xl bg-white/5 border border-white/10
                             text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
                <button
                  type="button"
                  onClick={() => setShow(v => !v)}
                  aria-label={show ? 'Нууц үг нуух' : 'Нууц үг харуулах'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={show ? 'text' : 'password'}
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Дахин оруулна уу"
                  className="w-full pl-12 pr-5 py-4 rounded-xl bg-white/5 border border-white/10
                             text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 rounded-xl bg-violet-600 hover:bg-violet-500 font-bold
                           flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
              >
                {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                {saving ? 'Хадгалж байна…' : 'Нууц үг солих'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
