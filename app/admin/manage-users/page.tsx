'use client'

import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { getUserRole } from '@/lib/auth-helper'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User as SupabaseUser } from '@supabase/supabase-js'

interface User {
  id: string
  email: string
  role: 'admin' | 'user'
  createdAt: string
  status: 'active' | 'inactive'
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([
    { id: '1', email: 'admin@example.com', role: 'admin', createdAt: '2026-01-15', status: 'active' },
    { id: '2', email: 'student1@example.com', role: 'user', createdAt: '2026-02-10', status: 'active' },
    { id: '3', email: 'student2@example.com', role: 'user', createdAt: '2026-02-12', status: 'active' },
    { id: '4', email: 'student3@example.com', role: 'user', createdAt: '2026-03-05', status: 'inactive' }
  ])
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'admin' | 'user'>('all')
  const router = useRouter()

  useEffect(() => {
    const checkAdminAuth = async () => {
      const supabase = getSupabaseClient()
      if (!supabase) {
        router.push('/auth')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
        return
      }

      const userRole = await getUserRole()
      if (userRole !== 'admin') {
        router.push('/articles')
        return
      }

      setUser(session.user)
      setLoading(false)
    }

    checkAdminAuth()
  }, [router])

  const handleToggleStatus = (id: string) => {
    setUsers(users.map(u =>
      u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
    ))
  }

  const filteredUsers = users.filter(u => filter === 'all' ? true : u.role === filter)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex space-x-8">
              <Link
                href="/admin"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/manage-users"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-red-500 text-sm font-medium text-gray-900"
              >
                Users
              </Link>
            </div>
            <Link href="/auth" className="text-sm text-gray-600 hover:text-gray-900 font-semibold">
              Logout
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-gray-600 mt-2">View and manage user accounts and roles</p>
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'all'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
            }`}
          >
            All Users ({users.length})
          </button>
          <button
            onClick={() => setFilter('admin')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'admin'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
            }`}
          >
            Admins ({users.filter(u => u.role === 'admin').length})
          </button>
          <button
            onClick={() => setFilter('user')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'user'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
            }`}
          >
            Students ({users.filter(u => u.role === 'user').length})
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Joined</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">{u.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        u.role === 'admin'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{u.createdAt}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        u.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-all text-xs font-semibold"
                      >
                        {u.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-600">No users found</p>
          </div>
        )}
      </div>
    </div>
  )
}
