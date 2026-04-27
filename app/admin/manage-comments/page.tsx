'use client'

import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { getUserRole } from '@/lib/auth-helper'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import { initializeArticles } from '@/lib/article-store'

interface Comment {
  id: number
  article: string
  author: string
  text: string
  createdAt: string
  status: 'approved' | 'flagged' | 'pending'
}

export default function ManageCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'flagged'>('all')
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

      loadComments()
      setLoading(false)
    }

    checkAdminAuth()
  }, [router])

  const loadComments = () => {
    const articles = initializeArticles()
    const allComments: Comment[] = []

    articles.forEach(article => {
      article.comments.forEach(comment => {
        allComments.push({
          id: comment.id,
          article: article.title,
          author: comment.author,
          text: comment.text,
          createdAt: comment.timestamp,
          status: 'approved' // Default to approved
        })

        // Add replies as separate comments
        comment.replies.forEach(reply => {
          allComments.push({
            id: reply.id,
            article: `${article.title} (Reply to ${comment.author})`,
            author: reply.author,
            text: reply.text,
            createdAt: reply.timestamp,
            status: 'approved'
          })
        })
      })
    })

    setComments(allComments)
  }

  const handleApproveComment = (id: number) => {
    setComments(comments.map(c =>
      c.id === id ? { ...c, status: 'approved' } : c
    ))
  }

  const handleFlagComment = (id: number) => {
    setComments(comments.map(c =>
      c.id === id ? { ...c, status: 'flagged' } : c
    ))
  }

  const handleDeleteComment = (id: number) => {
    if (confirm('Delete this comment?')) {
      setComments(comments.filter(c => c.id !== id))
    }
  }

  const filteredComments = comments.filter(c => filter === 'all' ? true : c.status === filter)

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
                href="/admin/manage-comments"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-red-500 text-sm font-medium text-gray-900"
              >
                Comments
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
            <h1 className="text-4xl font-bold text-gray-900">Moderate Comments</h1>
            <p className="text-gray-600 mt-2">Review and manage user comments across articles</p>
          </div>
          <button
            onClick={loadComments}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold shadow-lg hover:shadow-xl"
          >
            Refresh Comments
          </button>
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-3 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'all'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
            }`}
          >
            All ({comments.length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'approved'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
            }`}
          >
            Approved ({comments.filter(c => c.status === 'approved').length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'pending'
                ? 'bg-yellow-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
            }`}
          >
            Pending ({comments.filter(c => c.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('flagged')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'flagged'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
            }`}
          >
            Flagged ({comments.filter(c => c.status === 'flagged').length})
          </button>
        </div>

        {/* Comments */}
        <div className="space-y-4">
          {filteredComments.map(comment => (
            <div key={comment.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-gray-900">On: {comment.article}</p>
                    <p className="text-sm text-gray-600">By {comment.author} • {comment.createdAt}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    comment.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : comment.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {comment.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-700 bg-gray-50 p-3 rounded border border-gray-200 text-sm">{comment.text}</p>
              </div>

              <div className="flex gap-2 flex-wrap">
                {comment.status !== 'approved' && (
                  <button
                    onClick={() => handleApproveComment(comment.id)}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all text-sm font-semibold"
                  >
                    ✓ Approve
                  </button>
                )}
                {comment.status !== 'flagged' && (
                  <button
                    onClick={() => handleFlagComment(comment.id)}
                    className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-all text-sm font-semibold"
                  >
                    ⚠ Flag
                  </button>
                )}
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all text-sm font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredComments.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-600">No comments found</p>
          </div>
        )}
      </div>
    </div>
  )
}
