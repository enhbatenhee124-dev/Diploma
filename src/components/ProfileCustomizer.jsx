import { Sparkles, Lock } from 'lucide-react'
import { THEMES, FRAMES, BANNERS, TITLES } from '../utils/gamification'
import { CosmeticPicker, AvatarWithFrame, resolveLook, GameIcon } from './Gamification'
import { useCosmetics } from '../hooks/useData'

/**
 * Профайлын гоёолт сонгох самбар.
 * Level ахих тусам шинэ тема / хүрээ / баннер / цол нээгдэнэ.
 */
export default function ProfileCustomizer({ user, progress, cardClass, headingClass, bodyClass }) {
  const [cosmetics, setCosmetics] = useCosmetics(user?.id)
  const level = progress.level
  const look = resolveLook(cosmetics, level)

  const lockedCount = [
    ...THEMES, ...FRAMES, ...BANNERS, ...TITLES,
  ].filter(item => level < item.minLevel).length

  return (
    <div className={cardClass}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className={`text-lg font-semibold ${headingClass} flex items-center gap-2`}>
            <Sparkles className="w-5 h-5 text-white" /> Профайлаа гоёох
          </h2>
          <p className={`text-sm ${bodyClass} mt-0.5`}>
            Түвшин ахих тусам шинэ загвар нээгдэнэ.
          </p>
        </div>
        {lockedCount > 0 && (
          <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-white flex items-center gap-1.5">
            <Lock className="w-3 h-3" /> {lockedCount} загвар түгжээтэй
          </span>
        )}
      </div>

      {/* Урьдчилсан харагдац */}
      <div className={`relative overflow-hidden rounded-2xl ${look.banner.className} p-5 mb-6`}>
        <div className="absolute -top-10 -right-6 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <AvatarWithFrame user={user} level={level} frame={look.frame} size="md" />
          <div className="min-w-0">
            <p className="font-bold text-white truncate">{user?.name}</p>
            <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur text-xs font-bold text-white">
              <GameIcon name={look.title.icon} className="w-3.5 h-3.5" />
              {look.title.label}
            </span>
            <div className={`mt-2 h-2 w-32 rounded-full bg-gradient-to-r ${look.theme.gradient}`} />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <CosmeticPicker
          label="Өнгөний тема"
          items={THEMES}
          selectedId={look.theme.id}
          onSelect={id => setCosmetics({ themeId: id })}
          level={level}
          renderPreview={item => (
            <div className={`w-14 h-10 rounded-lg bg-gradient-to-r ${item.gradient}`} />
          )}
        />

        <CosmeticPicker
          label="Аватарын хүрээ"
          items={FRAMES}
          selectedId={look.frame.id}
          onSelect={id => setCosmetics({ frameId: id })}
          level={level}
          renderPreview={item => (
            <div className="w-14 h-10 flex items-center justify-center">
              <div className={`w-8 h-8 rounded-full bg-white/25 ${item.ring}`} />
            </div>
          )}
        />

        <CosmeticPicker
          label="Толгойн баннер"
          items={BANNERS}
          selectedId={look.banner.id}
          onSelect={id => setCosmetics({ bannerId: id })}
          level={level}
          renderPreview={item => <div className={`w-14 h-10 rounded-lg ${item.className}`} />}
        />

        <CosmeticPicker
          label="Цол"
          items={TITLES}
          selectedId={look.title.id}
          onSelect={id => setCosmetics({ titleId: id })}
          level={level}
          renderPreview={item => (
            <div className="w-16 h-10 flex items-center justify-center text-white">
              <GameIcon name={item.icon} className="w-5 h-5" />
            </div>
          )}
        />
      </div>
    </div>
  )
}
