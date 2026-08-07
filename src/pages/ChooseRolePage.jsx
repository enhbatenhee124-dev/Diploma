import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, Search, ArrowRight, Loader2, Check } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import AnimatedBackground from '../components/AnimatedBackground'
import CursorGlow from '../components/CursorGlow'

const bgImage = new URL('../assets/hero-bg.jpg', import.meta.url).href

// ============================================================
// Дүр сонгох (нэвтэрсний дараах нэг удаагийн алхам)
// ============================================================
// Google-ээр нэвтэрсэн хүний метадатад дүр байдаггүй тул өгөгдлийн сан нь
// анхдагчаар «ажил хайгч» оноодог. Ажил олгогч болох гэсэн хүн буруу
// самбарт орохоос сэргийлж энд асууна.
//
// ⚠ Админ дүрийг ЗОРИУДААР оруулаагүй — админыг зөвхөн одоо байгаа админ
//   томилно. Сервер тал дээр ч `confirm_role` функц админ сонгохыг
//   няцаадаг тул энэ дэлгэцийг тойрч ч болохгүй.
// ============================================================

const ROLES = [
  {
    value: 'employee',
    label: 'Ажил хайж байна',
    caption: 'Ажил хайгч',
    Icon: Search,
    accent: 'from-violet-500 to-indigo-500',
    ring: 'peer-checked:border-violet-400/70 peer-checked:bg-violet-500/10',
    points: [
      'Цагийн ажлуудыг хайж, хүсэлт илгээх',
      'Ур чадвар, боломжит цагаараа тохирол авах',
      'Ажил дуусгах бүрд туршлагын оноо цуглуулах',
    ],
  },
  {
    value: 'employer',
    label: 'Ажилтан хайж байна',
    caption: 'Ажил олгогч',
    Icon: Briefcase,
    accent: 'from-cyan-500 to-emerald-500',
    ring: 'peer-checked:border-cyan-400/70 peer-checked:bg-cyan-500/10',
    points: [
      'Цагийн ажлын зар минутын дотор нийтлэх',
      'Ирсэн хүсэлтүүдийг нэг самбараас удирдах',
      'Ажилтантай шууд мессежээр холбогдох',
    ],
  },
]

export default function ChooseRolePage() {
  const { user, chooseRole } = useAuth()
  const navigate = useNavigate()
  const [selected, setSelected] = useState('employee')
  const [saving, setSaving] = useState(false)

  const submit = async e => {
    e.preventDefault()
    setSaving(true)
    const result = await chooseRole(selected)
    setSaving(false)

    // Амжилттай бол `user.role` шинэчлэгдэнэ. Маршрут руу шууд явуулна —
    // App.jsx-ийн хамгаалалт үүнээс хойш энэ хуудсыг харуулахаа болино.
    if (result.ok) navigate(`/${result.data.role}/dashboard`, { replace: true })
  }

  return (
    <div className="min-h-screen text-white font-sans relative overflow-hidden flex items-center justify-center p-4">
      <AnimatedBackground image={bgImage} />
      <CursorGlow />

      <div className="relative z-10 w-full max-w-3xl">
        <div className="text-center mb-10 animate-fade-up">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
            Сайн байна уу{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-slate-400">
            Эхлэхийн тулд та юу хийхээ сонгоно уу. Үүнийг дараа солих боломжгүй.
          </p>
        </div>

        <form onSubmit={submit}>
          <div className="grid sm:grid-cols-2 gap-5 mb-8">
            {ROLES.map((role, i) => (
              <label
                key={role.value}
                className="relative cursor-pointer animate-fade-up"
                style={{ animationDelay: `${120 + i * 90}ms` }}
              >
                {/* Жинхэнэ radio — гараар шилжих, дэлгэц уншигчид ажиллана.
                    `sr-only` нь нуух ч фокус авах боломжийг үлдээнэ. */}
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  checked={selected === role.value}
                  onChange={() => setSelected(role.value)}
                  className="peer sr-only"
                />

                <div
                  className={`h-full rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl
                              p-7 transition-all duration-200 hover-lift
                              peer-focus-visible:ring-2 peer-focus-visible:ring-white/60
                              ${role.ring}`}
                >
                  <div className="flex items-start justify-between mb-5">
                    <span className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${role.accent} flex items-center justify-center shadow-lg`}>
                      <role.Icon className="w-7 h-7 text-white" />
                    </span>

                    {/* Сонгогдсоныг харуулах тэмдэг.
                        ⚠ `peer-checked:` энд ажиллахгүй — тэр нь зөвхөн
                        ах дүү элементэд үйлчилдэг ба энэ нь `peer`-ийн
                        дотор үүрлэсэн. Тиймээс төлөвөөр нь шууд шийднэ. */}
                    <span
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        selected === role.value ? 'border-white bg-white/10' : 'border-white/25'
                      }`}
                    >
                      <Check
                        className={`w-3.5 h-3.5 transition-opacity ${
                          selected === role.value ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                    </span>
                  </div>

                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">
                    {role.caption}
                  </p>
                  <h2 className="text-xl font-bold mb-4">{role.label}</h2>

                  <ul className="space-y-2">
                    {role.points.map(point => (
                      <li key={point} className="flex gap-2.5 text-sm text-slate-400">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-500" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="shine shine-auto w-full px-6 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500
                       text-white font-bold text-lg hover:shadow-xl hover:shadow-violet-500/40
                       transition-all transform hover:scale-[1.02] active:scale-[0.98]
                       disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
                       flex items-center justify-center gap-3 animate-fade-up"
            style={{ animationDelay: '320ms' }}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Хадгалж байна…
              </>
            ) : (
              <>
                Үргэлжлүүлэх
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
