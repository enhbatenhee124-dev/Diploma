import { formatDate } from '../utils/helpers'
import { Shield, User, Briefcase, MoreHorizontal, Edit, Trash2, Ban } from 'lucide-react'
import { useState } from 'react'

const roleIcons = {
  admin: Shield,
  employee: User,
  worker: Briefcase
}

const roleColors = {
  admin: 'bg-purple-100 text-purple-700',
  employee: 'bg-blue-100 text-blue-700',
  worker: 'bg-green-100 text-green-700'
}

const statusColors = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-700'
}

export default function UserTable({ users, onEdit, onDelete, onToggleStatus }) {
  const [openMenu, setOpenMenu] = useState(null)

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity</th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const RoleIcon = roleIcons[user.role] || User
            return (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                    <RoleIcon className="w-3 h-3" />
                    {user.role}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[user.status] || statusColors.inactive}`}>
                    {user.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">{formatDate(user.joined)}</td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {user.applications !== undefined ? `${user.applications} applications` : `${user.jobs || 0} jobs`}
                </td>
                <td className="py-3 px-4 text-right relative">
                  <button onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)} className="p-1 hover:bg-gray-200 rounded-lg">
                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                  </button>
                  {openMenu === user.id && (
                    <div className="absolute right-4 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 w-36">
                      <button onClick={() => { onEdit?.(user); setOpenMenu(null) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Edit className="w-4 h-4" /> Edit
                      </button>
                      <button onClick={() => { onToggleStatus?.(user); setOpenMenu(null) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Ban className="w-4 h-4" /> Toggle Status
                      </button>
                      <button onClick={() => { onDelete?.(user); setOpenMenu(null) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
