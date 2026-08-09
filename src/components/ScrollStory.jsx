import { useEffect, useRef } from 'react'
import { createTimeline, onScroll, stagger, svg } from 'animejs'
import StoryScene, { APPLICANTS, MATCHED_INDEX, CORNERS } from './StoryScene'

// ------------------------------
// Гүйлгэлтээр жолоодогддог түүх (scroll-scrubbed)
// ------------------------------
// Хэсэг нь дэлгэцэнд НААЛДАЖ үлдэх зуур гүйлгэлт нь хуудсыг доошлуулахын
// оронд анимацын timeline-ийн байрлалыг (playhead) удирдана. Доошоо
// гүйлгэвэл түүх урагшилна, дээшээ гүйлгэвэл УХАРНА.
//
// Ажиллах зарчим:
//   1. Гадна хэсэг нь дэлгэцээс хэд дахин өндөр — энэ нэмэлт өндөр нь
//      «гүйлгэх зай» буюу timeline-ийн урт болно.
//   2. Дотор нь `sticky top-0 h-screen` — гадна хэсэг өнгөрөх зуур энэ нь
//      дэлгэцэнд наалдаж зогсоно.
//   3. `onScroll({ sync: true })` нь timeline-ийн явцыг гүйлгэлтийн
//      байрлалд хатуу наана.
//
// ⚠ Наалдалт ажиллахын тулд ДЭЭД ТАЛЫН аль ч эцэг элемент `overflow: hidden`
//   байж болохгүй (HomePage-д `overflow-x-clip` болгосон шалтгаан).
// ------------------------------

// ⚠ Алхмын өнгө нь БАРААН Chadal дэвсгэрт (#0E1522 самбар) зориулагдсан.
//   Halo (цайвар) үед эдгээр нь -800 аягтай гүн өнгө байсан; бараан дээр
//   тэдгээр нь дэвсгэртэйгээ нийлж алга болно. Тиймээс -400 аяг руу
//   буцаав — өнгөний ЧАНАР нь хэвээр, зөвхөн гүн нь өөрчлөгдсөн.
//   `StoryScene` дэх ижил үүрэгтэй өнгөнүүдтэй тааруулсан.
const STEPS = [
  {
    n: '01',
    title: 'Ажил зарлах',
    body: 'Ажил олгогч цагийн ажлаа минутын дотор нийтэлнэ — цаг, байршил, цалингаа зааж өгөхөд л хангалттай.',
    color: '#A78BFA',
  },
  {
    n: '02',
    title: 'Хүсэлт илгээх',
    body: 'Ажил хайгчид өөрсдийн боломжит цаг, ур чадварт тохирсон зарыг хараад нэг товшилтоор хүсэлтээ илгээнэ.',
    color: '#38BDF8',
  },
  {
    n: '03',
    title: 'Тохирол',
    body: 'Систем ур чадвар, байршил, цагийн давхцлыг тооцож эрэмбэлнэ. Ажил олгогч зөвшөөрөхөд хоёр тал холбогдоно.',
    color: '#34D399',
  },
  {
    n: '04',
    title: 'Ажиллаад цалингаа авах',
    body: 'Ажил дуусахад үнэлгээ өгч, туршлагын оноо цуглуулна. Түвшин ахих тусам илүү өндөр цалинтай ажил нээгдэнэ.',
    color: '#F472B6',
  },
]

