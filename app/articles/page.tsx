'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { getUserRole } from '@/lib/auth-helper'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import {
  Article,
  Comment,
  initializeArticles,
  saveArticles,
  makeAuthorEmail
} from '@/lib/article-store'
import {
  getNotificationQueue,
  notifyAuthorOfLike,
  notifyAuthorOfComment,
  EmailNotification
} from '@/lib/notifications'

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>(() => initializeArticles())
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [notificationCount, setNotificationCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [userNotifications, setUserNotifications] = useState<EmailNotification[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseClient()
      if (!supabase) {
        router.push('/auth')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
      } else {
        setUser(session.user)
        const userRole = await getUserRole()
        setRole(userRole)
      }
      setLoading(false)
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    if (user?.email) {
      const allNotifications = getNotificationQueue()
      setNotificationCount(allNotifications.length)
      const userNotifs = allNotifications.filter(n => n.recipientEmail === user.email)
      setUserNotifications(userNotifs)
    }
  }, [user?.email])

  const refreshNotificationCount = () => {
    const allNotifications = getNotificationQueue()
    setNotificationCount(allNotifications.length)
    if (user?.email) {
      const userNotifs = allNotifications.filter(n => n.recipientEmail === user.email)
      setUserNotifications(userNotifs)
    }
  }

  const toggleLike = async (id: number) => {
    let likedArticle: Article | undefined
    setArticles(prevArticles => {
      const updatedArticles = prevArticles.map(article =>
        article.id === id
          ? {
              ...article,
              liked: !article.liked,
              likes: article.liked ? article.likes - 1 : article.likes + 1
            }
          : article
      )
      likedArticle = updatedArticles.find(article => article.id === id)
      saveArticles(updatedArticles)
      return updatedArticles
    })

    if (likedArticle && likedArticle.liked) {
      const authorEmail = makeAuthorEmail(likedArticle.author)
      await notifyAuthorOfLike(authorEmail, likedArticle.title, user?.email || 'anonymous@example.com')
      refreshNotificationCount()
    }
  }

  const toggleComments = (id: number) => {
    setArticles(articles.map(article =>
      article.id === id
        ? { ...article, showComments: !article.showComments }
        : article
    ))
  }

  const addComment = async (id: number, text: string) => {
    if (!text.trim()) return

    const newComment: Comment = {
      id: Date.now(),
      author: user?.email || 'Anonymous',
      text,
      timestamp: new Date().toLocaleString(),
      replies: [],
      showReplies: false
    }

    let targetArticle: Article | undefined

    setArticles(prevArticles => {
      const updatedArticles = prevArticles.map(article =>
        article.id === id
          ? { ...article, comments: [...article.comments, newComment] }
          : article
      )
      targetArticle = updatedArticles.find(article => article.id === id)
      saveArticles(updatedArticles)
      return updatedArticles
    })

    if (targetArticle) {
      const authorEmail = makeAuthorEmail(targetArticle.author)
      await notifyAuthorOfComment(authorEmail, targetArticle.title, newComment.author, newComment.text)
      refreshNotificationCount()
    }
  }

  const addReply = (articleId: number, parentCommentId: number, text: string) => {
    if (!text.trim()) return

    const newReply: Comment = {
      id: Date.now(),
      author: user?.email || 'Anonymous',
      text,
      timestamp: new Date().toLocaleString(),
      replies: [],
      showReplies: false
    }

    setArticles(prevArticles => {
      const updatedArticles = prevArticles.map(article =>
        article.id === articleId
          ? {
              ...article,
              comments: article.comments.map(comment =>
                comment.id === parentCommentId
                  ? { ...comment, replies: [...comment.replies, newReply] }
                  : comment
              )
            }
          : article
      )
      saveArticles(updatedArticles)
      return updatedArticles
    })
  }

  const shareArticle = (article: Article) => {
    const shareText = `Check out this article: "${article.title}" - ${window.location.origin}/articles`
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: shareText,
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText)
      alert('Article link copied to clipboard!')
    }
  }

  // Get top 5 articles by likes
  const topArticles = [...articles].sort((a, b) => b.likes - a.likes).slice(0, 5)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex space-x-8">
              <Link
                href="/profile"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
              >
                Profile
              </Link>
              <Link
                href="/articles"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-blue-500 text-sm font-medium text-gray-900"
              >
                Articles
              </Link>
              {role === 'admin' && (
                <Link
                  href="/admin"
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
                >
                  Admin
                </Link>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                aria-label="Notifications"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold leading-none text-white bg-red-600 rounded-full">{notificationCount}</span>
                )}
              </button>
              {role && <span className="text-sm font-semibold text-gray-700">{role.toUpperCase()}</span>}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Top 5 Most Liked Articles */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Top 5 Most Liked Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {topArticles.map((article, index) => (
              <div key={article.id} className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 border-2 border-yellow-200 hover:border-yellow-400 transition-all">
                <div className="text-3xl font-bold text-yellow-600 mb-2">#{index + 1}</div>
                <h3 className="font-bold text-gray-900 text-sm mb-2 line-clamp-2">{article.title}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-red-600">{article.likes}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* All Articles */}
        <div>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">All Articles</h1>
            <p className="text-xl text-gray-600">Discover, like, share, and comment on articles</p>
          </div>
          <div className="space-y-8">
            {articles.map(article => (
              <div key={article.id} className="bg-white rounded-xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                    <Link href={`/articles/${article.id}`} className="inline-flex items-center text-2xl font-bold text-gray-900 mb-1 hover:text-blue-700 transition-colors">
                      {article.title}
                    </Link>
                    <p className="text-sm text-gray-500">By {article.author} • {article.createdAt}</p>
                  </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-lg">{article.content}</p>
                </div>
                
                <div className="flex items-center justify-between pt-6 border-t border-gray-100 flex-wrap gap-4">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleLike(article.id)}
                      className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        article.liked
                          ? 'bg-red-100 text-red-700 border-2 border-red-300 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      <svg className={`w-4 h-4 mr-1 ${article.liked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {article.likes}
                    </button>
                    
                    <button
                      onClick={() => toggleComments(article.id)}
                      className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 border-2 border-blue-300 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-all duration-200"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {article.comments.length}
                    </button>

                    <button
                      onClick={() => shareArticle(article)}
                      className="inline-flex items-center px-4 py-2 bg-green-100 text-green-700 border-2 border-green-300 rounded-lg text-sm font-semibold hover:bg-green-200 transition-all duration-200"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C9.389 10.881 12.054 9 15.493 9c3.498 0 6.057 1.891 6.747 4.168M9 19h2.4c1.165 0 2.505.944 2.974 2.951M4 12h4m12 0h4" />
                      </svg>
                      Share
                    </button>
                  </div>
                </div>

                {article.showComments && (
                  <div className="mt-8 border-t border-gray-100 pt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Comments ({article.comments.length})</h3>
                    <div className="space-y-4 mb-6">
                      {article.comments.length > 0 ? (
                        article.comments.map(comment => (
                          <CommentThread
                            key={comment.id}
                            comment={comment}
                            articleId={article.id}
                            onAddReply={addReply}
                          />
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No comments yet. Be the first to comment!</p>
                      )}
                    </div>
                    <AddCommentForm onAddComment={(text) => addComment(article.id, text)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications Modal */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Your Notifications</h2>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-96">
              {userNotifications.length > 0 ? (
                <div className="space-y-4">
                  {userNotifications.map((notification, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 text-sm">{notification.subject}</h3>
                        <span className="text-xs text-gray-500">{new Date(notification.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-700 text-sm">{notification.message}</p>
                      <div className="mt-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          notification.type === 'new-comment' ? 'bg-blue-100 text-blue-800' :
                          notification.type === 'article-liked' ? 'bg-red-100 text-red-800' :
                          notification.type === 'new-article' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {notification.type.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-gray-500">No notifications yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CommentThread({ comment, articleId, onAddReply }: { comment: Comment; articleId: number; onAddReply: (articleId: number, commentId: number, text: string) => void }) {
  const [showReplyForm, setShowReplyForm] = useState(false)

  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{comment.author}</p>
          <p className="text-xs text-gray-500">{comment.timestamp}</p>
        </div>
      </div>
      <p className="text-gray-800 mb-3">{comment.text}</p>
      
      <button
        onClick={() => setShowReplyForm(!showReplyForm)}
        className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
      >
        Reply
      </button>

      {showReplyForm && (
        <div className="mt-3 border-t border-gray-300 pt-3">
          <ReplyForm
            onAddReply={(text) => {
              onAddReply(articleId, comment.id, text)
              setShowReplyForm(false)
            }}
          />
        </div>
      )}

      {comment.replies.length > 0 && (
        <div className="mt-4 ml-4 border-l-2 border-gray-300 pl-4 space-y-3">
          {comment.replies.map(reply => (
            <CommentThread
              key={reply.id}
              comment={reply}
              articleId={articleId}
              onAddReply={onAddReply}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AddCommentForm({ onAddComment }: { onAddComment: (text: string) => void }) {
  const [comment, setComment] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (comment.trim()) {
      onAddComment(comment)
      setComment('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <input
        type="text"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your thoughts..."
        className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold text-sm"
      >
        Post
      </button>
    </form>
  )
}

function ReplyForm({ onAddReply }: { onAddReply: (text: string) => void }) {
  const [reply, setReply] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (reply.trim()) {
      onAddReply(reply)
      setReply('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <input
        type="text"
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Write a reply..."
        className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-semibold"
      >
        Reply
      </button>
    </form>
  )
}