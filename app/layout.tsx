import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Student Portal Demo',
  description: 'A simple integrated web app using Supabase and Vercel',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  )
}