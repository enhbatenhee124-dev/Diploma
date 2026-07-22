import { useState } from 'react'
import { Search, Users, Mail, Shield, Ban, CheckCircle, MoreHorizontal, Filter } from 'lucide-react'

const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Employee', status: 'Active', joined: 'Dec 1, 2024' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Freelancer', status: 'Active', joined: 'Nov 15, 2024' },
  { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'Employee', status: 'Pending', joined: 'Dec 5, 2024' },
  { id: 4, name: 'Sarah Wilson', email: 'sarah@example.com', role: 'Freelancer', status: 'Active', joined: 'Oct 20, 2024' },
  { id: 5, name: 'David Brown', email: 'david@example.com', role: 'Employee', status: 'Suspended', joined: 'Sep 1, 2024' },
  { id: 6, name: 'Emily Davis', email: 'emily@example.com', role: 'Freelancer', status: 'Active', joined: 'Nov 28, 2024' },
]

const roles = ['All Roles', 'Employee', 'Freelancer']
const statuses = ['All Statuses', 'Active', 'Pending', 'Suspended']

export default function ManageUsers() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All Roles')
  const [statusFilter, setStatusFilter] = useState('All Statuses')

  const filtered = users.filter(u => {
    const matchSearch = search === '' || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'All Roles' || u.role === roleFilter
    const matchStatus = statusFilter === 'All Statuses' || u.status === statusFilter
    return matchSearch && matchRole && matchStatus
  })

  const statusColors = {
    Active: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    Pending: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    Suspended: 'text-red-400 bg-red-400/10 border-red-400/20',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold adm-text-heading">Manage Users</h1>
        <p className="mt-1 adm-text-body">View, filter, and manage all platform users.</p>
      </div>

      {/* Filters */}
      <div className="adm-card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-adm-muted" />
            <input type="text" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="adm-input pl-10" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="adm-input appearance-none pr-10 cursor-pointer">
            {roles.map(r => <option key={r} value={r} className="bg-adm-card">{r}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="adm-input appearance-none pr-10 cursor-pointer">
            {statuses.map(s => <option key={s} value={s} className="bg-adm-card">{s}</option>)}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="adm-card overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-adm-border">
              <th className="pb-3 pr-4 text-sm font-medium adm-text-body">User</th>
              <th className="pb-3 pr-4 text-sm font-medium adm-text-body">Role</th>
              <th className="pb-3 pr-4 text-sm font-medium adm-text-body">Status</th>
              <th className="pb-3 pr-4 text-sm font-medium adm-text-body">Joined</th>
              <th className="pb-3 text-sm font-medium adm-text-body text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-b border-adm-border last:border-0">
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-adm-accent/20 flex items-center justify-center text-sm font-bold text-adm-accent">
                      {u.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium adm-text-heading text-sm">{u.name}</p>
                      <p className="text-xs adm-text-body">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 pr-4">
                  <span className="adm-badge bg-adm-bg text-adm-muted border border-adm-border">{u.role}</span>
                </td>
                <td className="py-4 pr-4">
                  <span className={`adm-badge border ${statusColors[u.status]}`}>{u.status}</span>
                </td>
                <td className="py-4 pr-4 text-sm adm-text-body">{u.joined}</td>
                <td className="py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-1.5 rounded-lg hover:bg-adm-card-hover text-adm-muted hover:text-adm-text transition-colors">
                      <Shield className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-red-500/10 text-adm-muted hover:text-red-400 transition-colors">
                      <Ban className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-10 h-10 text-adm-muted mx-auto mb-2" />
            <p className="adm-text-body">No users found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
