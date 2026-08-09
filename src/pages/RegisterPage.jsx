import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { signInWithGoogle } from '../services/authService';

// Inline SVG icons
const Icons = {
  Briefcase: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  User: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Phone: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  Mail: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polyline points="22,6 12,13 2,6" />
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
  CheckCircle: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  ArrowRight: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
};

export default function RegisterPage() {
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [role, setRole] = useState("employee"); // "employee" or "employer"
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", password: "", confirm: "" });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { notify } = useNotification();

  const handleGoogle = async () => {
    const result = await signInWithGoogle();
    if (!result.ok) {
      notify({ type: 'error', message: 'Google-ээр бүртгүүлж чадсангүй', description: result.error });
    }
  };
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('Нууц үг таарахгүй байна.');
      return;
    }
    if (form.password.length < 6) {
      setError('Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.');
      return;
    }
    if (!agreed) {
      setError('Үйлчилгээний нөхцөлд зөвшөөрөх шаардлагатай.');
      return;
    }

    setLoading(true);
    const result = await register({
      name: form.fullName,
      phone: form.phone,
      email: form.email,
      password: form.password,
      role,
    });
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    // И-мэйл баталгаажуулалт асаалттай бол сешн үүсээгүй тул нэвтрэх хуудас руу
    if (result.needsConfirmation) {
      navigate('/login');
      return;
    }

    navigate(`/${result.data.role}/dashboard`);
  };

  return (
    <div className="chadal-page flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10 animate-fade-up">
          <div className="w-16 h-16 rounded-full bg-chadal-accent flex items-center justify-center mx-auto mb-6 animate-pop-in">
            <Icons.Briefcase size={28} className="text-chadal-ink" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Бүртгэл үүсгэх</h1>
          <p className="font-medium text-chadal-muted">MongolJob-д нэгдэж холбогдох</p>
        </div>

        {/* Card */}
        <div className="chadal-panel p-8 md:p-10 animate-fade-up" style={{ animationDelay: '120ms' }}>
          {/* Role toggle */}
          <div className="flex p-1.5 rounded-full bg-white/[0.04] border border-chadal-border mb-8">
            <button
              type="button"
              onClick={() => setRole("employee")}
              className={`flex-1 py-3 rounded-full text-sm font-medium transition-all ${
                role === "employee"
                  ? "bg-chadal-accent text-chadal-ink"
                  : "text-chadal-muted hover:text-white"
              }`}
            >
              Ажил хайгч
            </button>
            <button
              type="button"
              onClick={() => setRole("employer")}
              className={`flex-1 py-3 rounded-full text-sm font-medium transition-all ${
                role === "employer"
                  ? "bg-chadal-accent text-chadal-ink"
                  : "text-chadal-muted hover:text-white"
              }`}
            >
              Ажил олгогч
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="chadal-label">
                {role === "employer" ? "Компанийн Нэр" : "Бүтэн Нэр"}
              </label>
              <div className="relative">
                <Icons.User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-chadal-dim" />
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder={role === "employer" ? "Акмэ Корп" : "Болор Эрдэнэ"}
                  className="chadal-input pl-12"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="chadal-label">Утасны дугаар</label>
              <div className="relative">
                <Icons.Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-chadal-dim" />
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="99112233"
                  className="chadal-input pl-12"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="chadal-label">И-мэйл хаяг</label>
              <div className="relative">
                <Icons.Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-chadal-dim" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="bolor.erdene@example.mn"
                  className="chadal-input pl-12"
                />
              </div>
              <p className="text-xs font-medium text-chadal-muted mt-2">
                Нэвтрэх бүрд энэ хаяг руу сэрэмжлүүлэг илгээнэ.
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="chadal-label">Нууц үг</label>
              <div className="relative">
                <Icons.Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-chadal-dim" />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  minLength={4}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Хамгийн багадаа 4 тэмдэгт"
                  className="chadal-input pl-12 pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-chadal-dim hover:text-white transition-colors"
                >
                  {showPass ? <Icons.EyeOff size={20} /> : <Icons.Eye size={20} />}
                </button>
              </div>
              {/* Password strength hint */}
              <div className="flex gap-1.5 mt-3">
                {[1, 2, 3, 4].map((bar) => (
                  <div
                    key={bar}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      form.password.length >= bar * 1 ? "bg-emerald-400" : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="chadal-label">Нууц үг баталгаажуулах</label>
              <div className="relative">
                <Icons.Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-chadal-dim" />
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  placeholder="Нууц үгээ давтана уу"
                  className="chadal-input pl-12 pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-chadal-dim hover:text-white transition-colors"
                >
                  {showConfirm ? <Icons.EyeOff size={20} /> : <Icons.Eye size={20} />}
                </button>
              </div>
              {form.confirm && form.password !== form.confirm && (
                <p className="text-xs text-red-600 mt-2">Нууц үг таарахгүй байна</p>
              )}
              {form.confirm && form.password === form.confirm && (
                <p className="text-xs text-emerald-700 mt-2 flex items-center gap-2">
                  <Icons.CheckCircle size={14} /> Нууц үг таарлаа
                </p>
              )}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded border-chadal-field bg-chadal-bg text-chadal-accent focus:ring-chadal-accent/40"
                required
              />
              <span className="text-sm font-medium text-chadal-muted leading-relaxed">
                Би{" "}
                <Link to="/terms" target="_blank" className="text-chadal-accent font-semibold underline underline-offset-4">Үйлчилгээний нөхцөлд</Link>
                {" "}болон{" "}
                <Link to="/terms#privacy" target="_blank" className="text-chadal-accent font-semibold underline underline-offset-4">Нууцлалын бодлогод</Link>
                {" "}зөвшөөрч байна
              </span>
            </label>

            {/* Алдааны мэдээлэл */}
            {error && (
              <div className="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit — загварын бөөрөнхий товч, баруун талдаа цагаан дугуй сум */}
            <button
              type="submit"
              disabled={loading}
              className="chadal-btn chadal-btn-accent w-full text-base"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Бүртгэл үүсгэх
                  <Icons.ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-chadal-border" />
            <span className="text-xs font-semibold text-chadal-dim uppercase tracking-wider">эсвэл</span>
            <div className="flex-1 h-px bg-chadal-border" />
          </div>

          {/* Social */}
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full py-4 rounded-full bg-white/[0.04] border border-chadal-border text-sm font-semibold text-chadal-fg hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-3"
          >
            <svg width={20} height={20} viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google-ээр үргэлжлүүлэх
          </button>
        </div>

        {/* Footer link */}
        <p className="text-center text-sm font-medium text-chadal-muted mt-8">
          Бүртгэлтэй байна уу?{" "}
          <Link to="/login" className="text-chadal-accent font-semibold underline underline-offset-4 transition-colors hover:text-white">
            Нэвтрэх
          </Link>
        </p>
      </div>
    </div>
  );
}
