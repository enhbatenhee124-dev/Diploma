// ------------------------------
// Төлбөрийн тохиргоо
// ------------------------------
// QPay мерчант гэрээ байгуулах хүртэл дансаар шилжүүлэх аргаар ажиллана.
// Доорх дансны мэдээллийг ӨӨРИЙН данснаас солино уу.
// ------------------------------

export const BANK_ACCOUNT = {
  bank: 'Хаан банк',
  number: '5000 0000 0000',
  holder: 'МонголАжил ХХК',
}

/** Гүйлгээний утга — админ хэн төлснийг таних боломжтой байх ёстой. */
export function paymentReference(invoice) {
  // Нэхэмжлэлийн ID-ийн эхний 8 тэмдэгт хангалттай давтагдашгүй
  return `MA-${String(invoice?.id || '').slice(0, 8).toUpperCase()}`
}

export const SUBSCRIPTION_STATUS = {
  trialing: { label: 'Туршилтын хугацаа', tone: 'bg-blue-500/15 text-blue-200 border-blue-500/25' },
  active: { label: 'Идэвхтэй', tone: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/25' },
  grace: { label: 'Хугацаа дууссан', tone: 'bg-amber-500/15 text-amber-200 border-amber-500/25' },
  expired: { label: 'Хаагдсан', tone: 'bg-red-500/15 text-red-200 border-red-500/25' },
  cancelled: { label: 'Цуцлагдсан', tone: 'bg-white/10 text-white/70 border-white/20' },
}

export const INVOICE_STATUS = {
  pending: { label: 'Хүлээгдэж буй', tone: 'bg-amber-500/15 text-amber-200 border-amber-500/25' },
  paid: { label: 'Төлөгдсөн', tone: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/25' },
  expired: { label: 'Хугацаа дууссан', tone: 'bg-white/10 text-white/60 border-white/20' },
  cancelled: { label: 'Цуцлагдсан', tone: 'bg-white/10 text-white/60 border-white/20' },
}
