import { useState, useEffect, useCallback, useRef } from 'react'
import * as q from '../data/queries'
import { useAuth } from './useAuth'

// ============================================================
// Өгөгдөл татах hook-ууд
// ============================================================
// Бүгд `{ data, loading, error, refresh }` буцаана.
// localStorage-ийн үеийнхээс ялгаатай нь өгөгдөл АСИНХРОН ирдэг тул
// компонентууд `loading` төлөвийг харгалзах ёстой.
// ============================================================

/**
 * Ерөнхий татагч.
 * @param {Function} fetcher `{ok, data, error}` буцаадаг async функц
 * @param {Array} deps дахин татах хамаарлууд
 * @param {*} initial анхны утга (ихэвчлэн [] эсвэл null)
 */
function useFetch(fetcher, deps, initial) {
  const [data, setData] = useState(initial)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Хуучирсан хариу шинэ өгөгдлийг дарж бичихээс сэргийлнэ
  const requestId = useRef(0)

  const load = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    const result = await fetcher()
    if (id !== requestId.current) return

    if (result.ok) {
      setData(result.data)
      setError(null)
    } else {
      setError(result.error)
    }
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { load() }, [load])

  return { data, loading, error, refresh: load, setData }
}

const empty = []

export function useShifts() {
  return useFetch(q.fetchShifts, [], empty)
}

/**
 * Хүсэлтүүд. Нэвтрээгүй үед хоосон буцаана — АЛДАА БИШ.
 *
 * `/jobs` хуудас нь нийтэд нээлттэй бөгөөд энэ hook-ийг ашигладаг. Хэрэв
 * нэвтрээгүй үед 401 алдаа өгвөл зочинд зарын жагсаалтын оронд алдааны
 * хайрцаг харагдана — зарын самбарыг нээсэн ч утгагүй болно.
 */
export function useApplications() {
  const { user } = useAuth()
  const id = user?.id
  return useFetch(
    useCallback(
      () => (id ? q.fetchApplications() : Promise.resolve({ ok: true, data: [] })),
      [id]
    ),
    [id],
    empty
  )
}

export function useReviews() {
  return useFetch(q.fetchReviews, [], empty)
}

/** Нийтэд харагдах профайлууд — утас, и-мэйлгүй. */
export function useProfiles() {
  return useFetch(q.fetchProfiles, [], empty)
}

/** Админд зориулсан бүрэн жагсаалт (утас, и-мэйлтэй). RLS шалгана. */
export function useProfilesWithContact() {
  return useFetch(q.fetchProfilesWithContact, [], empty)
}

export function useEmployerProfiles() {
  return useFetch(q.fetchEmployerProfiles, [], empty)
}

/** Баталгаажуулах дараалал — зөвхөн админд өгөгдөл ирнэ. */
export function useEmployerQueue() {
  return useFetch(q.fetchEmployerQueue, [], empty)
}

/** Нэвтэрсэн хэрэглэгчийн EXP / түвшин — өгөгдлийн сангийн view-гээс. */
export function useMyProgress() {
  const { user } = useAuth()
  const id = user?.id
  return useFetch(
    useCallback(() => (id ? q.fetchMyProgress(id) : Promise.resolve({ ok: true, data: null })), [id]),
    [id],
    null
  )
}

export function useRanking(role) {
  return useFetch(
    useCallback(() => q.fetchRanking(role), [role]),
    [role],
    empty
  )
}

/** Хадгалсан ажлууд — id-ийн массив, шилжүүлэгчтэй. */
export function useSavedJobs() {
  const { user } = useAuth()
  const id = user?.id
  const { data, loading, error, refresh, setData } = useFetch(
    useCallback(() => (id ? q.fetchSavedJobs(id) : Promise.resolve({ ok: true, data: [] })), [id]),
    [id],
    empty
  )

  const isSaved = useCallback(shiftId => data.includes(shiftId), [data])

  const toggleSaved = useCallback(
    async shiftId => {
      if (!id) return { ok: false, error: 'Нэвтрэх шаардлагатай.' }
      const saved = data.includes(shiftId)

      // Шууд харагдац — сервер хариу ирэхийг хүлээхгүй
      setData(prev => (saved ? prev.filter(x => x !== shiftId) : [...prev, shiftId]))

      const result = await q.toggleSavedJob(id, shiftId, saved)
      if (!result.ok) {
        setData(prev => (saved ? [...prev, shiftId] : prev.filter(x => x !== shiftId)))
      }
      return result
    },
    [id, data, setData]
  )

  return { saved: data, loading, error, isSaved, toggleSaved, refresh }
}