// Timeline-ийн нэгж. `sync: true` үед энэ нь бодит миллисекунд БИШ —
// зөвхөн харьцаа болж гүйлгэлтийн зайд хуваарилагдана.
const SPAN = 1000
const TOTAL = STEPS.length * SPAN

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function ScrollStory() {
  const section = useRef(null)
  const reduced = prefersReducedMotion()

  useEffect(() => {
    if (reduced || !section.current) return

    const observer = onScroll({
      target: section.current,
      // ⚠ Босго нь `'<КОНТЕЙНЕР> <БАЙ>'` дарааллаар уншигдана
      //   (эх код: animejs/dist/modules/events/scroll.js). Эсрэгээр бичвэл
      //   зай сөрөг гарч `distance = 0` болж, анимац ЧИМЭЭГҮЙ ажиллахаа болино.
      enter: 'top top',         // хэсгийн дээд ирмэг дэлгэцийн дээдэд хүрэх
      leave: 'bottom bottom',   // хэсгийн доод ирмэг дэлгэцийн доодод хүрэх
      sync: true,               // хатуу наалт — гүйлгэлт зогсвол анимац ч зогсоно
    })

    const tl = createTimeline({
      defaults: { ease: 'inOutQuad', duration: SPAN * 0.4 },
      autoplay: observer,
    })

    // ---------- 01. Зар угсрагдана ----------
    // Булангийн хаалтууд гаднаас нисэж ирж хүрээ үүсгэнэ.
    CORNERS.forEach((c, i) => {
      tl.add(`.scene-corner-${c.id}`, {
        opacity: [0, 1],
        translateX: [c.dx, 0],
        translateY: [c.dy, 0],
      }, i * 60)
    })
    // Хүрээ бүрдсэний дараа биет нь гарч ирнэ
    tl.add('.scene-card-body', { opacity: [0, 1], scale: [0.9, 1] }, 260)
    // Доторх «текст» мөрүүд зүүнээс баруун тийш сунана
    tl.add('.scene-card-line', {
      scaleX: [0, 1],
      duration: SPAN * 0.3,
      delay: stagger(70),
    }, 420)

    // ---------- 02. Хүсэлтүүд ниснэ ----------
    APPLICANTS.forEach(a => {
      tl.add(`.scene-applicant-${a.i}`, {
        opacity: [0, 1],
        translateX: [a.fromX, 0],
        translateY: [a.fromY, 0],
        scale: [0.5, 1],
        ease: 'outBack',
      }, SPAN + a.i * 80)
    })

    // ---------- 03. Тохирол ----------
    // Холбоос бүр ажилтнаас карт руу зурагдана.
    tl.add(svg.createDrawable('.scene-link'), {
      draw: ['0 0', '0 1'],
      opacity: [0, 0.9],
      duration: SPAN * 0.45,
      delay: stagger(60),
    }, 2 * SPAN)

    // Дараа нь ганц нь сонгогдож, бусад нь бүдгэрнэ.
    APPLICANTS.forEach(a => {
      if (a.matched) return
      tl.add(`.scene-link-${a.i}`, { opacity: 0.12 }, 2 * SPAN + 620)
      tl.add(`.scene-applicant-${a.i}`, { opacity: 0.25, scale: 0.85 }, 2 * SPAN + 620)
    })
    tl.add(`.scene-link-${MATCHED_INDEX}`, { strokeWidth: 3.4 }, 2 * SPAN + 620)
    tl.add(`.scene-applicant-${MATCHED_INDEX}`, { scale: 1.3 }, 2 * SPAN + 620)

    // ---------- 04. Туршлага, цалин ----------
    tl.add(svg.createDrawable('.scene-ring'), {
      draw: ['0 0', '0 1'],
      opacity: [0, 1],
      duration: SPAN * 0.6,
    }, 3 * SPAN)
    tl.add('.scene-badge', { opacity: [0, 1], scale: [0, 1], ease: 'outBack' }, 3 * SPAN + 420)

    // ---------- Текстийн алхмууд ----------
    STEPS.forEach((_, i) => {
      const start = i * SPAN

      // Эхний алхам нь явц 0 дээр АЛЬ ХЭДИЙН харагдаж байх ёстой. Түүнд ч
      // орж ирэх шилжилт өгвөл timeline-ийн эхэнд утга нь 0 болж, хэрэглэгч
      // хоосон дэлгэц харна.
      if (i > 0) {
        tl.add(`.story-step-${i}`, {
          opacity: [0, 1],
          translateY: [40, 0],
          filter: ['blur(8px)', 'blur(0px)'],
        }, start)
      }
      tl.add(`.story-dot-${i}`, { scaleX: [0.25, 1], opacity: [0.3, 1] }, start)

      if (i < STEPS.length - 1) {
        tl.add(`.story-step-${i}`, {
          opacity: 0,
          translateY: -40,
          filter: 'blur(8px)',
        }, start + SPAN * 0.74)
        tl.add(`.story-dot-${i}`, { scaleX: 0.25, opacity: 0.3 }, start + SPAN * 0.74)
      }
    })

    // Зураасан заагч — түүхийн хаана явааг харуулна
    tl.add('.story-scrubber-head', {
      left: ['2%', '97%'],
      duration: TOTAL,
      ease: 'linear',
    }, 0)

    return () => {
      tl.revert()
      observer.revert()
    }
  }, [reduced])

  // Хөдөлгөөн багасгасан үед наалдалтгүй, бүх алхам энгийн жагсаалтаар.
  if (reduced) {
    return (
      <section className="container-page py-16">
        <h2 className="text-4xl font-extrabold mb-10 text-white">Хэрхэн ажилладаг вэ?</h2>
        <div className="space-y-8">
          {STEPS.map(step => (
            <div key={step.n} className="flex gap-5">
              <span className="text-2xl font-mono font-bold" style={{ color: step.color }}>{step.n}</span>
              <div>
                <h3 className="text-xl font-bold text-white">{step.title}</h3>
                <p className="text-chadal-muted mt-1">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    // Нэмэлт өндөр = гүйлгэх зай. Утсан дээр богиносгов — гар хуруугаар
    // дөрвөн дэлгэц гүйлгэх нь аль хэдийн урт.
    <section ref={section} className="relative h-[320vh] sm:h-[420vh]">
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="container-page w-full grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Зүүн: алхмуудын текст. Бүгд нэг дээр давхарлаж, timeline нь
              алийг нь харуулахыг шийднэ. */}
          <div className="relative min-h-[21rem] order-2 lg:order-1">
            <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-chadal-muted mb-6">
              Хэрхэн ажилладаг вэ
            </p>

            {/* Алхмын заагчууд */}
            <div className="flex gap-2 mb-8">
              {STEPS.map((step, i) => (
                <span
                  key={step.n}
                  className={`story-dot-${i} h-[3px] w-12 rounded-full`}
                  style={{
                    background: step.color,
                    opacity: i === 0 ? 1 : 0.3,
                    transformOrigin: 'left center',
                    transform: i === 0 ? 'scaleX(1)' : 'scaleX(0.25)',
                  }}
                />
              ))}
            </div>

            {STEPS.map((step, i) => (
              <div
                key={step.n}
                className={`story-step-${i} absolute inset-x-0 top-[6.5rem]`}
                style={{ opacity: i === 0 ? 1 : 0 }}
              >
                <span
                  className="block text-6xl sm:text-7xl font-mono font-bold leading-none mb-3"
                  style={{ color: step.color }}
                >
                  {step.n}
                </span>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-base sm:text-lg text-chadal-muted max-w-xl leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>

          {/* Баруун: хувирдаг дүрс */}
          <div className="order-1 lg:order-2">
            <StoryScene />
          </div>
        </div>

        {/* Зураасан заагч */}
        <div
          className="absolute bottom-6 sm:bottom-8 right-4 sm:right-10 h-9 w-48 sm:w-72 rounded-lg
                     bg-chadal-card/80 border border-chadal-border backdrop-blur
                     flex items-center overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute inset-0 flex items-center justify-between px-2">
            {Array.from({ length: 34 }, (_, i) => (
              <span
                key={i}
                className="w-px bg-white/30"
                style={{ height: i % 5 === 0 ? '16px' : '9px' }}
              />
            ))}
          </div>
          <span className="story-scrubber-head absolute w-[3px] h-5 rounded-full bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.7)]" />
        </div>
      </div>
    </section>
  )
}
