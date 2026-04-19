'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCallback } from 'react'

interface Article {
  id: number
  title: string
  content: string
  likes: number
  liked: boolean
  comments: string[]
  showComments: boolean
}

const initialArticles: Article[] = [
  {
    id: 1,
    title: 'The Future of Technology',
    content: 'Technology is evolving rapidly, bringing new opportunities and challenges. From artificial intelligence to quantum computing, the future holds endless possibilities.',
    likes: 15,
    liked: false,
    comments: ['Great article!', 'Very insightful.', 'Looking forward to more.'],
    showComments: false
  },
  {
    id: 2,
    title: 'Sustainable Living',
    content: 'Adopting sustainable practices is crucial for our planet\'s future. Simple changes in daily habits can make a significant impact on environmental conservation.',
    likes: 23,
    liked: false,
    comments: ['Important topic!', 'We all need to contribute.', 'Well written.'],
    showComments: false
  },
  {
    id: 3,
    title: 'Mental Health Awareness',
    content: 'Mental health is just as important as physical health. Understanding and supporting mental wellness helps create a healthier society for everyone.',
    likes: 31,
    liked: false,
    comments: ['Thank you for this.', 'Very timely.', 'Great reminder.'],
    showComments: false
  }
]

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>(initialArticles)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<number | null>(null)
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
      }
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const toggleLike = (id: number) => {
    setArticles(articles.map(article =>
      article.id === id
        ? {
            ...article,
            liked: !article.liked,
            likes: article.liked ? article.likes - 1 : article.likes + 1
          }
        : article
    ))
  }

  const toggleComments = (id: number) => {
    setArticles(articles.map(article =>
      article.id === id
        ? { ...article, showComments: !article.showComments }
        : article
    ))
  }

  const handleShare = useCallback((articleId: number, articleTitle: string) => {
    const url = `${window.location.origin}/articles?article=${articleId}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(articleId)
      setTimeout(() => setCopiedId(null), 2000)
    }).catch((err) => {
      console.error('Failed to copy link:', err)
    })
  }, [])

  const handleLogout = async () => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      router.push('/auth')
      return
    }
    
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const addComment = (id: number, comment: string) => {
    if (comment.trim()) {
      setArticles(articles.map(article =>
        article.id === id
          ? { ...article, comments: [...article.comments, comment] }
          : article
      ))
    }
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
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Articles Content */}
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Latest Articles</h1>
          <p className="text-xl text-gray-600">Discover insights and stories from our community</p>
        </div>
        <div className="space-y-8">
          {articles.map(article => (
            <div key={article.id} className="bg-white rounded-xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">{article.title}</h2>
                  <p className="text-gray-700 leading-relaxed text-lg">{article.content}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => toggleLike(article.id)}
                    className={`inline-flex items-center px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      article.liked
                        ? 'bg-red-100 text-red-700 border-2 border-red-300 hover:bg-red-200'
                        : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    <svg className={`w-5 h-5 mr-2 ${article.liked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {article.liked ? 'Liked' : 'Like'} ({article.likes})
                  </button>
                  
                  <button
                    onClick={() => toggleComments(article.id)}
                    className="inline-flex items-center px-6 py-3 bg-blue-100 text-blue-700 border-2 border-blue-300 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-all duration-200"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Comments ({article.comments.length})
                  </button>

                  <button
                    onClick={() => handleShare(article.id, article.title)}
                    className={`inline-flex items-center px-6 py-3 border-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      copiedId === article.id
                        ? 'bg-green-100 text-green-700 border-green-300'
                        : 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200'
                    }`}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={copiedId === article.id ? "M5 13l4 4L19 7" : "M8.684 13.342C9.589 12.113 10.424 11.854 11.192 11.854c2.26 0 2.889 1.692 4.156 4.015.173.36.36.748.568 1.154 2.456 4.537 2.989 5.144 3.58 5.144 1.867 0 2.857-1.368 2.857-3.77v-.734c0-1.79-.424-2.889-.867-3.687-.738-1.265-1.741-1.957-3.063-1.957-1.707 0-3.185 1.384-3.624 2.701-.41.317-.828.537-1.215.537-.833 0-1.592-.624-2.053-1.73-.34-.766-.656-1.545-.996-2.493C14.981 3.506 13.72 1 10.633 1 7.539 1 5.849 2.95 5.13 5.456c-.33.99-.509 2.208-.882 3.996m0 0v1.89"} />
                    </svg>
                    {copiedId === article.id ? 'Copied!' : 'Share'}
                  </button>
                </div>
              </div>
              {article.showComments && (
                <div className="mt-8 border-t border-gray-100 pt-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Comments
                  </h3>
                  <div className="space-y-4 mb-6">
                    {article.comments.map((comment, index) => (
                      <div key={index} className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                        <p className="text-gray-800 font-medium">{comment}</p>
                      </div>
                    ))}
                  </div>
                  <AddCommentForm onAddComment={(comment) => addComment(article.id, comment)} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AddCommentForm({ onAddComment }: { onAddComment: (comment: string) => void }) {
  const [comment, setComment] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddComment(comment)
    setComment('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex space-x-3">
      <div className="flex-1 relative">
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts..."
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
        <svg className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <button
        type="submit"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
      >
        Comment
      </button>
    </form>
  )
}