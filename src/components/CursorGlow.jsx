import { useEffect, useRef } from 'react'

// ------------------------------
// Курсор дагадаг гэрэлтүүлэг
// ------------------------------
// Хуудсын дэвсгэрийг курсорын эргэн тойронд зөөлөн гэрэлтүүлнэ. Агуулгын
// ЦААНА байрлана (z-5 ба агуулга z-10) тул текст, картыг бүдгэрүүлэхгүй —
// зөвхөн ард нь гэрэл асаана.
//
// Гурван зүйлийг анхаарсан:
//
//   1. React-ийн төлөв ОГТ хэрэглээгүй. Хулгана хөдлөх бүрд (секундэд ~60
//      удаа) `setState` дуудвал хуудас бүхэлдээ дахин зурагдана. Оронд нь
//      CSS хувьсагчид шууд бичнэ.
//
//   2. Гэрэл курсорыг ЯГ дагахгүй, бага зэрэг хоцорч гүйцнэ (lerp). Яг
//      дагавал хямд, механик мэдрэгддэг; хоцрох нь жинтэй мэдрэмж өгнө.
//
//   3. Мэдрэгч дэлгэцэнд ОГТ гарахгүй (`pointer: coarse`) — хуруу нь
//      курсор биш тул гэрэл сүүлчийн хүрсэн газарт гацаж үлдэнэ.
// ------------------------------

export default function CursorGlow() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Хулганагүй төхөөрөмж, эсвэл хөдөлгөөн багасгасан хэрэглэгчид алгасана.
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let targetX = window.innerWidth / 2
    let targetY = window.innerHeight / 2
    let x = targetX
    let y = targetY
    let frame = 0
    let activated = false

    const tick = () => {
      // Үлдсэн зайн 14%-ийг фрэйм тутамд гүйцнэ — экспоненциал ойртолт.
      x += (targetX - x) * 0.14
      y += (targetY - y) * 0.14

      el.style.setProperty('--cursor-x', `${x}px`)
      el.style.setProperty('--cursor-y', `${y}px`)

      // Зорилтод хүрмэгц давталтыг ЗОГСООНО. Үгүй бол хулгана хөдөлж
      // байхгүй үед ч фрэйм тутамд ажиллаж, дэмий тооцоолол хийнэ.
      if (Math.abs(targetX - x) > 0.5 || Math.abs(targetY - y) > 0.5) {
        frame = requestAnimationFrame(tick)
      } else {
        frame = 0
      }
    }

    const handleMove = e => {
      targetX = e.clientX
      targetY = e.clientY

      // Эхний хөдөлгөөн хүртэл нуугдана — эс бөгөөс хуудас нээгмэгц дэлгэцийн
      // голд гэрэл асчихсан байна.
      if (!activated) {
        activated = true
        el.classList.add('is-active')
      }

      if (!frame) frame = requestAnimationFrame(tick)
    }

    const handleLeave = () => el.classList.remove('is-active')
    const handleEnter = () => { if (activated) el.classList.add('is-active') }

    window.addEventListener('pointermove', handleMove, { passive: true })
    document.addEventListener('pointerleave', handleLeave)
    document.addEventListener('pointerenter', handleEnter)

    return () => {
      window.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerleave', handleLeave)
      document.removeEventListener('pointerenter', handleEnter)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return <div ref={ref} className="cursor-glow" aria-hidden="true" />
}