/** Нэвтэрсэн ажил олгогчийн захиалгын төлөв. */
export function useSubscription() {
  const { user } = useAuth()
  const id = user?.id
  return useFetch(
    useCallback(
      () => (id ? q.fetchSubscription(id) : Promise.resolve({ ok: true, data: null })),
      [id]
    ),
    [id],
    null
  )
}

export function usePlan() {
  return useFetch(q.fetchPlan, [], null)
}

/** Нэхэмжлэлүүд. Ажил олгогчид өөрийнх, админд бүгд харагдана (RLS шийднэ). */
export function useInvoices() {
  return useFetch(q.fetchInvoices, [], empty)
}

/** Миний бүх чат. */
export function useMyThreads() {
  return useFetch(q.fetchMyThreads, [], empty)
}

/**
 * Нэг чатын мессежүүд — realtime сонсолттой.
 * Шинэ мессеж ирэхэд жагсаалт автоматаар шинэчлэгдэнэ.
 */
export function useChat(threadId) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!threadId) {
      setMessages([])
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    q.fetchMessages(threadId).then(result => {
      if (!active) return
      if (result.ok) {
        setMessages(result.data)
        setError(null)
        q.markMessagesRead(threadId, user?.id)
      } else {
        setError(result.error)
      }
      setLoading(false)
    })

    // Realtime — нөгөө талын мессеж шууд гарч ирнэ
    const unsubscribe = q.subscribeToMessages(threadId, msg => {
      if (!active) return
      setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]))
      if (msg.senderId !== user?.id) q.markMessagesRead(threadId, user?.id)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [threadId, user?.id])

  const send = useCallback(
    async text => {
      if (!threadId || !user?.id) return { ok: false, error: 'Чат нээгдээгүй байна.' }
      const result = await q.sendMessage(threadId, user.id, text)
      if (result.ok) {
        // Realtime давхардуулахгүйн тулд id-гаар шалгана
        setMessages(prev => (prev.some(m => m.id === result.data.id) ? prev : [...prev, result.data]))
      }
      return result
    },
    [threadId, user?.id]
  )

  return { messages, loading, error, send }
}

/**
 * Хадгалсан хайлтууд (FR-5.4).
 * Зөвхөн ажил хайгчид — сервер бусад дүрд 403 буцаана.
 */
export function useSavedSearches() {
  const { user } = useAuth()
  const isWorker = user?.role === 'employee'

  const { data, loading, error, refresh } = useFetch(
    useCallback(
      () => (isWorker ? q.fetchSavedSearches() : Promise.resolve({ ok: true, data: [] })),
      [isWorker]
    ),
    [isWorker],
    empty
  )

  const save = useCallback(async input => {
    const result = await q.createSavedSearch(input)
    if (result.ok) refresh()
    return result
  }, [refresh])

  const toggleNotify = useCallback(async (id, notify) => {
    const result = await q.setSearchNotify(id, notify)
    if (result.ok) refresh()
    return result
  }, [refresh])

  const remove = useCallback(async id => {
    const result = await q.deleteSavedSearch(id)
    if (result.ok) refresh()
    return result
  }, [refresh])

  return { searches: data, loading, error, save, toggleNotify, remove, refresh }
}

/** Мэдээлсэн зүйлс (админд бүгд, хэрэглэгчид өөрийнх). */
export function useReports() {
  return useFetch(q.fetchReports, [], empty)
}

/**
 * Мэдэгдлүүд — шинэ нь realtime-аар шууд ирнэ (FR-8, NFR-6).
 *
 * Уншсан гэж тэмдэглэхэд шууд харагдацыг (optimistic) шинэчилнэ: хэрэглэгч
 * дарсан даруйдаа хариу харах ёстой, сервер хүлээхгүй.
 */
