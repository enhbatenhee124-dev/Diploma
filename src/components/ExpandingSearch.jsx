import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'

// ------------------------------
// Дэлгэгддэг хайлтын мөр
// ------------------------------
// Хажуугийн цэстэй ижил зарчим: хэвийн үед дугуй товч, хулгана хүрэхэд
// сунаж хайлтын талбар гарч ирнэ. Бичиж эхэлбэл хулгана явсан ч хумигдахгүй.
// ------------------------------

export default function ExpandingSearch({
  placeholder = 'Ажил хайх...',
  onSubmit,
  theme = 'emp',
}) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const accent = {
    emp: 'text-emp-accent bg-emp-card border-emp-border focus-within:border-emp-accent/50',
    wrk: 'text-wrk-accent bg-wrk-card border-wrk-border focus-within:border-wrk-accent/50',
    adm: 'text-adm-accent bg-adm-card border-adm-border focus-within:border-adm-accent/50',
  }[theme]

  // Дэлгэгдмэгц шууд бичиж эхлэх боломжтой байх
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Бичсэн зүйл байвал нээлттэй хэвээр үлдэнэ
  const shouldStayOpen = value.trim().length > 0

  const submit = e => {
    e.preventDefault()
    const q = value.trim()
    if (!q) return
    if (onSubmit) onSubmit(q)
    else navigate(`/employee/jobs?q=${encodeURIComponent(q)}`)
  }

  return (
    <form
      onSubmit={submit}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => !shouldStayOpen && setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={e => {
        if (!shouldStayOpen && !e.currentTarget.contains(e.relatedTarget)) setOpen(false)
      }}
      style={{ width: open ? '20rem' : '3rem' }}
      className={`flex items-center h-12 rounded-full border overflow-hidden
                  transition-all duration-300 ease-out ${accent}`}
    >
      <button
        type="submit"
        aria-label="Хайх"
        className="w-12 h-12 flex-shrink-0 flex items-center justify-center text-white"
      >
        <Search className="w-5 h-5" />
      </button>

      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        tabIndex={open ? 0 : -1}
        className={`flex-1 min-w-0 bg-transparent text-sm text-white placeholder-white/40
                    outline-none transition-opacity duration-200
                    ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      {value && (
        <button
          type="button"
          onClick={() => { setValue(''); inputRef.current?.focus() }}
          aria-label="Цэвэрлэх"
          className="w-10 h-12 flex-shrink-0 flex items-center justify-center text-white/50 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </form>
  )
}
