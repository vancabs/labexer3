'use client'

import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { getUserRole } from '@/lib/auth-helper'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import {
  getNotificationQueue,
  clearNotificationQueue,
  createSystemNotification,
  addEmailNotification
} from '@/lib/notifications'

interface Notification {
  id: number
  type: 'new-article' | 'new-comment' | 'article-liked' | 'system'
  recipientEmail: string
  subject: string
  message: string
  sentAt: string
  status: 'sent' | 'pending' | 'failed'
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newNotification, setNewNotification] = useState({ subject: '', message: '' })
  const [statusMessage, setStatusMessage] = useState('')
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
      loadNotifications()
      setLoading(false)
    }

    checkAdminAuth()

    // Auto-refresh notifications every 5 seconds
    const interval = setInterval(() => {
      loadNotifications()
    }, 5000)

    return () => clearInterval(interval)
  }, [router])

  const loadNotifications = () => {
    setNotifications(getNotificationQueue().map((notification, index) => ({
      id: index + 1,
      type: notification.type,
      recipientEmail: notification.recipientEmail,
      subject: notification.subject,
      message: notification.message,
      sentAt: notification.timestamp,
      status: 'sent'
    })))
  }

  const handleSendNotification = async () => {
    if (!newNotification.subject || !newNotification.message) {
      setStatusMessage('Please fill all fields')
      return
    }

    const notification = createSystemNotification(
      'all-users@example.com',
      newNotification.subject,
      newNotification.message
    )

    addEmailNotification(notification)

    setNotifications(prev => [
      ...prev,
      {
        id: prev.length + 1,
        type: notification.type,
        recipientEmail: notification.recipientEmail,
        subject: notification.subject,
        message: notification.message,
        sentAt: notification.timestamp,
        status: 'sent'
      }
    ])

    setNewNotification({ subject: '', message: '' })
    setShowForm(false)
    setStatusMessage('Notification sent to all users successfully!')
    setTimeout(() => setStatusMessage(''), 3000)
  }

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
                href="/admin/notifications"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-red-500 text-sm font-medium text-gray-900"
              >
                Notifications
              </Link>
            </div>
            <Link href="/auth" className="text-sm text-gray-600 hover:text-gray-900 font-semibold">
              Logout
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Notifications Management</h1>
            <p className="text-gray-600 mt-2">Send email notifications to all users</p>
          </div>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={loadNotifications}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold shadow-lg hover:shadow-xl"
            >
              Refresh
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-semibold shadow-lg hover:shadow-xl"
            >
              {showForm ? 'Cancel' : '+ Send Notification'}
            </button>
            <button
              onClick={() => {
                clearNotificationQueue()
                setNotifications([])
                setStatusMessage('Notification history cleared')
                setTimeout(() => setStatusMessage(''), 3000)
              }}
              className="px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-all font-semibold shadow-lg hover:shadow-xl"
            >
              Clear History
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg font-medium flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {statusMessage}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-100 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send New Notification</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={newNotification.subject}
                  onChange={(e) => setNewNotification({ ...newNotification, subject: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Notification subject"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                <textarea
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 h-32"
                  placeholder="Notification message"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-blue-800">
                <p className="font-semibold">📧 Recipients: All 248 active users</p>
                <p className="mt-1">This notification will be sent to all registered users via email</p>
              </div>
              <button
                onClick={handleSendNotification}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-semibold"
              >
                Send to All Users
              </button>
            </div>
          </div>
        )}

        {/* Sent Notifications */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sent Notifications</h2>
          <div className="space-y-4">
            {notifications.map(notif => (
              <div key={notif.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="mb-1">
                      <h3 className="text-lg font-bold text-gray-900">{notif.subject}</h3>
                      <p className="text-gray-600 text-sm">{notif.message}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                    {notif.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 text-sm">
                  <div className="flex gap-4 text-gray-600">
                    <span>To: {notif.recipientEmail}</span>
                    <span>{notif.sentAt}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-12 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-gray-700">
            <span className="font-semibold">Note:</span> Notifications are sent to all active users automatically. When a new article is created, users will receive an email notification about it. You can also send custom notifications from here.
          </p>
        </div>
      </div>
    </div>
  )
}
