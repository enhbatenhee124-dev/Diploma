// ------------------------------
// Амьд дэвсгэр
// ------------------------------
// Гурван давхарга:
//   1. Гэрэлтэх толбууд (aurora) — аажим хөвж, бие биедээ уусна
//   2. Техникийн сүлжээ — тасралтгүй гүйж, гүн мэдрэмж өгнө
//   3. Захын харанхуйлалт — төв рүү анхаарлыг чиглүүлж, текстийг уншигдахуйц
//      болгоно
//
// ⚠ Бүхэлдээ CSS-ээр хийсэн нь САНААТАЙ. JS-ээр фрэйм бүрд зурвал (canvas,
//   requestAnimationFrame) утасны батарей идэж, гүйлгэлт чирэгдэнэ. Энд
//   зөвхөн `transform` хөдөлдөг тул хөтөч давхаргуудыг НЭГ удаа зураад
//   зөвхөн композит хийнэ.
//
// Загварууд: index.css → «АМЬД ДЭВСГЭР» хэсэг.
// ------------------------------

// Хөвөгч бөөмс. Утгуудыг МОДУЛЬ ачаалагдах үед нэг л удаа тооцно —
// `Math.random()`-ыг дүрслэх үед дуудвал дахин зурагдах бүрд бөөм бүр
// байрлалаа сольж, хөдөлгөөн нь тасалдана.
//
// Тархалт нь ЖИГД биш, санамсаргүй байх ёстой: жигд байвал хүн шууд «сүлжээ»
// гэж таньж, зохиомол мэт мэдрэгдэнэ.
const PARTICLES = Array.from({ length: 22 }, (_, i) => {
  // Детерминистик псевдо-санамсаргүй — индексээс тооцох тул дахин ачаалахад
  // ижил хэвээр, гэхдээ нүдэнд эмх замбараагүй харагдана.
  const rand = n => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1
  return {
    left: rand(1) * 100,
    size: 1.5 + rand(2) * 2.5,
    duration: 16 + rand(3) * 22,
    delay: -rand(4) * 30,   // сөрөг саатал — хуудас нээгмэгц дунд нь орсон байна
    drift: (rand(5) - 0.5) * 140,
    opacity: 0.15 + rand(6) * 0.35,
  }
})

export default function AnimatedBackground({ image }) {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Суурь өнгө — бүх давхарга ачаалагдтал цагаан анивчихаас сэргийлнэ */}
      <div className="absolute inset-0 bg-slate-950" />

      {/* Гэрэл зураг маш бүдэг үлдэнэ — бүтэц өгөх төдий.
          `parallax-bg` нь гүйлгэлтийн явцтай холбогдсон хөнгөн хөдөлгөөн. */}
      {image && (
        <div
          className="absolute inset-0 parallax-bg opacity-[0.13]"
          style={{
            backgroundImage: `url(${image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      {/* Хөвөгч гэрлийн толбууд */}
      <span className="aurora aurora-1" />
      <span className="aurora aurora-2" />
      <span className="aurora aurora-3" />

      {/* Гүйх сүлжээ */}
      <div className="bg-grid" />

      {/* Дээшээ хөвөх бөөмс — гүйлгэхгүй зогсож байсан ч агаар хөдөлж
          байгаа мэт мэдрэмж өгнө. */}
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="particle"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            '--drift': `${p.drift}px`,
          }}
        />
      ))}

      {/* Захын харанхуйлалт */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,transparent_35%,rgba(2,6,23,0.75)_100%)]" />
    </div>
  )
}
