// Simple email notification system
// In production, integrate with SendGrid, AWS SES, or similar

export interface EmailNotification {
  recipientEmail: string
  subject: string
  message: string
  type: 'new-article' | 'new-comment' | 'article-liked' | 'system'
  articleId?: number
  timestamp: string
}

const STORAGE_KEY = 'studentPortal.notifications'
const isClient = typeof window !== 'undefined'
let notificationQueue: EmailNotification[] = []

function readNotificationsFromStorage(): EmailNotification[] {
  if (!isClient) return []
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return []

  try {
    return JSON.parse(raw) as EmailNotification[]
  } catch (error) {
    console.error('Failed to parse stored notifications:', error)
    return []
  }
}

function saveNotificationsToStorage() {
  if (!isClient) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notificationQueue))
}

export function loadNotificationQueue() {
  if (isClient && notificationQueue.length === 0) {
    notificationQueue = readNotificationsFromStorage()
  }
  return [...notificationQueue]
}

export function addEmailNotification(notification: EmailNotification) {
  if (isClient) {
    if (notificationQueue.length === 0) {
      notificationQueue = readNotificationsFromStorage()
    }
    notificationQueue.push(notification)
    saveNotificationsToStorage()
  }
  console.log('Email notification queued:', notification)
}

export function saveEmailNotification(notification: EmailNotification) {
  addEmailNotification(notification)
}

export function getNotificationQueue() {
  return loadNotificationQueue()
}

export function clearNotificationQueue() {
  notificationQueue = []
  if (isClient) {
    window.localStorage.removeItem(STORAGE_KEY)
  }
}

// Format new article notification
export function createNewArticleNotification(
  recipientEmail: string,
  articleTitle: string,
  authorName: string
): EmailNotification {
  return {
    recipientEmail,
    subject: `New Article: ${articleTitle}`,
    message: `A new article "${articleTitle}" has been posted by ${authorName}. Check it out!`,
    type: 'new-article',
    timestamp: new Date().toISOString()
  }
}

// Format new comment notification
export function createNewCommentNotification(
  recipientEmail: string,
  articleTitle: string,
  commentAuthor: string,
  commentText: string
): EmailNotification {
  return {
    recipientEmail,
    subject: `New comment on "${articleTitle}"`,
    message: `${commentAuthor} commented: ${commentText}`,
    type: 'new-comment',
    timestamp: new Date().toISOString()
  }
}

// Format article liked notification
export function createArticleLikedNotification(
  recipientEmail: string,
  articleTitle: string,
  likerEmail: string
): EmailNotification {
  return {
    recipientEmail,
    subject: `Your article was liked: ${articleTitle}`,
    message: `${likerEmail} liked your article "${articleTitle}".`,
    type: 'article-liked',
    timestamp: new Date().toISOString()
  }
}

export function createSystemNotification(
  recipientEmail: string,
  subject: string,
  message: string
): EmailNotification {
  return {
    recipientEmail,
    subject,
    message,
    type: 'system',
    timestamp: new Date().toISOString()
  }
}

// Simulate sending email (replace with actual email service in production)
export async function sendEmailNotification(notification: EmailNotification) {
  try {
    // In production, call your email service API here
    // e.g., sendgrid.send({to: notification.recipientEmail, ...})
    console.log(`Email sent to ${notification.recipientEmail}: ${notification.subject}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error }
  }
}

// Notify all users of new article
export async function notifyUsersOfNewArticle(
  userEmails: string[],
  articleTitle: string,
  authorName: string
) {
  for (const email of userEmails) {
    const notification = createNewArticleNotification(email, articleTitle, authorName)
    addEmailNotification(notification)
    await sendEmailNotification(notification)
  }
}

export async function notifyAuthorOfComment(
  authorEmail: string,
  articleTitle: string,
  commentAuthor: string,
  commentText: string
) {
  const notification = createNewCommentNotification(authorEmail, articleTitle, commentAuthor, commentText)
  addEmailNotification(notification)
  await sendEmailNotification(notification)
}

export async function notifyAuthorOfLike(
  authorEmail: string,
  articleTitle: string,
  likerEmail: string
) {
  const notification = createArticleLikedNotification(authorEmail, articleTitle, likerEmail)
  addEmailNotification(notification)
  await sendEmailNotification(notification)
}
