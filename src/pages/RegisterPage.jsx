import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
const bgImage = new URL('../assets/hero-bg.jpg', import.meta.url).href;

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
  Mail: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
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
  const [role, setRole] = useState("employee"); // "employee" or "worker"
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      alert("Нууц үг таарахгүй байна");
      return;
    }
    if (!agreed) {
      alert("Үйлчилгээний нөхцөлд зөвшөөрөх шаардлагатай");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      register(form.fullName, form.email, form.password, role);
      navigate(`/${role}/dashboard`);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen text-white font-sans relative overflow-hidden flex items-center justify-center p-4">
      {/* Background */}
      <div 
        className="fixed inset-0"
        style={{ 
          backgroundImage: `url(${bgImage})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          backgroundAttachment: 'fixed' 
        }}
      />
      <div className="fixed inset-0 bg-slate-950/90" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-violet-500/20">
            <Icons.Briefcase size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold mb-2">Бүртгэл Үүсгэх</h1>
          <p className="text-slate-400">МонголJob-д нэгдэж холбогдох</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10">
          {/* Role toggle */}
          <div className="flex p-1.5 rounded-xl bg-white/5 border border-white/10 mb-8">
            <button
              type="button"
              onClick={() => setRole("employee")}
              className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
                role === "employee"
                  ? "bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-xl shadow-violet-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Ажил Хайгч
            </button>
            <button
              type="button"
              onClick={() => setRole("worker")}
              className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
                role === "worker"
                  ? "bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-xl shadow-violet-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Фрилансер
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                {role === "employer" ? "Компанийн Нэр" : "Бүтэн Нэр"}
              </label>
              <div className="relative">
                <Icons.User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder={role === "employer" ? "Акмэ Корп" : "Болор Эрдэнэ"}
                  className="w-full pl-12 pr-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">И-мэйл</label>
              <div className="relative">
                <Icons.Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ta@example.com"
                  className="w-full pl-12 pr-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Нууц үг</label>
              <div className="relative">
                <Icons.Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  minLength={4}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Хамгийн багадаа 4 тэмдэгт"
                  className="w-full pl-12 pr-14 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
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
                      form.password.length >= bar * 1 ? "bg-emerald-500" : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Нууц үг баталгаажуулах</label>
              <div className="relative">
                <Icons.Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  placeholder="Нууц үгээ давтана уу"
                  className="w-full pl-12 pr-14 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showConfirm ? <Icons.EyeOff size={20} /> : <Icons.Eye size={20} />}
                </button>
              </div>
              {form.confirm && form.password !== form.confirm && (
                <p className="text-xs text-red-400 mt-2">Нууц үг таарахгүй байна</p>
              )}
              {form.confirm && form.password === form.confirm && (
                <p className="text-xs text-emerald-400 mt-2 flex items-center gap-2">
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
                className="w-5 h-5 mt-0.5 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500/50"
                required
              />
              <span className="text-sm text-slate-400 leading-relaxed">
                Би{" "}
                <button type="button" className="text-violet-400 hover:text-violet-300 font-medium">Үйлчилгээний Нөхцөлд</button>
                {" "}болон{" "}
                <button type="button" className="text-violet-400 hover:text-violet-300 font-medium">Нууцлалын Үндэслэлд</button>
                {" "}зөвшөөрч байна
              </span>
            </label>

            {/* Submit */}
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-bold text-lg hover:shadow-xl hover:shadow-violet-500/40 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Бүртгэл Үүсгэх"
              )}
              {!loading && <Icons.ArrowRight size={20} />}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">эсвэл</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Social */}
          <button className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-3">
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
        <p className="text-center text-sm text-slate-500 mt-8">
          Бүртгэлтэй байна уу?{" "}
          <Link to="/login" className="text-violet-400 hover:text-violet-300 font-bold transition-colors">
            Нэвтрэх
          </Link>
        </p>
      </div>
    </div>
  );
}
