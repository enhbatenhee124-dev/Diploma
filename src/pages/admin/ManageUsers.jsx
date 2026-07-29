import { useState } from 'react'
import { Search, Users, Shield, Trash2 } from 'lucide-react'
import { useProfilesWithContact } from '../../hooks/useData'
import { deactivateUser } from '../../data/queries'
import { useNotification } from '../../hooks/useNotification'
import { Loading, ErrorBox } from '../../components/States'

const roles = ['Бүх дүр', 'Employee', 'Employer', 'Admin']

export default function ManageUsers() {
  const { data: users, loading, error, refresh } = useProfilesWithContact()
  const { notify } = useNotification()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('Бүх дүр')
  const [busy, setBusy] = useState(null)

  /**
   * Хэрэглэгчийг идэвхгүй болгоно.
   *
   * Бүрмөсөн УСТГАХГҮЙ: үнэлгээ, ажлын түүх, төлбөрийн бичлэг бүтэн үлдэх
   * ёстой (маргаан гарвал баримт болно). Оронд нь хувийн мэдээллийг нь
   * арилгаж, идэвхтэй зар/хүсэлтийг нь хаана.
   */
  const deactivate = async u => {
    const ok = confirm(
      `${u.name}-г идэвхгүй болгох уу?\n\n` +
      '• Утас, и-мэйл, танилцуулга нь устана\n' +
      '• Идэвхтэй зар, хүсэлт нь хаагдана\n' +
      '• Ажлын түүх, үнэлгээ нь үлдэнэ\n\n' +
      'Энэ үйлдлийг буцаах боломжгүй.'
    )
    if (!ok) return

    const reason = prompt('Шалтгаан (заавал биш):') || null

    setBusy(u.id)
    const result = await deactivateUser(u.id, reason)
    setBusy(null)

    if (!result.ok) {
      notify({ type: 'error', message: 'Идэвхгүй болгож чадсангүй', description: result.error })
      return
    }
    notify({ type: 'info', message: 'Идэвхгүй боллоо', description: `${u.name} системээс хасагдлаа.` })
    refresh()
  }

  const filtered = users.filter(u => {
    const term = search.toLowerCase()
    const matchSearch = search === '' ||
      u.name.toLowerCase().includes(term) ||
      (u.phone || '').includes(search) ||
      (u.email || '').toLowerCase().includes(term)
    const matchRole = roleFilter === 'Бүх дүр' || u.role.toLowerCase() === roleFilter.toLowerCase()
    return matchSearch && matchRole
  })

  if (loading) return <Loading label="Хэрэглэгчид ачаалж байна…" />
  if (error) return <ErrorBox message={error} onRetry={refresh} />

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold adm-text-heading">Хэрэглэгчид</h1>
        <p className="mt-1 adm-text-body">Платформын бүх хэрэглэгчийг харах, шүүх, удирдах.</p>
      </div>

      {/* Filters */}
      <div className="adm-card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-adm-muted" />
            <input type="text" placeholder="Хэрэглэгч хайх..." value={search} onChange={e => setSearch(e.target.value)} className="adm-input pl-10" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="adm-input appearance-none pr-10 cursor-pointer">
            {roles.map(r => <option key={r} value={r} className="bg-adm-card">{r}</option>)}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="adm-card overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-adm-border">
              <th className="pb-3 pr-4 text-sm font-medium adm-text-body">Хэрэглэгч</th>
              <th className="pb-3 pr-4 text-sm font-medium adm-text-body">Дүр</th>
              <th className="pb-3 pr-4 text-sm font-medium adm-text-body">Холбоо барих</th>
              <th className="pb-3 text-sm font-medium adm-text-body text-right">Үйлдэл</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-b border-adm-border last:border-0">
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-3">
                    <img src={u.avatarUrl} alt={u.name} className="w-9 h-9 rounded-full" />
                    <div>
                      <p className="font-medium adm-text-heading text-sm">{u.name}</p>
                      <p className="text-xs adm-text-body">{u.district}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 pr-4">
                  <span className="adm-badge bg-adm-bg text-adm-muted border border-adm-border">{u.role}</span>
                </td>
                <td className="py-4 pr-4 text-sm adm-text-body">
                  <p>{u.phone}</p>
                  {u.email && <p className="text-xs adm-text-body opacity-80">{u.email}</p>}
                </td>
                <td className="py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {u.deactivatedAt ? (
                      <span className="text-xs text-white/40">Идэвхгүй</span>
                    ) : (
                      <button
                        onClick={() => deactivate(u)}
                        disabled={busy === u.id}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-white hover:text-red-400 transition-colors disabled:opacity-40"
                        title="Идэвхгүй болгох"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-10 h-10 text-adm-muted mx-auto mb-2" />
            <p className="adm-text-body">Хэрэглэгч олдсонгүй.</p>
          </div>
        )}
      </div>
    </div>
  )
}