export function useNotifications() {
  const { user } = useAuth()
  const id = user?.id

  const [items, setItems] = useState(empty)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!id) {
      setItems(empty)
      setLoading(false)
      return
    }
    const result = await q.fetchNotifications()
    if (result.ok) setItems(result.data.items)
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  // Шинэ мэдэгдэл ирэхэд жагсаалтын эхэнд нэмнэ
  useEffect(() => {
    if (!id) return
    return q.subscribeToNotifications(id, incoming => {
      setItems(prev => (prev.some(n => n.id === incoming.id) ? prev : [incoming, ...prev]))
    })
  }, [id])

  const unread = items.filter(n => !n.isRead).length

  const markRead = useCallback(async notificationId => {
    setItems(prev => prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n)))
    const result = await q.markNotificationRead(notificationId)
    if (!result.ok) load()   // амжилтгүй бол бодит төлөвт буцаана
  }, [load])

  const markAllRead = useCallback(async () => {
    if (!unread) return
    setItems(prev => prev.map(n => ({ ...n, isRead: true })))
    const result = await q.markAllNotificationsRead()
    if (!result.ok) load()
  }, [unread, load])

  return { items, unread, loading, markRead, markAllRead, refresh: load }
}

/** Ажилтны ур чадвар / боломжит цаг. */
export function useWorkerProfile(userId) {
  const { data, loading, error, refresh, setData } = useFetch(
    useCallback(
      () => (userId ? q.fetchWorkerProfile(userId) : Promise.resolve({ ok: true, data: { skills: [], availability: {} } })),
      [userId]
    ),
    [userId],
    { skills: [], availability: {} }
  )

  const save = useCallback(
    async patch => {
      if (!userId) return { ok: false, error: 'Нэвтрэх шаардлагатай.' }
      setData(prev => ({ ...prev, ...patch }))
      const result = await q.saveWorkerProfile(userId, patch)
      if (!result.ok) refresh()
      return result
    },
    [userId, setData, refresh]
  )

  return { profile: data, loading, error, save, refresh }
}

/** Зөвхөн `useWorkerDirectory` дотор хэрэглэгдэнэ. */
function useWorkerProfiles() {
  return useFetch(q.fetchWorkerProfiles, [], empty)
}

/**
 * Ажилтны талаарх БҮХ мэдээллийг нэг дор: ур чадвар, боломжит цаг, үнэлгээ,
 * дуусгасан ажлын тоо, түвшин.
 *
 * Хоёр эх сурвалжийг нэгтгэнэ:
 *   • `worker_profiles` — ажилтан өөрөө оруулсан ур чадвар, хуваарь
 *   • `rankings` view   — өгөгдлийн сангаас тооцоолсон үнэлгээ, EXP
 *
 * Үнэлгээг view-гээс авах нь чухал: клиент дээр тооцвол RLS-ээс болж
 * бүрэн бус, мөн хэрэглэгч өөрчилж чадах тоо болно.
 */
export function useWorkerDirectory() {
  const profilesQ = useWorkerProfiles()
  const rankingQ = useRanking('employee')

  const byId = new Map()

  for (const p of profilesQ.data) {
    byId.set(p.userId, { skills: p.skills, availability: p.availability })
  }
  for (const r of rankingQ.data) {
    byId.set(r.userId, {
      skills: [],
      availability: {},
      ...byId.get(r.userId),
      avgRating: r.avgRating,
      reviews: r.reviews,
      completed: r.completed,
      level: r.level,
    })
  }

  return {
    get: userId => byId.get(userId),
    loading: profilesQ.loading || rankingQ.loading,
    error: profilesQ.error || rankingQ.error,
    refresh: () => { profilesQ.refresh(); rankingQ.refresh() },
  }
}

/** Профайлын гоёолт. */
export function useCosmetics(userId) {
  const { data, loading, refresh, setData } = useFetch(
    useCallback(
      () => (userId ? q.fetchCosmetics(userId) : Promise.resolve({ ok: true, data: {} })),
      [userId]
    ),
    [userId],
    {}
  )

  const setCosmetics = useCallback(
    async patch => {
      if (!userId) return
      setData(prev => ({ ...prev, ...patch }))   // шууд харагдац
      const result = await q.saveCosmetics(userId, patch)
      if (!result.ok) refresh()                   // амжилтгүй бол сэргээнэ
      return result
    },
    [userId, setData, refresh]
  )

  return [data, setCosmetics, { loading }]
}

/**
 * Хэд хэдэн эх сурвалжийг зэрэг татах үед нэгтгэсэн төлөв.
 * Аль нэг нь ачаалж байвал `loading`, аль нэгэнд алдаа гарвал эхнийхийг нь буцаана.
 */
export function combine(...results) {
  return {
    loading: results.some(r => r.loading),
    error: results.find(r => r.error)?.error || null,
    refreshAll: () => results.forEach(r => r.refresh?.()),
  }
}
