import { useState } from 'react'
import { BellRing, BellOff, BookmarkPlus, Trash2, Loader2 } from 'lucide-react'
import { useSavedSearches } from '../hooks/useData'
import { useNotification } from '../hooks/useNotification'

// ============================================================
// Хадгалсан хайлт (FR-5.4)
// ============================================================
// Одоогийн шүүлтийг хадгалж, тохирох зар гармагц мэдэгдэл авна.
// Мэдэгдлийг өгөгдлийн сангийн триггер үүсгэдэг тул апп нээлттэй байх
// шаардлагагүй — дараа орохдоо хонхон дээрээ харна.
// ============================================================

/** Шүүлтийг хүн уншихад ойлгомжтой болгоно. */
function describe(filters) {
  const parts = []
  if (filters.search) parts.push(`"${filters.search}"`)
  if (filters.district) parts.push(filters.district)
  if (filters.category) parts.push(filters.category)
  if (filters.minWage) parts.push(`${filters.minWage.toLocaleString('mn-MN')}₮/цаг-с дээш`)
  return parts.join(' · ') || 'Бүх ажил'
}

export default function SavedSearches({ currentFilters, onApply }) {
  const { searches, save, toggleNotify, remove } = useSavedSearches()
  const { notify } = useNotification()
  const [saving, setSaving] = useState(false)

  // Шүүлт огт сонгоогүй бол хадгалах нь утгагүй — бүх зар мэдэгдэл болно
  const hasFilters = Object.values(currentFilters).some(v => v !== undefined && v !== null && v !== '')

  const handleSave = async () => {
    const suggested = describe(currentFilters).slice(0, 60)
    const name = prompt('Энэ хайлтыг ямар нэрээр хадгалах вэ?', suggested)
    if (name === null) return

    setSaving(true)
    const result = await save({ name: name.trim() || suggested, filters: currentFilters })
    setSaving(false)

    if (!result.ok) {
      notify({ type: 'error', message: 'Хадгалж чадсангүй', description: result.error })
      return
    }
    notify({
      type: 'success',
      message: 'Хайлт хадгалагдлаа',
      description: 'Тохирох шинэ зар гармагц мэдэгдэл ирнэ.',
    })
  }

  const handleRemove = async id => {
    const result = await remove(id)
    if (!result.ok) notify({ type: 'error', message: 'Устгаж чадсангүй', description: result.error })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={handleSave}
        disabled={!hasFilters || saving}
        title={hasFilters ? 'Одоогийн шүүлтийг хадгалах' : 'Эхлээд шүүлт сонгоно уу'}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                   bg-white/5 emp-text-body hover:bg-white/10
                   disabled:opacity-40 disabled:hover:bg-white/5 transition-colors"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
        Хайлтаа хадгалах
      </button>

      {searches.map(s => (
        <span
          key={s.id}
          className="inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-lg text-xs
                     bg-emp-accent/15 border border-emp-accent/25"
        >
          <button
            onClick={() => onApply(s.filters)}
            title={describe(s.filters)}
            className="text-white hover:underline max-w-[10rem] truncate"
          >
            {s.name}
          </button>

          <button
            onClick={() => toggleNotify(s.id, !s.notify)}
            title={s.notify ? 'Мэдэгдэл асаалттай' : 'Мэдэгдэл унтраалттай'}
            className="p-1 rounded text-white/60 hover:text-white hover:bg-white/10"
          >
            {s.notify ? <BellRing className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
          </button>

          <button
            onClick={() => handleRemove(s.id)}
            title="Устгах"
            className="p-1 rounded text-white/50 hover:text-red-300 hover:bg-white/10"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </span>
      ))}
    </div>
  )
}
