/** Мөнгөн дүнг төгрөгөөр форматлана. */
export function formatCurrency(amount) {
  const value = Number(amount) || 0
  return `${value.toLocaleString('mn-MN')} ₮`
}

const intervals = [
  ['жилийн', 31536000],
  ['сарын', 2592000],
  ['долоо хоногийн', 604800],
  ['өдрийн', 86400],
  ['цагийн', 3600],
  ['минутын', 60],
]

export function timeAgo(dateString) {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  for (const [unit, secondsInUnit] of intervals) {
    const interval = Math.floor(seconds / secondsInUnit)
    if (interval >= 1) {
      return `${interval} ${unit} өмнө`
    }
  }
  return 'Дөнгөж сая'
}

