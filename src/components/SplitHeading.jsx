import { useEffect, useRef } from 'react'

// ------------------------------
// Үсэг бүрээрээ угсрагдах гарчиг
// ------------------------------
// Бүхэл гарчгийг нэг дор бүдгэрүүлэхийн оронд үсэг тус бүрийг богино
// зөрүүтэйгээр оруулж ирнэ. Уншигчийн нүдийг зүүнээс баруун тийш дагуулж,
// гарчиг «бичигдэж» байгаа мэт мэдрэмж өгнө.
//
// ⚠ `animejs`-ийг МОДУЛИЙН ТҮВШИНД импортлоогүй нь санаатай. Энэ компонент
//   нүүр хуудсанд шууд (lazy бус) хэрэглэгддэг тул тэгвэл ~21KB-ын anime
//   багц бүх дүрийн эхний ачаалалтад орно. Динамик импорт нь гарчгийг
//   ШУУД дүрсэлж, номын санг зөвхөн анимац эхлэхийн өмнө татна.
//
//   `lazy()` + `Suspense` ашиглаагүй шалтгаан: тэр тохиолдолд гарчиг
//   татагдтал хоосон байх бөгөөд агуулга үсэрч, SEO-д ч муу.
// ------------------------------

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function SplitHeading({
  children,
  as: Tag = 'h2',
  className = '',
  step = 18,
  ...rest
}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return

    let cancelled = false
    let cleanup = null

    import('animejs').then(({ animate, splitText, stagger }) => {
      // Импорт дуустал компонент задарсан байж болно.
      if (cancelled || !ref.current) return

      // `splitText` нь DOM-ыг өөрчилж, үсэг бүрийг <span> болгоно.
      // `accessible: true` нь эх текстийг `aria-label`-д хадгалдаг тул
      // дэлгэц уншигч 40 тусдаа үсэг биш, БҮТЭН өгүүлбэр уншина.
      const splitter = splitText(el, { chars: true, accessible: true })

      // ⚠ Градиент бүхий үгсийг ЗАСАХ ёстой. `bg-clip-text` нь эцэг span
      //   дээр байдаг ч үсэг бүр `transform` авмагц өөрийн зурах давхарга
      //   үүсгэж, эцгийнхээ клиплэсэн дэвсгэрийг ЗУРАХАА БОЛИНО — үр дүнд
      //   тэр үгс бүрмөсөн алга болно (өнгө нь `transparent` тул).
      //
      //   Тиймээс градиентийг үсэг бүрд ӨӨРТ нь өгч, `background-size`-ыг
      //   эцгийн өргөнөөр, `background-position`-ыг үсгийн байрлалаар
      //   тохируулна. Ингэснээр үсэг бүр градиентийн ЯГ өөрт нь ногдох
      //   хэсгийг харуулж, бүхэлдээ тасралтгүй харагдана.
      //
      //   Хэмжилтийг анимац үүсгэхээс ӨМНӨ хийнэ — эс бөгөөс шилжсэн
      //   байрлалыг уншина.
      el.querySelectorAll('*').forEach(node => {
        const cs = getComputedStyle(node)
        const clipsToText = cs.webkitBackgroundClip === 'text' || cs.backgroundClip === 'text'
        if (!clipsToText || cs.backgroundImage === 'none') return

        const parentBox = node.getBoundingClientRect()
        node.querySelectorAll('span').forEach(charEl => {
          const box = charEl.getBoundingClientRect()
          charEl.style.backgroundImage = cs.backgroundImage
          charEl.style.backgroundSize = `${parentBox.width}px ${parentBox.height}px`
          charEl.style.backgroundPosition = `${parentBox.left - box.left}px ${parentBox.top - box.top}px`
          charEl.style.webkitBackgroundClip = 'text'
          charEl.style.backgroundClip = 'text'
          charEl.style.color = 'transparent'
        })
      })

      const animation = animate(splitter.chars, {
        opacity: [0, 1],
        translateY: [26, 0],
        // Богино эргэлт нь үсгүүдийг «унаж тогтож» байгаа мэт болгоно
        rotateZ: [-8, 0],
        duration: 700,
        delay: stagger(step),
        ease: 'out(3)',
        // Гүйлгэлтэд НААХГҮЙ — зөвхөн нэг удаа эхлүүлнэ. Гарчиг өөрийн
        // хэмнэлээр угсрах нь илүү уншигдахуйц.
        autoplay: false,
      })

      // ⚠ anime.js-ийн `onScroll`-ыг ЭНД ашиглаж БОЛОХГҮЙ: тэр нь элементийн
      //   СТАТИК байрлалаар босгоо тооцдог. Энэ гарчиг `position: sticky`
      //   хэсэг дотор байх үед дэлгэцэнд наалдаж ХАРАГДАЖ байхад статик
      //   байрлал нь аль хэдийн дээгүүр өнгөрсөн байдаг тул анимац
      //   тоглохгүй, гарчиг үл үзэгдэх хэвээр үлдэнэ.
      //
      //   `IntersectionObserver` нь БОДИТ харагдах байдлыг хэмждэг тул
      //   sticky, transform аль алинд нь зөв ажиллана.
      const io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return
          animation.play()
          io.disconnect()
        },
        { rootMargin: '0px 0px -8% 0px' },
      )
      io.observe(el)

      cleanup = () => {
        io.disconnect()
        animation.revert()
        splitter.revert()
      }
    })

    return () => {
      cancelled = true
      if (cleanup) cleanup()
    }
  }, [step, children])

  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  )
}
