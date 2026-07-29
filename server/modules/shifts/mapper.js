// Өгөгдлийн сан snake_case, frontend camelCase.
// Хөрвүүлэлт ЗӨВХӨН энд болно — модулиас гарах бүх өгөгдөл эндүүр өнгөрнө.

export const toShift = r => r && ({
  id: r.id,
  employerId: r.employer_id,
  title: r.title,
  category: r.category,
  description: r.description,
  district: r.district,
  lat: r.lat,
  lng: r.lng,
  startAt: r.start_at,
  endAt: r.end_at,
  hourlyWage: r.hourly_wage,
  slots: r.slots,
  status: r.status,
  createdAt: r.created_at,
})
