'use client'

import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { getUserRole } from '@/lib/auth-helper'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import { notifyUsersOfNewArticle } from '@/lib/notifications'
import {
  Article,
  loadArticles,
  addArticle,
  saveArticles,
  getNextArticleId
} from '@/lib/article-store'

export default function ManageArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newArticle, setNewArticle] = useState({ title: '', content: '', author: '' })
  const [message, setMessage] = useState('')
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
      setArticles(loadArticles())
      setLoading(false)
    }

    checkAdminAuth()
  }, [router])

  const handleAddArticle = async () => {
    if (!newArticle.title || !newArticle.content || !newArticle.author) {
      setMessage('Please fill all fields')
      return
    }

    const article: Article = {
      id: getNextArticleId(),
      ...newArticle,
      likes: 0,
      liked: false,
      comments: [],
      showComments: false,
      createdAt: new Date().toISOString().split('T')[0]
    }

    const updatedArticles = addArticle(article)
    setArticles(updatedArticles)
    setNewArticle({ title: '', content: '', author: '' })
    setShowForm(false)
    setMessage('Article added successfully!')

    // Send notifications to all users
    const userEmails = ['user1@example.com', 'user2@example.com'] // In production, fetch from database
    await notifyUsersOfNewArticle(userEmails, article.title, article.author)

    setTimeout(() => setMessage(''), 3000)
  }

  const handleDeleteArticle = (id: number) => {
    if (confirm('Are you sure you want to delete this article?')) {
      const updatedArticles = articles.filter(a => a.id !== id)
      setArticles(updatedArticles)
      saveArticles(updatedArticles)
      setMessage('Article deleted successfully!')
      setTimeout(() => setMessage(''), 3000)
    }
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
                href="/admin/manage-articles"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-red-500 text-sm font-medium text-gray-900"
              >
                Articles
              </Link>
            </div>
            <Link href="/auth" className="text-sm text-gray-600 hover:text-gray-900 font-semibold">
              Logout
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Manage Articles</h1>
            <p className="text-gray-600 mt-2">Create, edit, and delete articles</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-semibold shadow-lg hover:shadow-xl"
          >
            {showForm ? 'Cancel' : '+ New Article'}
          </button>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg font-medium flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {message}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-100 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Article</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Article Title</label>
                <input
                  type="text"
                  value={newArticle.title}
                  onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter article title"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Author</label>
                <input
                  type="text"
                  value={newArticle.author}
                  onChange={(e) => setNewArticle({ ...newArticle, author: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter author name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Content</label>
                <textarea
                  value={newArticle.content}
                  onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 h-32"
                  placeholder="Enter article content"
                />
              </div>
              <button
                onClick={handleAddArticle}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-semibold"
              >
                Create Article & Send Notifications
              </button>
            </div>
          </div>
        )}

        {/* Articles List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map(article => (
            <div key={article.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl transition-shadow">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{article.title}</h3>
                <p className="text-sm text-gray-600 mb-2">By {article.author} • {article.createdAt}</p>
                <p className="text-gray-700 line-clamp-2">{article.content}</p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-sm font-semibold text-red-600">{article.likes} likes</span>
                <button
                  onClick={() => handleDeleteArticle(article.id)}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all text-sm font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {articles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No articles yet. Create your first article!</p>
          </div>
        )}
      </div>
    </div>
  )
}
