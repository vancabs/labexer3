'use client'

import { saveEmailNotification, createArticleLikedNotification, createNewCommentNotification } from './notifications'

export interface Comment {
  id: number
  author: string
  text: string
  timestamp: string
  replies: Comment[]
  showReplies: boolean
}

export interface Article {
  id: number
  title: string
  content: string
  author: string
  likes: number
  liked: boolean
  comments: Comment[]
  showComments: boolean
  createdAt: string
}

const STORAGE_KEY = 'studentPortal.articles'
const isClient = typeof window !== 'undefined'

const defaultArticles: Article[] = [
  {
    id: 1,
    title: 'The Future of Technology',
    content: 'Technology is evolving rapidly, bringing new opportunities and challenges. From artificial intelligence to quantum computing, the future holds endless possibilities.',
    author: 'Dr. Tech',
    likes: 45,
    liked: false,
    comments: [],
    showComments: false,
    createdAt: '2026-04-20'
  },
  {
    id: 2,
    title: 'Sustainable Living',
    content: 'Adopting sustainable practices is crucial for our planet\'s future. Simple changes in daily habits can make a significant impact on environmental conservation.',
    author: 'Eco Warrior',
    likes: 62,
    liked: false,
    comments: [],
    showComments: false,
    createdAt: '2026-04-18'
  },
  {
    id: 3,
    title: 'Mental Health Awareness',
    content: 'Mental health is just as important as physical health. Understanding and supporting mental wellness helps create a healthier society for everyone.',
    author: 'Health Expert',
    likes: 58,
    liked: false,
    comments: [],
    showComments: false,
    createdAt: '2026-04-16'
  }
]

function readArticlesFromStorage(): Article[] {
  if (!isClient) return []
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return []

  try {
    return JSON.parse(raw) as Article[]
  } catch (error) {
    console.error('Failed to parse stored articles:', error)
    return []
  }
}

function persistArticles(articles: Article[]) {
  if (!isClient) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(articles))
}

export function initializeArticles(): Article[] {
  const stored = readArticlesFromStorage()
  if (stored.length > 0) {
    return stored
  }

  persistArticles(defaultArticles)
  return defaultArticles
}

export function loadArticles(): Article[] {
  const stored = readArticlesFromStorage()
  return stored.length > 0 ? stored : defaultArticles
}

export function saveArticles(articles: Article[]) {
  persistArticles(articles)
}

export function addArticle(article: Article): Article[] {
  const articles = loadArticles()
  const updated = [...articles, article]
  persistArticles(updated)
  return updated
}

export function updateArticle(articleId: number, updater: (article: Article) => Article): Article[] {
  const articles = loadArticles()
  const updated = articles.map(article =>
    article.id === articleId ? updater(article) : article
  )
  persistArticles(updated)
  return updated
}

export function getNextArticleId(): number {
  const articles = loadArticles()
  return articles.length > 0 ? Math.max(...articles.map(article => article.id)) + 1 : 1
}

export function makeAuthorEmail(authorName: string) {
  const emailName = authorName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '')
  return `${emailName || 'author'}@example.com`
}

export function createCommentForUser(authorEmail: string, articleTitle: string, commentAuthor: string, commentText: string) {
  const notification = createNewCommentNotification(authorEmail, articleTitle, commentAuthor, commentText)
  saveEmailNotification(notification)
}

export function createLikeForAuthor(authorEmail: string, articleTitle: string, likerEmail: string) {
  const notification = createArticleLikedNotification(authorEmail, articleTitle, likerEmail)
  saveEmailNotification(notification)
}
