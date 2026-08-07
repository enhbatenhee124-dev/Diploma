// ------------------------------
// Нэвтэрсэн хэрэглэгчийг хаашаа аваачих вэ
// ------------------------------
// Google-ээр нэвтэрсэн хүнд дүр нь автоматаар оноогддог тул (`handle_new_user`
// анхдагчаар 'employee' өгнө) эхлээд дүрээ БАТАЛГААЖУУЛСАН эсэхийг шалгана.
// Эс тэгвээс ажил олгогч болох гэсэн хүн ажил хайгчийн самбарт орно.

const HOME = {
  admin: '/admin/dashboard',
  employer: '/employer/dashboard',
  employee: '/employee/dashboard',
}

/**
 * @param {{role?: string, roleConfirmed?: boolean}|null} user
 * @returns {string} зам
 */
export function roleHome(user) {
  if (!user) return '/login'
  if (!user.roleConfirmed) return '/choose-role'
  return HOME[user.role] || '/'
}
