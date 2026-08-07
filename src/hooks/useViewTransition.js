import { useCallback } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'

// ------------------------------
// Хуудас хоорондын жинхэнэ шилжилт (View Transitions API)
// ------------------------------
// Хөтөч шилжилтийн ӨМНӨХ дэлгэцийн зургийг авч, ДАРААХ зурагтай нь
// харьцуулж, ижил `view-transition-name`-тэй элементүүдийг хооронд нь
// хөдөлгөж холбоно. Ингэснээр «ажлын карт» нь дэлгэрэнгүй хуудасны толгой
// хэсэг БОЛЖ томордог мэт харагдана — хоёр тусдаа хуудас гэхээсээ илүү нэг
// зүйл өргөжсөн мэт мэдрэгдэнэ.
//
// ⚠ React Router-ийн built-in дэмжлэгийг ЯАГААД ашиглаагүй вэ:
//   `<Link viewTransition>` болон `useViewTransitionState` нь `RouterProvider`
//   (өгөгдлийн router)-ийг ШААРДДАГ. Энэ апп нь `BrowserRouter` + `<Routes>`
//   бүтэцтэй тул тэдгээр нь ажиллахгүй (`useViewTransitionState` бол шууд
//   invariant алдаа өгнө). Routing-ийн бүтцийг бүхэлд нь нүүлгэхийн оронд
//   хөтчийн API-г шууд дуудаж байна — үр дүн нь ижил, эрсдэл нь бага.
// ------------------------------

/** Хөтөч View Transitions-ыг дэмждэг эсэх. */
export function supportsViewTransition() {
  return typeof document !== 'undefined'
    && typeof document.startViewTransition === 'function'
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * `navigate`-ийн оронд ашиглах шилжүүлэгч.
 *
 * Дэмждэггүй хөтөч дээр (эсвэл хөдөлгөөн багасгасан үед) ЯГ энгийн
 * `navigate` шиг ажиллана — тусад нь салгаж шалгах шаардлагагүй.
 */
export function useViewTransitionNavigate() {
  const navigate = useNavigate()

  return useCallback((to, options) => {
    if (!supportsViewTransition()) {
      navigate(to, options)
      return
    }

    // `flushSync` нь ЗААВАЛ хэрэгтэй: хөтөч нь callback буцангуут DOM-ийн
    // шинэ төлөвийн зургийг авдаг. React анхдагчаараа шинэчлэлтээ багцалж
    // хойшлуулдаг тул үүнгүй бол хөтөч ХУУЧИН DOM-ыг хоёр удаа зурж, ямар ч
    // шилжилт харагдахгүй.
    // `PageTransition`-д «яг одоо хөтөч өөрөө шилжилт хийж байна» гэдгийг
    // мэдэгдэнэ. Үгүй бол хоёр анимац давхарлаж, хуудас нэг дор морфлож БАС
    // доороос гарч ирэх болно.
    document.documentElement.dataset.viewTransition = 'active'

    const transition = document.startViewTransition(() => {
      flushSync(() => navigate(to, options))
    })

    // Амжилттай эсэхээс үл хамааран тугийг заавал буцааж авна — эс бөгөөс
    // дараагийн бүх шилжилт чимээгүй анимацгүй болно.
    transition.finished.finally(() => {
      delete document.documentElement.dataset.viewTransition
    })
  }, [navigate])
}

/**
 * Хоёр хуудсанд ижил нэр өгснөөр элементүүдийг хооронд нь холбоно.
 *
 * ⚠ Нэг агшинд НЭГ Л элемент тухайн нэрийг эзэмшиж болно. Жагсаалтын БҮХ
 *   карт `job-card` гэсэн нэртэй бол хөтөч аль нь болохыг мэдэхгүй тул
 *   шилжилтийг бүхэлд нь цуцалдаг. Тиймээс нэрийг зөвхөн дарагдсан карт
 *   дээр нь өгнө — `JobListings` дотор `activeId`-аар удирдаж байна.
 */
export const SHARED_JOB_CARD = 'shared-job-card'
