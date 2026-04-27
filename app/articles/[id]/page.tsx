'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { getUserRole } from '@/lib/auth-helper'
import { User } from '@supabase/supabase-js'
import {
  Article,
  Comment,
  initializeArticles,
  saveArticles,
  makeAuthorEmail
} from '@/lib/article-store'
import {
  notifyAuthorOfLike,
  notifyAuthorOfComment,
  getNotificationQueue,
  EmailNotification
} from '@/lib/notifications'

interface ArticleDetailPageProps {
  params: {
    id: string
  }
}

export default function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const [article, setArticle] = useState<Article | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [notificationCount, setNotificationCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [userNotifications, setUserNotifications] = useState<EmailNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const router = useRouter()
  const articleId = parseInt(params.id, 10)

  useEffect(() => {
    const init = async () => {
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

      setUser(session.user)
      setRole(await getUserRole())

      const stored = initializeArticles()
      const current = stored.find(item => item.id === articleId)
      if (!current) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setArticle(current)
      setLoading(false)
    }

    init()
  }, [articleId, router])

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
  const saveArticleState = (updatedArticle: Article) => {
    const articles = initializeArticles().map(item => item.id === updatedArticle.id ? updatedArticle : item)
    saveArticles(articles)
    setArticle(updatedArticle)
  }

  const toggleLike = async () => {
    if (!article) return

    const updated = {
      ...article,
      liked: !article.liked,
      likes: article.liked ? article.likes - 1 : article.likes + 1
    }

    saveArticleState(updated)
    if (updated.liked) {
      const authorEmail = makeAuthorEmail(updated.author)
      await notifyAuthorOfLike(authorEmail, updated.title, user?.email || 'anonymous@example.com')
      refreshNotificationCount()
    }
  }

  const addComment = async (text: string) => {
    if (!article || !text.trim()) return

    const newComment: Comment = {
      id: Date.now(),
      author: user?.email || 'Anonymous',
      text,
      timestamp: new Date().toLocaleString(),
      replies: [],
      showReplies: false
    }

    const updatedArticle = {
      ...article,
      comments: [...article.comments, newComment]
    }

    saveArticleState(updatedArticle)
    const authorEmail = makeAuthorEmail(updatedArticle.author)
    await notifyAuthorOfComment(authorEmail, updatedArticle.title, newComment.author, newComment.text)
    refreshNotificationCount()
  }

  const addReply = (articleIdParam: number, parentCommentId: number, text: string) => {
    if (!article || !text.trim()) return

    const newReply: Comment = {
      id: Date.now(),
      author: user?.email || 'Anonymous',
      text,
      timestamp: new Date().toLocaleString(),
      replies: [],
      showReplies: false
    }

    const updatedArticle = {
      ...article,
      comments: article.comments.map(comment =>
        comment.id === parentCommentId
          ? { ...comment, replies: [...comment.replies, newReply] }
          : comment
      )
    }

    saveArticleState(updatedArticle)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading article...</div>
      </div>
    )
  }

  if (notFound || !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-gray-200 max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Article not found</h1>
          <p className="text-gray-600 mb-6">The article you are looking for may have been removed or the link is invalid.</p>
          <Link href="/articles" className="inline-flex px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">Back to Articles</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex space-x-8">
              <Link
                href="/articles"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                Back to Articles
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <button
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

      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-xl p-10 border border-gray-100">
          <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{article.title}</h1>
              <p className="text-sm text-gray-500">By {article.author} • {article.createdAt}</p>
            </div>
            <button
              onClick={toggleLike}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition-all duration-200 ${article.liked ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'}`}
            >
              <svg className={`w-4 h-4 ${article.liked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {article.likes} Likes
            </button>
          </div>

          <div className="prose prose-lg max-w-none text-gray-700 mb-10">
            <p>{article.content}</p>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Comments ({article.comments.length})</h2>
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
                <p className="text-gray-500 text-sm">No comments yet. Be the first to leave feedback.</p>
              )}
            </div>
            <AddCommentForm onAddComment={addComment} />
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
    <div className="bg-gray-50 rounded-3xl p-5 border border-gray-200">
      <div className="flex items-center justify-between mb-3 gap-4">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{comment.author}</p>
          <p className="text-xs text-gray-500">{comment.timestamp}</p>
        </div>
        <button
          onClick={() => setShowReplyForm(!showReplyForm)}
          className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
        >
          Reply
        </button>
      </div>
      <p className="text-gray-700 mb-4">{comment.text}</p>

      {showReplyForm && (
        <div className="mt-3 border-t border-gray-200 pt-3">
          <ReplyForm
            onAddReply={(text) => {
              onAddReply(articleId, comment.id, text)
              setShowReplyForm(false)
            }}
          />
        </div>
      )}

      {comment.replies.length > 0 && (
        <div className="mt-4 ml-4 space-y-3 border-l border-gray-200 pl-4">
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <input
        type="text"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your thoughts..."
        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
      <button
        type="submit"
        className="px-5 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-semibold text-sm"
      >
        Post Comment
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <input
        type="text"
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Write a reply..."
        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
      <button
        type="submit"
        className="px-5 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-semibold text-sm"
      >
        Reply
      </button>
    </form>
  )
}
