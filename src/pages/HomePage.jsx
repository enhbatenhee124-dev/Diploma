import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
const bgImage = new URL('../assets/hero-bg.jpg', import.meta.url).href;

// Inline SVG icons
const Icons = {
  Briefcase: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  Search: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
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
  Phone: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  MapPin: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Coffee: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  ),
  GraduationCap: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v3c0 2.21 3.58 4 8 4s8-1.79 8-4v-3" />
    </svg>
  ),
  Truck: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  ShoppingBag: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  Laptop: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="2" y1="21" x2="22" y2="21" />
    </svg>
  ),
  Calendar: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Send: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  ArrowRight: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  TrendingUp: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  Globe: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  Zap: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Users: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Target: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  CheckCircle: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Check: ({ className = "", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

export default function HomePage() {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Track mouse position globally
  React.useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  const categories = [
    { 
      title: "Кафе ба Ресторан", 
      desc: "Бариста, үйлчлэгч, хоолны өрөөний ажилтан, хослолч", 
      color: "from-orange-500/20 to-orange-600/20", 
      hoverGradient: "rgba(249, 115, 22, 0.3)",
      iconColor: "text-orange-400",
      icon: <Icons.Coffee className="text-orange-400" size={28} />
    },
    { 
      title: "Багш ба Номлогч", 
      desc: "Хувийн багш, хэлний багш, STEM зөвлөгч", 
      color: "from-violet-500/20 to-violet-600/20", 
      hoverGradient: "rgba(139, 92, 246, 0.3)",
      iconColor: "text-violet-400",
      icon: <Icons.GraduationCap className="text-violet-400" size={28} />
    },
    { 
      title: "Хүргэлт ба Логистик", 
      desc: "Хоолны хүргэлт, курьер үйлчилгээ, агуулахын тусламж", 
      color: "from-emerald-500/20 to-emerald-600/20", 
      hoverGradient: "rgba(16, 185, 129, 0.3)",
      iconColor: "text-emerald-400",
      icon: <Icons.Truck className="text-emerald-400" size={28} />
    },
    { 
      title: "Борлуулалт ба Захиалга", 
      desc: "Дэлгүүрийн туслах, кассир, брэндийн дэмжигч", 
      color: "from-pink-500/20 to-pink-600/20", 
      hoverGradient: "rgba(236, 72, 153, 0.3)",
      iconColor: "text-pink-400",
      icon: <Icons.ShoppingBag className="text-pink-400" size={28} />
    },
    { 
      title: "Фриланс ба Алсаас", 
      desc: "Дизайн, бичих, кодлогч, виртуал туслах", 
      color: "from-blue-500/20 to-blue-600/20", 
      hoverGradient: "rgba(59, 130, 246, 0.3)",
      iconColor: "text-blue-400",
      icon: <Icons.Laptop className="text-blue-400" size={28} />
    },
    { 
      title: "Үзэсгэлэнт Ажил", 
      desc: "Дэмжигч, удирдагч, засварын ажилтан, брэндийн төлөөлөгч", 
      color: "from-cyan-500/20 to-cyan-600/20", 
      hoverGradient: "rgba(6, 182, 212, 0.3)",
      iconColor: "text-cyan-400",
      icon: <Icons.Calendar className="text-cyan-400" size={28} />
    },
  ];

  const stats = [
    { 
      value: "45,200+", 
      label: "Идэвхит Оюутан Ажил хайгч", 
      desc: "Одоогоор Монгол дахь цагийн ажил хайж байгаа", 
      color: "from-violet-500 to-indigo-500",
      hoverGradient: "rgba(139, 92, 246, 0.3)"
    },
    { 
      value: "68%", 
      label: "Цагийн Ажилд Оруулсан Оюутнууд", 
      desc: "Дээд их сургуулийн оюутнууд ажил болон сургалтыг харилцуулж байна", 
      color: "from-pink-500 to-rose-500",
      hoverGradient: "rgba(236, 72, 153, 0.3)"
    },
    { 
      value: "32%", 
      label: "Жилийн Өсөлт", 
      desc: "2025 онд цагийн ажлын зарлалын нэмэгдэл", 
      color: "from-cyan-500 to-blue-500",
      hoverGradient: "rgba(6, 182, 212, 0.3)"
    },
    { 
      value: "4.2K", 
      label: "Сарын Тохиролцоо", 
      desc: "Туршилттай ажил олгогдох бүх сар", 
      color: "from-indigo-500 to-violet-500",
      hoverGradient: "rgba(99, 102, 241, 0.3)"
    },
  ];

  const demandData = [
    { category: "Кафе ба Ресторан", percent: 28, color: "bg-orange-500" },
    { category: "Багш", percent: 22, color: "bg-violet-500" },
    { category: "Хүргэлт", percent: 18, color: "bg-emerald-500" },
    { category: "Борлуулалт", percent: 15, color: "bg-pink-500" },
    { category: "Фриланс", percent: 12, color: "bg-blue-500" },
    { category: "Үзэсгэлэн", percent: 5, color: "bg-cyan-500" },
  ];

  return (
    <div className="min-h-screen text-white font-sans relative overflow-hidden">
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

      <div className="relative z-10">
        {/* Navbar */}
        <nav className="sticky top-0 z-50 bg-slate-950/60 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Icons.Briefcase size={26} className="text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">
                Mongol<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Job</span>
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <button className="text-slate-300 hover:text-white transition-colors font-medium">Нүүр</button>
              <button className="text-slate-300 hover:text-white transition-colors font-medium">Ажил олгогчид</button>
              <button className="text-slate-300 hover:text-white transition-colors font-medium">Алдартай Ажил</button>
              <button className="text-slate-300 hover:text-white transition-colors font-medium">Статистик</button>
              <button className="text-slate-300 hover:text-white transition-colors font-medium">Холбоо барих</button>
            </div>

            <div className="flex items-center gap-4">
              <Link to="/login" className="hidden sm:block px-4 py-2 text-slate-300 hover:text-white transition-colors font-medium">
                Нэвтрэх
              </Link>
              <Link to="/register" className="px-6 py-3 rounded-full bg-gradient-to-r from-violet-600 to-violet-500 text-white font-bold hover:shadow-xl hover:shadow-violet-500/30 transition-all transform hover:scale-105 active:scale-95">
                Эхлэх
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-sm text-slate-300">#1 Монголын Ажил Тохиргох Платформ</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
              Холбогдох. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400">
                Ажиллах.
              </span> <br />
              Өсөх.
            </h1>
            <p className="text-xl text-slate-400 mb-4 leading-relaxed">
              Монгол дахь цагийн ажилчин, оюутнуудыг ажил олгогчтой холбосон тэргүүн платформ. 
              Таны цагтаа тохирсон хязгааргүй ажил олж эсвэл минутын дотор урлагтай ажилтан ол.
            </p>
            <p className="text-slate-500 mb-10 max-w-2xl mx-auto">
              Хэрэв та анхны ажлыг хайж буй оюутан, нэмэгдэлтэй орлого хайж буй мэргэжилтэн эсвэл 
              хязгааргүй ажилчдыг байгуулж буй ажил олгогч бол — MongolJob энэ бүгдийг хялбар, хурдан, найдвартай хийнэ.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button 
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto px-10 py-4 rounded-full bg-gradient-to-r from-violet-600 to-violet-500 text-white font-bold text-lg hover:shadow-xl hover:shadow-violet-500/40 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
              >
                <Icons.Search size={24} />
                Ажил Олох
              </button>
              <button 
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto px-10 py-4 rounded-full bg-white/5 border border-white/10 text-white font-bold text-lg hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-3"
              >
                <Icons.Briefcase size={24} />
                Ажил Зарлах
              </button>
            </div>

            {/* Hero Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              {[
                { value: "12K+", label: "Идэвхит Ажил Хайгч" },
                { value: "3.5K+", label: "Зарлагдсан Ажил" },
                { value: "850+", label: "Ажил Олгогч" },
                { value: "95%", label: "Тохиргооны Хувь" },
              ].map((stat, i) => (
                <div 
                  key={i} 
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all"
                >
                  <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Jobs Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-4">
              Алдартай <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Цагийн Ажил</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Монгол дахь хамгийн их хүссэн цагийн ажлуудыг олж мэдээрэй. Ангилалаар хайж, урлаг, цагаа тохирсон ажил олоорой.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => {
              const [localMouse, setLocalMouse] = useState({ x: 50, y: 50 });
              
              const handleCardMouseMove = (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setLocalMouse({
                  x: ((e.clientX - rect.left) / rect.width) * 100,
                  y: ((e.clientY - rect.top) / rect.height) * 100
                });
              };

              return (
                <div 
                  key={index}
                  onMouseMove={handleCardMouseMove}
                  className="group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:border-violet-500/30 transition-all cursor-pointer"
                >
                  {/* Dynamic gradient overlay that follows cursor */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at ${localMouse.x}% ${localMouse.y}%, ${category.hoverGradient || 'rgba(139, 92, 246, 0.3)'} 0%, transparent 60%)`,
                    }}
                  />
                  
                  <div className="relative z-10">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      {category.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-3 group-hover:text-violet-300 transition-colors">
                      {category.title}
                    </h3>
                    <p className="text-slate-400 mb-6">
                      {category.desc}
                    </p>
                    <div className="flex items-center gap-2 text-violet-400 font-semibold group-hover:text-violet-300 transition-colors">
                      Ажлыг Хайх
                      <Icons.ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* For Employers Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
              <span className="text-violet-300 font-medium text-sm">Ажил Олгогчид</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-4">
              Ухаалаг Ажил Олгох. <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Хурдан.</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Кофееноос эхлээд Стартап хүртэл, олон Монгол ажил олгогч найдвартай цагийн ажилтан олохдоо MongolJob-ийг итгэдэг. Өөрийн ажлыг зарлаж, өнөөдөрөөс эхлэн хүсэлт хүлээн аваарай.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { 
                title: "Минутын Дотор Зарлах", 
                desc: "Манай энхрий зааварчилсаны ар ажлын зарлагыг үүсгэн, нийтлэх. Нарийн тохиргоо шаарддаггүй.", 
                icon: <Icons.Zap size={28} />,
                hoverGradient: "rgba(139, 92, 246, 0.3)"
              },
              { 
                title: "Эрчимтэй Ажилтанд Хүрэх", 
                desc: "Эргэлзээгүй оюутан, цагийн ажилчдын сонгосон бүлэгт нэвтрэх. Эдгээр нь ажлаа хайж байгаа.", 
                icon: <Icons.Users size={28} />,
                hoverGradient: "rgba(6, 182, 212, 0.3)"
              },
              { 
                title: "Ухаалаг Тохиргоо", 
                desc: "Манай алгоритм таны шаардлагад нийцсэн урлаг, цагтай ажилтанд холбосон.", 
                icon: <Icons.Target size={28} />,
                hoverGradient: "rgba(236, 72, 153, 0.3)"
              },
              { 
                title: "Эргэлзээгүй Профайл", 
                desc: "Бүх ажил хайгч баталгаажсан, та найдвартай, жинхэнэ ажилтантай холбогдох боломжтой.", 
                icon: <Icons.CheckCircle size={28} />,
                hoverGradient: "rgba(16, 185, 129, 0.3)"
              },
            ].map((feature, index) => {
              const [localMouse, setLocalMouse] = useState({ x: 50, y: 50 });
              
              const handleCardMouseMove = (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setLocalMouse({
                  x: ((e.clientX - rect.left) / rect.width) * 100,
                  y: ((e.clientY - rect.top) / rect.height) * 100
                });
              };

              return (
                <div 
                  key={index} 
                  onMouseMove={handleCardMouseMove}
                  className="group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:border-violet-500/30 transition-all"
                >
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at ${localMouse.x}% ${localMouse.y}%, ${feature.hoverGradient} 0%, transparent 60%)`,
                    }}
                  />

                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center mb-6 text-violet-400 group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-white group-hover:text-violet-300 transition-colors">{feature.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA Block */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4 text-white">Дараагийн сайн ажилтан олох бэлэн байна уу?</h3>
              <p className="text-slate-400 mb-6">Аль хэт 850-аас олон ажил олгогч MongolJob-ийг ашиглаж байгаа. Хязгааргүй ажлыг зарлах, хүсэлтийг удирдах, ажилтантай холбоо барих — бүгдийг нэг дор.</p>
              <ul className="space-y-3 mb-8">
                {[
                  "Анхны ажлыг үнэгүй зарлах",
                  "Хүсэлттэй шууд мессеж",
                  "Хүсэлт засах самбар",
                  "Эрхэм дэмжлэг"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <Icons.Check size={14} className="text-cyan-400" />
                    </div>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => navigate('/register')}
                className="px-8 py-4 rounded-full bg-gradient-to-r from-violet-600 to-violet-500 text-white font-bold text-lg hover:shadow-xl hover:shadow-violet-500/40 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
              >
                <Icons.Briefcase size={22} />
                Ажил Зарлах — Үнэгүй
              </button>
            </div>

            {/* Example Job Listings */}
            <div className="relative">
              {/* Decorative background */}
              <div className="absolute -top-4 -right-4 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl" />
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 relative z-10">
                {/* Example company */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500" />
                  <div>
                    <h4 className="font-bold text-white">TechStart Mongolia</h4>
                    <p className="text-xs text-slate-500">2 цагийн өмнө зарлагдсан</p>
                  </div>
                </div>

                {/* Example job 1 */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-sm text-white">Цагийн UI Дизайнер</h5>
                    <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-xs font-medium text-cyan-400 border border-cyan-500/20">24 хүсэлт</span>
                  </div>
                  <div className="text-xs text-slate-500">Улаанбаатар • Алсаас OK</div>
                </div>

                {/* Example job 2 */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-sm text-white">Амар Наасны Маркетинг Туслах</h5>
                    <span className="px-3 py-1 rounded-full bg-violet-500/10 text-xs font-medium text-violet-400 border border-violet-500/20">18 хүсэлт</span>
                  </div>
                  <div className="text-xs text-slate-500">Улаанбаатар • Дэлгэрэнгүй</div>
                </div>

                {/* Example job 3 */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-sm text-white">Хүргэлтийн Хамтран</h5>
                    <span className="px-3 py-1 rounded-full bg-pink-500/10 text-xs font-medium text-pink-400 border border-pink-500/20">31 хүсэлт</span>
                  </div>
                  <div className="text-xs text-slate-500">Олон хот</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
              <span className="text-violet-300 font-medium text-sm">Мэдээлэл ба Үзүүлэлт</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-4">
              Монголын <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Оюутны Ажлын Зах</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Манай платформын бодит тоо нь Монгол оюутан, залуу мэргэжилтнуудын хязгааргүй ажилд эрчимтэй хүрэлцэх үүдийг харуулж байна.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {stats.map((stat, i) => {
              const [localMouse, setLocalMouse] = useState({ x: 50, y: 50 });
              
              const handleCardMouseMove = (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setLocalMouse({
                  x: ((e.clientX - rect.left) / rect.width) * 100,
                  y: ((e.clientY - rect.top) / rect.height) * 100
                });
              };

              return (
                <div 
                  key={i}
                  onMouseMove={handleCardMouseMove}
                  className="group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center hover:border-violet-500/30 transition-all"
                >
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at ${localMouse.x}% ${localMouse.y}%, ${stat.hoverGradient} 0%, transparent 60%)`,
                    }}
                  />

                  <div className="relative z-10">
                    <div className={`text-5xl font-extrabold mb-3 text-transparent bg-clip-text bg-gradient-to-r ${stat.color} group-hover:scale-105 transition-transform`}>
                      {stat.value}
                    </div>
                    <div className="text-lg font-bold text-white mb-2">{stat.label}</div>
                    <div className="text-slate-500 text-sm">{stat.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chart Section */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-3">Хамгийн Их Хүссэн Ажлын Ангилал</h3>
                <p className="text-slate-400 mb-8">2025 онд ангиллаар цагийн ажлын зарлалын түгээлт</p>
                
                <div className="space-y-5">
                  {demandData.map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-slate-200">{item.category}</span>
                        <span className="font-bold text-white">{item.percent}%</span>
                      </div>
                      <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Icons.TrendingUp className="text-cyan-400" size={24} />
                  <h4 className="text-xl font-bold">Өсөлтийн Урсгал: Ажлын Зарлал</h4>
                </div>
                <div className="flex items-end justify-between gap-3 h-48 pt-8">
                  {[60, 75, 65, 85, 78, 90, 100].map((height, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div 
                        className="w-full bg-gradient-to-t from-violet-600 to-violet-400 rounded-t-lg transition-all"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-xs text-slate-500">
                        {['1-р сар', '2-р сар', '3-р сар', '4-р сар', '5-р сар', '6-р сар', '7-р сар'][i]}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-between items-center pt-4 border-t border-white/5">
                  <span className="text-slate-400">Нийт өсөлт</span>
                  <span className="text-xl font-bold text-cyan-400">+73%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
              <span className="text-cyan-300 font-medium text-sm">Холбоо барих</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Мантай</span> Холбогдоорой
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Ажил зарлах эсвэл ажил олох талаар асуулт байна уу? Манай баг тусламж хийхийн тулд энд байна.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                <h3 className="text-xl font-bold mb-6">Холбоо барих мэдээлэл</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <Icons.Mail className="text-violet-400" size={24} />
                    </div>
                    <div>
                      <div className="font-medium mb-1">И-мэйл</div>
                      <div className="text-slate-400">hello@mongoljob.mn</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <Icons.Phone className="text-violet-400" size={24} />
                    </div>
                    <div>
                      <div className="font-medium mb-1">Утас</div>
                      <div className="text-slate-400">+976 9911-2233</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <Icons.MapPin className="text-violet-400" size={24} />
                    </div>
                    <div>
                      <div className="font-medium mb-1">Офис</div>
                      <div className="text-slate-400">Чингисын Чөлөө 15, Сүхбаатар дүүрэг<br />Улаанбаатар 14250, Монгол</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                <h3 className="text-xl font-bold mb-6">Дагах</h3>
                <div className="flex gap-3">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-violet-500/30 transition-all cursor-pointer">
                      <Icons.Globe className="text-slate-400" size={20} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="md:col-span-3">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10">
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-slate-300 font-medium mb-2">Бүтэн Нэр</label>
                      <input 
                        type="text" 
                        placeholder="Таны нэр" 
                        className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-2">И-мэйл</label>
                      <input 
                        type="email" 
                        placeholder="ta@example.com" 
                        className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-slate-300 font-medium mb-2">Мессеж</label>
                    <textarea 
                      placeholder="Бид таныг хэрхэн тусалж вэ?" 
                      rows={5}
                      className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all resize-none"
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    className="w-full md:w-auto px-10 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-bold text-lg hover:shadow-xl hover:shadow-violet-500/40 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                  >
                    <Icons.Send size={22} />
                    Мессеж Илгээх
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
