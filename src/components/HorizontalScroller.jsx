import { useEffect, useRef, useState } from 'react'

// ------------------------------
// Хэвтээ гүйлгэлт (наалдсан)
// ------------------------------
// Хэсэг дэлгэцэнд наалдаж байх зуур ДООШОО гүйлгэх нь доторх замыг ХАЖУУ
// тийш гүйлгэнэ. Ингэснээр богино зайд олон картыг үзүүлэх боломжтой
// бөгөөд хөдөлгөөн нь хэрэглэгчийн үйлдэлтэй шууд холбоотой байдаг.
//
// ⚠ `animation-timeline: scroll()`-ыг СОНГООГҮЙ шалтгаан: гүйлгэх зай нь
//   картуудын БОДИТ өргөнөөс хамаарах ба тэр нь фонт, дэлгэцийн өргөнөөс
//   шалтгаалж өөрчлөгддөг. CSS-д тэр утга байхгүй тул JS-ээр хэмжинэ.
//   Хэмжилтийг зөвхөн хэмжээ өөрчлөгдөхөд хийж, гүйлгэлт бүрд хийхгүй.
// ------------------------------

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function HorizontalScroller({ children, className = '', header = null, id }) {
  const section = useRef(null)
  const viewport = useRef(null)
  const track = useRef(null)
  // Хажуу тийш гүйх ёстой зай (px). Гадна хэсгийн нэмэлт өндөр нь үүнтэй
  // тэнцүү байх тул гүйлгэлт 1:1 харьцаатай мэдрэгдэнэ.
  const [distance, setDistance] = useState(0)
  const reduced = prefersReducedMotion()

  useEffect(() => {
    if (reduced) return
    const el = track.current
    const view = viewport.current
    if (!el || !view) return

    const measure = () => {
      // ⚠ Замын ӨӨРИЙНХ нь `clientWidth`-ыг ашиглаж БОЛОХГҮЙ: зам нь `w-max`
      //   тул агуулгынхаа өргөнтэй яг тэнцдэг ба зөрүү нь ҮРГЭЛЖ 0 гарна.
      //   Харагдах хэсэгтэй нь харьцуулж байж бодит хальсан зай гарна.
      setDistance(Math.max(0, el.scrollWidth - view.clientWidth))
    }

    measure()

    // Дэлгэц эргэх, фонт ачаалагдах зэрэгт өргөн өөрчлөгдөнө.
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    observer.observe(view)
    return () => observer.disconnect()
  }, [reduced, children])

  useEffect(() => {
    if (reduced || !distance) return
    const sectionEl = section.current
    const trackEl = track.current
    if (!sectionEl || !trackEl) return

    let frame = 0

    const update = () => {
      frame = 0
      const rect = sectionEl.getBoundingClientRect()
      // Наалдалт үргэлжлэх нийт зай = хэсгийн өндөр - нэг дэлгэц
      const total = sectionEl.offsetHeight - window.innerHeight
      if (total <= 0) return
      // `-rect.top` нь хэсгийн дээд ирмэгээс хэр зөрсөн бэ
      const progress = Math.min(Math.max(-rect.top / total, 0), 1)
      trackEl.style.transform = `translate3d(${-progress * distance}px, 0, 0)`
    }

    // `scroll` эвент бүрд байрлал уншвал layout дахин тооцогдож чирэгдэнэ.
    // `requestAnimationFrame`-аар нэг фрэймд НЭГ л удаа шинэчилнэ.
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [distance, reduced])

  // Хөдөлгөөн багасгасан үед энгийн хэвтээ гүйлгэлт — хэрэглэгч өөрөө
  // хуруугаараа гүйлгэнэ.
  if (reduced) {
    return (
      <section id={id} className="py-16">
        {header}
        <div className={`overflow-x-auto ${className}`}>
          <div className="flex gap-6 pb-4">{children}</div>
        </div>
      </section>
    )
  }

  return (
    <section
      id={id}
      ref={section}
      className="relative"
      // Нэмэлт өндөр = хажуу тийш гүйх зай. Хэмжилт дуустал (distance = 0)
      // энгийн нэг дэлгэцийн өндөртэй байна.
      style={{ height: `calc(100vh + ${distance}px)` }}
    >
      <div
        ref={viewport}
        className="sticky top-0 h-screen flex flex-col justify-center gap-10 overflow-hidden"
      >
        {/* Гарчиг наалдсан хэсэгт үлдэнэ — картууд хажуу тийш гүйх зуур
            хэрэглэгч ямар хэсэгт байгаагаа алдахгүй. */}
        {header}

        {/* `w-max` нь замыг агуулгынхаа бүтэн өргөнд тэлүүлнэ — эс бөгөөс
            flex нь картуудыг дэлгэцэнд багтаахаар шахна. */}
        <div
          ref={track}
          className={`flex w-max gap-6 will-change-transform ${className}`}
        >
          {children}
        </div>
      </div>
    </section>
  )
}
