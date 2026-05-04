'use client'

import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { getUserRole } from '@/lib/auth-helper'
import { getNotificationQueue } from '@/lib/notifications'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [notificationCount, setNotificationCount] = useState(0)
  const [loading, setLoading] = useState(true)
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
      setRole(userRole)
      setLoading(false)
      setNotificationCount(getNotificationQueue().length)
    }

    checkAdminAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  const adminStats = [
    { label: 'Total Articles', value: '15' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex space-x-8">
              <Link
                href="/admin"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-red-500 text-sm font-medium text-gray-900"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/manage-articles"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
              >
                Articles
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {notificationCount > 0 && (
                <div className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute -right-1 -top-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold leading-none text-white bg-red-600 rounded-full">{notificationCount}</span>
                </div>
              )}
              <div className="text-sm">
                <span className="font-semibold text-red-600">ADMIN</span> • {user?.email}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">A clean admin home for managing articles.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/admin/manage-articles"
            className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:shadow-2xl hover:border-orange-300 transition-all duration-300 group cursor-pointer"
          >
            <div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">Manage Articles</h3>
              <p className="text-gray-600 mt-1">Create and manage articles for the portal.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
