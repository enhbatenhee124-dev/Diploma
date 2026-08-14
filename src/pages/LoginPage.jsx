import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { signInWithGoogle, requestPasswordReset } from '../services/authService';

// Inline SVG icons
const Icons = {
  Briefcase: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  Phone: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  Lock: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Eye: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  ArrowRight: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  Mail: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
};

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const [method, setMethod] = useState("phone"); // "phone" | "email"
  const [form, setForm] = useState({ phone: "", email: "", password: "", role: "employee" });
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { login } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();

  /** Google-ээр нэвтрэх. Тохируулаагүй бол шалтгааныг нь хэлнэ. */
  const handleGoogle = async () => {
    const result = await signInWithGoogle();
    if (!result.ok) {
      notify({ type: 'error', message: 'Google-ээр нэвтэрч чадсангүй', description: result.error });
    }
    // Амжилттай бол браузер Google руу шилжинэ
  };

  /** Нууц үг сэргээх захиа илгээнэ. Зөвхөн и-мэйлээр боломжтой. */
  const handleForgotPassword = async () => {
    const email = method === 'email'
      ? form.email.trim()
      : prompt('Бүртгэлтэй и-мэйл хаягаа оруулна уу:')?.trim();

    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      notify({ type: 'error', message: 'И-мэйл хаяг буруу байна' });
      return;
    }

    setResetting(true);
    const result = await requestPasswordReset(email);
    setResetting(false);

    // Тухайн хаяг бүртгэлтэй эсэхийг ЗАДРУУЛАХГҮЙ — амжилттай эсэхээс үл
    // хамааран ижил мессеж. Эс тэгвээс хэн бүртгэлтэйг таах боломжтой.
    notify({
      type: result.ok ? 'success' : 'error',
      message: result.ok ? 'Захиа илгээгдлээ' : 'Илгээж чадсангүй',
      description: result.ok
        ? 'Хэрэв энэ хаяг бүртгэлтэй бол нууц үг сэргээх холбоос очно. Ирсэн захиагаа шалгана уу.'
        : result.error,
    });
  };

  const getRedirectPath = (role) => {
    switch (role) {
      case 'admin': return '/admin/dashboard';
      case 'employer': return '/employer/dashboard';
      case 'employee': return '/employee/dashboard';
      default: return '/';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const identifier = method === 'email' ? form.email : form.phone;
    const result = await login(identifier, form.password, form.role, method);

    setLoading(false);

    // Алдааны мэдэгдлийг AuthContext аль хэдийн харуулсан — энд зөвхөн
    // нэвтрэх хуудсан дээр үлдэнэ.
    if (!result.ok) return;

    // Бүртгэлтэй хэрэглэгчийн ЖИНХЭНЭ дүрээр шилжинэ. Формын сонголт нь
    // зөвхөн шинэ бүртгэлд хамаатай — эс тэгвээс дүрээ буруу сонгосон хүн
    // RoleGuard-аар нүүр хуудас руу чимээгүй шидэгддэг.
    navigate(getRedirectPath(result.data.role));
  };

  return (
    <div className="mufi-page flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10 animate-fade-up">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-mufi-accent to-mufi-accent-deep shadow-[0_0_30px_rgba(150,80,240,0.5)] flex items-center justify-center mx-auto mb-6 animate-pop-in">
            <Icons.Briefcase size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-medium tracking-[-0.03em] text-mufi-fg mb-2">Тавтай морилно уу</h1>
          <p className="font-normal text-mufi-muted">MongolJob-д нэвтрэх</p>
        </div>

        {/* Card */}
        <div className="mufi-panel p-8 md:p-10 animate-fade-up" style={{ animationDelay: '120ms' }}>
          {/* Нэвтрэх арга сонгох */}
          <div className="flex p-1.5 rounded-full bg-white/[0.04] border border-mufi-border mb-8">
            {[
              { value: 'phone', label: 'Утсаар' },
              { value: 'email', label: 'И-мэйлээр' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMethod(option.value)}
                className={`flex-1 py-3 rounded-full text-sm font-semibold transition-all ${
                  method === option.value
                    ? 'bg-mufi-accent text-mufi-ink'
                    : 'text-mufi-muted hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Утас эсвэл и-мэйл */}
            {method === 'phone' ? (
              <div>
                <label className="mufi-label">Утасны дугаар</label>
                <div className="relative">
                  <Icons.Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-mufi-dim" />
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="99112233"
                    className="mufi-input pl-12"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="mufi-label">И-мэйл хаяг</label>
                <div className="relative">
                  <Icons.Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-mufi-dim" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="bolor.erdene@example.mn"
                    className="mufi-input pl-12"
                  />
                </div>
                <p className="text-xs font-medium text-mufi-muted mt-2">
                  Нэвтэрсэн тухай сэрэмжлүүлэг энэ хаяг руу илгээгдэнэ.
                </p>
              </div>
            )}

            {/* Role Selector */}
            <div>
              <label className="mufi-label">Хэрэглэгчийн төрөл</label>
              {/* Админы сонголт ЗОРИУДААР байхгүй: админ эрхийг өгөх нь
                  бүртгэлээс биш, зөвхөн өгөгдлийн сангаас хийгддэг тул
                  нийтэд харагдах формд түүнийг санал болгох нь ямар ч
                  утгагүй. Админ хэрэглэгч энэ хуудсаар хэвийн нэвтэрч,
                  ЖИНХЭНЭ дүрээрээ `/admin/dashboard` руу шилжсэн хэвээр. */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'employee', label: 'Ажил хайгч', desc: 'Employee' },
                  { value: 'employer', label: 'Ажил олгогч', desc: 'Employer' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: option.value })}
                    className={`p-3 rounded-2xl border transition-all text-center ${
                      form.role === option.value
                        ? 'border-transparent bg-mufi-accent text-mufi-ink'
                        : 'border-mufi-border bg-white/[0.04] text-mufi-muted hover:border-mufi-accent/50 hover:text-white'
                    }`}
                  >
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs opacity-70">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mufi-label">Нууц үг</label>
              <div className="relative">
                <Icons.Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-mufi-dim" />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Нууц үгээ оруулна уу"
                  className="mufi-input pl-12 pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-mufi-dim hover:text-white transition-colors"
                >
                  {showPass ? <Icons.EyeOff size={20} /> : <Icons.Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            {/* "Намайг сана" сонголтыг АВСАН: Supabase нь сешнийг үргэлж
                localStorage-д хадгалдаг тул чагт нь ямар ч нөлөөгүй байсан.
                Ажиллахгүй тохиргоо харуулахаас хэлэхгүй нь дээр. */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetting}
                className="text-sm text-mufi-accent hover:text-white transition-colors font-semibold underline underline-offset-4 disabled:opacity-50"
              >
                {resetting ? 'Илгээж байна…' : 'Нууц үгээ мартсан уу?'}
              </button>
            </div>

            {/* Submit — загварын бөөрөнхий товч, баруун талдаа цагаан дугуй сум */}
            <button
              type="submit"
              disabled={loading}
              className="mufi-btn mufi-btn-accent w-full text-base"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-mufi-ink/30 border-t-mufi-ink rounded-full animate-spin" />
              ) : (
                <>
                  Нэвтрэх
                  <Icons.ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-mufi-border" />
            <span className="text-xs font-semibold text-mufi-dim uppercase tracking-wider">эсвэл</span>
            <div className="flex-1 h-px bg-mufi-border" />
          </div>

          {/* Social */}
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full py-4 rounded-full bg-white/[0.04] border border-mufi-border text-sm font-semibold text-mufi-fg hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-3"
          >
            <svg width={20} height={20} viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.67l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google-ээр үргэлжлүүлэх
          </button>
        </div>

        {/* Footer link */}
        <p className="text-center text-sm font-medium text-mufi-muted mt-8">
          Бүртгэлгүй байна уу?{" "}
          <Link to="/register" className="text-mufi-accent font-semibold underline underline-offset-4 transition-colors hover:text-white">
            Бүртгүүлэх
          </Link>
        </p>
      </div>
    </div>
  );
}
