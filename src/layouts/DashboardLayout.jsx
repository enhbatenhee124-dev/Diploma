import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const bgMap = {
  employee: 'bg-emp-bg',
  worker: 'bg-wrk-bg',
  admin: 'bg-adm-bg',
}

export default function DashboardLayout({ role }) {
  return (
    <div className={`min-h-screen ${bgMap[role]} flex dark-scrollbar`}>
      <Sidebar role={role} />
      <main className="flex-1 ml-64 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
