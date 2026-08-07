import { Children, cloneElement, isValidElement, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

// ------------------------------
// Хөдөлгөөний нийтлэг компонентууд
// ------------------------------
// Анимацыг хуудас бүрт гараар бичих нь хэмнэл нь зөрөх, хөдөлгөөн багасгах
// тохиргоог мартах эрсдэлтэй. Тиймээс дахин давтагддаг 5 хэв маягийг энд
// цуглуулав:
//
//   Reveal        — гүйлгэж ирэхэд гарч ирнэ
//   Stagger       — хүүхэд элементүүд дараалан гарна
//   CountUp       — тоо 0-оос эхлэн өснө
//   PageTransition — маршрут солигдоход агуулга зөөлөн солигдоно
//   SpotlightCard — хулганы араас гэрэл дагадаг карт
//
// Бүгд `prefers-reduced-motion`-ыг хүндэтгэнэ: тухайн тохиргоотой
// хэрэглэгчид анимац алгасаж ЭЦСИЙН төлөвөө шууд харна (агуулга нь
// хэзээ ч нуугдаж үлдэхгүй).
// ------------------------------

/** Хэрэглэгч хөдөлгөөн багасгахыг хүссэн эсэх. */
function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Элемент дэлгэцэнд орж ирэхэд анимацаа тоглуулна.
 *
 * `IntersectionObserver` нь гүйлгэлт бүрт JS ажиллуулахгүй — хөтөч өөрөө
 * ажиглаад мэдэгддэг тул урт нүүр хуудсанд ч гүйлгэлт гөлгөр хэвээр байна.
 *
 * @param {string} animation  Харагдах үед өгөх Tailwind анимацын класс
 * @param {number} delay      Саатал (мс) — хөрш элементүүдийг давхарлахад
 * @param {boolean} once      Нэг л удаа тоглуулах уу (анхдагчаар тийм)
 */
export function Reveal({
  children,
  as: Tag = 'div',
  className = '',
  animation = 'animate-fade-up',
  delay = 0,
  once = true,
  threshold = 0.15,
  style,
  ...rest
}) {
  const ref = useRef(null)
  // Хөдөлгөөн багасгасан үед шууд харагдсан гэж эхэлнэ — ажиглагч ч
  // үүсгэхгүй, анимац ч тоглохгүй.
  const [visible, setVisible] = useState(() => prefersReducedMotion())

  useEffect(() => {
    const el = ref.current
    if (!el || visible) return

    // ⚠ АЮУЛГҮЙН ХАМГААЛАЛТ: харагдах хүртэл агуулга `opacity-0` байдаг тул
    //   ажиглагч ямар нэг шалтгаанаар ажиллахгүй бол текст МӨНХӨД алга болно.
    //   Тиймээс хоёр тохиолдолд ажиглагч хүлээхгүй шууд харуулна:
    //     • хөтөч `IntersectionObserver`-ыг дэмждэггүй (хуучин хөтөч)
    //     • элемент АЛЬ ХЭДИЙН дэлгэцэнд байгаа (эхний дэлгэцийн агуулга)
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    // `once=false` үед элемент гарах/орохыг ҮРГЭЛЖ ажиглах ёстой тул энэ
    // товчлолыг алгасана — эс бөгөөс ажиглагч огт үүсэхгүй.
    if (once) {
      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setVisible(true)
        return
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setVisible(false)
        }
      },
      // Доод ирмэгээс 10% өмнө эхлүүлнэ — хэрэглэгч тултал хүлээхгүй.
      { threshold, rootMargin: '0px 0px -10% 0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [once, threshold, visible])

  return (
    <Tag
      ref={ref}
      // Харагдахаас ӨМНӨ тунгалаг байлгана. Анимац нь `both` fill-тэй тул
      // класс нэмэгдмэгц эхний фрэймээс зөв төлөвөөс эхэлнэ.
      className={`${visible ? animation : 'opacity-0'} ${className}`}
      // Дуудагчийн өгсөн style-ыг ХАДГАЛНА — багана диаграмын өндөр, зурвасын
      // өргөн зэрэг нь энэ замаар ирдэг тул дарж бичвэл график алга болно.
      style={visible && delay ? { ...style, animationDelay: `${delay}ms` } : style}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/**
 * Хүүхэд элементүүдэд дараалсан саатал өгнө.
 *
 * CSS-ийн `.stagger` класс нь `nth-child`-аар ижил зүйлийг хийдэг ч
 * саатлын алхмыг нь тааруулж болдоггүй. Энэ хувилбар нь алхам, дээд
 * хязгаарыг нь удирдах боломж өгнө.
 *
 * ⚠ Хүүхэд бүр дээр `animate-*` класс байх ёстой — эс бөгөөс саатал
 *   тоглох анимацгүй болж, юу ч болохгүй.
 */
export function Stagger({
  children,
  as: Tag = 'div',
  className = '',
  step = 55,
  initial = 0,
  // Урт жагсаалтын сүүл хэтэрхий удаж гарахаас сэргийлж саатлыг тогтооно.
  max = 10,
  ...rest
}) {
  const reduced = prefersReducedMotion()

  return (
    <Tag className={className} {...rest}>
      {Children.map(children, (child, i) => {
        if (!isValidElement(child) || reduced) return child
        return cloneElement(child, {
          style: {
            ...child.props.style,
            animationDelay: `${initial + Math.min(i, max) * step}ms`,
          },
        })
      })}
    </Tag>
  )
}

/**
 * Тоог 0-оос эхлүүлж зорилтот утга хүртэл өсгөнө.
 *
 * `requestAnimationFrame` ашигласан тул хөтчийн дүрслэх хэмнэлтэй яг
 * таарна — `setInterval` шиг үсэрч чичрэхгүй.
 */
export function CountUp({
  value = 0,
  duration = 900,
  format = n => n.toLocaleString('mn-MN'),
  className = '',
}) {
  const target = Number(value) || 0
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? target : 0))

  useEffect(() => {
    if (prefersReducedMotion()) {
      setShown(target)
      return
    }

    let frame
    const start = performance.now()

    const tick = now => {
      const t = Math.min((now - start) / duration, 1)
      // Эхэндээ хурдан, төгсгөлдөө удаашрах муруй — тоо «зогсож» буй мэт
      // байгалийн мэдрэмж өгнө.
      const eased = 1 - Math.pow(1 - t, 3)
      setShown(Math.round(target * eased))
      if (t < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return <span className={className}>{format(shown)}</span>
}

/**
 * Форматтай тоог задалж, харагдмагц 0-оос эхлэн тоолно.
 *
 * `CountUp`-аас ялгаатай нь: (1) энэ нь ХАРАГДАХ үед л эхэлдэг тул хуудсын
 * доод хэсгийн тоо хэрэглэгч хүрэхээс өмнө дуусчихдаггүй; (2) «45,200+»,
 * «4.2K», «68%» гэх мэт ТЕКСТ хүлээж авдаг.
 *
 * Мөрийг тоо + дагавар болгон хуваана:
 *   "45,200+" → 45200 ба "+"      "4.2K" → 4.2 ба "K"      "68%" → 68 ба "%"
 */
export function StatCounter({ value, duration = 1400, className = '' }) {
  const ref = useRef(null)
  const text = String(value)

  // Эхний тоон хэсгийг тасалж авна. Таарахгүй бол (жишээ нь "—") анимац
  // хийхгүй, эх мөрийг хэвээр харуулна.
  const match = text.match(/^([\d.,]+)(.*)$/)
  const raw = match ? match[1] : null
  const suffix = match ? match[2] : ''
  const target = raw ? Number(raw.replace(/,/g, '')) : null
  // Бутархай орон — "4.2K" нь 4.2 хэвээр тоологдох ёстой, 4 болж мохохгүй
  const decimals = raw && raw.includes('.') ? raw.split('.')[1].length : 0
  // Мянгатын таслал ЭХ мөрөнд байсан бол л хадгална
  const grouped = Boolean(raw && raw.includes(','))

  const [shown, setShown] = useState(() =>
    target === null || prefersReducedMotion() ? null : 0,
  )

  useEffect(() => {
    const el = ref.current
    if (!el || target === null || prefersReducedMotion()) return

    let frame = 0
    let started = false

    const run = () => {
      const start = performance.now()
      const tick = now => {
        const t = Math.min((now - start) / duration, 1)
        // Эхэндээ хурдан, төгсгөлдөө удаашрах — тоо «зогсож» буй мэт мэдрэгдэнэ
        const eased = 1 - Math.pow(1 - t, 3)
        setShown(target * eased)
        if (t < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started) return
        started = true
        observer.disconnect()
        run()
      },
      { threshold: 0.4 },
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      if (frame) cancelAnimationFrame(frame)
    }
  }, [target, duration])

  // Анимацлах боломжгүй (тоо олдоогүй) эсвэл хөдөлгөөн багасгасан бол
  // эх мөрийг шууд харуулна.
  if (shown === null) return <span className={className}>{text}</span>

  const formatted = shown.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: grouped,
  })

  return (
    <span ref={ref} className={className}>
      {formatted}{suffix}
    </span>
  )
}

/**
 * Маршрут солигдоход агуулгыг зөөлөн оруулж ирнэ.
 *
 * ⚠ `key={pathname}` ашиглаагүй нь САНААТАЙ: тэр нь дотоод хуудсыг бүхэлд
 *   нь дахин холбож (remount), өгөгдлийг дахин татахад хүргэнэ. Оронд нь
 *   зөвхөн БҮРХҮҮЛ дээрх классыг авч хаяад дахин нэмнэ — reflow хүчлэх нь
 *   CSS анимацыг эхнээс нь дахин тоглуулах стандарт арга.
 */
export function PageTransition({ children, className = '' }) {
  const { pathname } = useLocation()
  const ref = useRef(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return

    // Хөтөч өөрөө View Transition хийж байвал энэ анимацыг алгасана —
    // хоёулаа зэрэг ажиллавал хуудас морфлож БАЙХ зуураа доороос дахин
    // гарч ирж, эвгүй харагдана.
    if (document.documentElement.dataset.viewTransition) return

    el.classList.remove('page-in')
    void el.offsetWidth // reflow — үүнгүй бол хөтөч ангиллын өөрчлөлтийг нэгтгэж, анимац дахин эхлэхгүй
    el.classList.add('page-in')
  }, [pathname])

  return (
    <div ref={ref} className={`page-in ${className}`}>
      {children}
    </div>
  )
}

/**
 * Хулганыг дагаж 3 хэмжээст НАЛДАГ, гэрэлтдэг карт.
 *
 * Хоёр зүйлийг зэрэг хийнэ:
 *   • курсорын байрлалд гэрэл асна
 *   • карт курсор руу бага зэрэг эргэж, гүн мэдрэмж өгнө
 *
 * ⚠ Байрлалыг React-ийн ТӨЛӨВӨӨР хадгалдаггүй нь санаатай. Өмнө нь
 *   `useState` ашигласнаар хулгана хөдлөх бүрд (секундэд ~60 удаа) карт
 *   бүхэлдээ дахин зурагдаж байв. Одоо утгыг CSS хувьсагч болон `transform`
 *   руу ШУУД бичих тул React огт оролцохгүй, зөвхөн композит хийгдэнэ.
 *
 * Мөн энэ хэв маяг нүүр хуудсанд гурван газар давтагдаж, тус бүр нь
 * `.map()` дотор hook дууддаг байсныг (React-ийн дүрэм зөрчсөн) нэгтгэсэн.
 */
export function SpotlightCard({
  children,
  className = '',
  glow = 'rgba(139, 92, 246, 0.3)',
  // Хамгийн захад ±7° налалт өгнө. Үүнээс их бол тоглоом шиг, бага бол
  // огт мэдрэгдэхгүй.
  tilt = 14,
  ...rest
}) {
  const ref = useRef(null)

  const handleMouseMove = e => {
    const el = ref.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height

    el.style.setProperty('--spot-x', `${px * 100}%`)
    el.style.setProperty('--spot-y', `${py * 100}%`)

    if (prefersReducedMotion()) return
    // Курсор дээд талд байвал карт ХОЙШ, доод талд байвал УРАГШ хазайна —
    // бодит биет рүү хараад байгаа мэт мэдрэгдэнэ.
    el.style.transform =
      `perspective(1000px) rotateX(${(0.5 - py) * tilt}deg) `
      + `rotateY(${(px - 0.5) * tilt}deg) translate3d(0, -4px, 0)`
  }

  const handleMouseLeave = () => {
    const el = ref.current
    if (el) el.style.transform = ''
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group spotlight relative overflow-hidden ${className}`}
      style={{ '--spot-glow': glow }}
      {...rest}
    >
      <div className="spotlight-glow" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

/**
 * Үгсийг тасралтгүй сольж, хооронд нь үсэг «холилдуулж» харуулна.
 *
 * Нэг удаа тоглоод зогсдог анимацаас ялгаатай нь энэ нь ХЭЗЭЭ Ч зогсохгүй —
 * хуудас амьд байгаагийн гол дохио.
 *
 * Гуравдагч санг ашиглаагүй: холилдуулалт нь 20 мөр код бөгөөд ингэснээр
 * anime.js ачаалагдаагүй газар ч ажиллана.
 */
const SCRAMBLE_CHARS = 'АБВГДЕЁЖЗИЙКЛМНОӨПРСТУҮФХЦЧШЩЪЫЬЭЮЯ'

export function CyclingText({
  words = [],
  interval = 2800,
  scrambleMs = 620,
  className = '',
}) {
  const [text, setText] = useState(words[0] || '')
  const indexRef = useRef(0)

  useEffect(() => {
    if (words.length < 2) return

    let frame = 0
    let timer = 0

    // Хөдөлгөөн багасгасан үед үсэг холилдуулахгүй — үг л шууд солигдоно.
    const reduced = prefersReducedMotion()

    const scrambleTo = next => {
      if (reduced) {
        setText(next)
        return
      }

      const start = performance.now()
      const tick = now => {
        const t = Math.min((now - start) / scrambleMs, 1)
        // Зүүнээс баруун тийш илэрнэ: эхний `revealed` үсэг эцсийн утгаараа,
        // үлдсэн нь санамсаргүй.
        const revealed = Math.floor(next.length * t)
        let out = ''
        for (let i = 0; i < next.length; i++) {
          if (i < revealed || next[i] === ' ' || next[i] === '.') out += next[i]
          else out += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
        }
        setText(out)
        if (t < 1) frame = requestAnimationFrame(tick)
        else setText(next)
      }
      frame = requestAnimationFrame(tick)
    }

    const cycle = () => {
      indexRef.current = (indexRef.current + 1) % words.length
      scrambleTo(words[indexRef.current])
      timer = setTimeout(cycle, interval)
    }

    timer = setTimeout(cycle, interval)
    return () => {
      clearTimeout(timer)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [words, interval, scrambleMs])

  // `tabular-nums` нь үсэг солигдох үед өргөн нь үсрэхийг багасгана
  return <span className={className}>{text}</span>
}

/**
 * Гүйлгэх ХУРДНААС хамаарч бага зэрэг хазайх бүрхүүл.
 *
 * Хурдан гүйлгэхэд агуулга чиглэлийн дагуу хазайж, зогсоход буцаж тэгширнэ.
 * Хөдөлгөөнийг хэрэглэгчийн үйлдэлтэй холбож, хуудсыг «жинтэй» болгоно.
 *
 * ⚠ Текст ихтэй блокт бүү хэрэглэ — хазайсан үсэг уншихад хүндрэлтэй.
 *   Зураг, карт, зурвас зэрэг график элементэд тохирно.
 */
export function ScrollSkew({ children, className = '', max = 3.5, factor = 0.22 }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return

    let lastY = window.scrollY
    let velocity = 0
    let frame = 0

    const tick = () => {
      const y = window.scrollY
      // Нэг фрэймийн зөрүүг хязгаарлана — зангуу (#anchor) руу үсрэх, эсвэл
      // хуудас сэргээх зэрэгт зөрүү хэдэн мянга болж, хазайлт үсэрнэ.
      const delta = Math.max(-140, Math.min(140, y - lastY))
      lastY = y

      // Хэмжсэн хурд руу аажим ойртоно — түүхий утга нь чичиргээтэй.
      velocity += (delta - velocity) * 0.25

      const skew = Math.max(-max, Math.min(max, velocity * factor))
      el.style.transform = `skewY(${skew}deg)`

      // Хурд бараг тэг болмогц давталтыг ЗОГСООНО — гүйлгэхгүй байхад
      // фрэйм тутамд ажиллах нь дэмий.
      if (Math.abs(velocity) > 0.05) {
        frame = requestAnimationFrame(tick)
      } else {
        el.style.transform = ''
        frame = 0
      }
    }

    // ⚠ Энд `lastY`-г ШИНЭЧЛЭХГҮЙ. `scroll` эвент нь байрлал АЛЬ ХЭДИЙН
    //   өөрчлөгдсөний дараа гал авдаг тул тэр агшинд `lastY = scrollY` гэвэл
    //   зөрүү нь үргэлж 0 болж, хазайлт ХЭЗЭЭ Ч гарахгүй. `lastY` нь өмнөх
    //   фрэймийн (эсвэл зогссон үеийн) утгаараа үлдэх ёстой.
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(tick)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [max, factor])

  return (
    <div ref={ref} className={className} style={{ willChange: 'transform' }}>
      {children}
    </div>
  )
}

/**
 * Эцэс төгсгөлгүй гүйх зурвас.
 *
 * Жагсаалтыг ХОЁР удаа дүрсэлж, замыг яг талаар нь (-50%) гүйлгэнэ. Хоёр
 * дахь хуулбар нь эхнийхийн байрлалд яг таарч ирэх тул давталт нь мэдэгдэхгүй.
 */
export function Marquee({ children, speed = 38, className = '', reverse = false }) {
  const items = Children.toArray(children)

  return (
    <div className={`marquee ${className}`} aria-hidden="true">
      <div
        className="marquee-track"
        style={{ animationDuration: `${speed}s`, animationDirection: reverse ? 'reverse' : 'normal' }}
      >
        {[0, 1].map(copy => (
          <div className="marquee-group" key={copy}>
            {items.map((item, i) => (
              <span key={`${copy}-${i}`}>{item}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
