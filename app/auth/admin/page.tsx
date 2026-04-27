'use client'

import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { getUserRole } from '@/lib/auth-helper'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminAuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()

  const clearMessages = () => {
    setMessage('')
    setError('')
  }

  const handleAdminSignUp = async () => {
    clearMessages()
    setLoading(true)

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        setError('Unable to initialize Supabase client.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'admin',
            createdAt: new Date().toISOString()
          }
        }
      })

      setLoading(false)

      if (error) {
        setError(error.message)
      } else {
        setMessage('Admin account created! Please check your email to confirm, then sign in.')
        setEmail('')
        setPassword('')
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Sign up failed')
      setLoading(false)
    }
  }

  const handleAdminLogin = async () => {
    clearMessages()
    setLoading(true)

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        setError('Unable to initialize Supabase client.')
        setLoading(false)
        return
      }

      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (loginError) {
        setError(loginError.message)
        setLoading(false)
        return
      }

      // Check if user has admin role
      const role = data.session?.user.user_metadata?.role
      if (role !== 'admin') {
        setError('This account does not have admin privileges. Please use an admin account.')
        setLoading(false)
        return
      }

      setMessage('Admin login successful! Redirecting...')
      setTimeout(() => {
        router.push('/admin')
      }, 1500)
    } catch (err: unknown) {
      setError((err as Error).message || 'Login failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Portal
          </h2>
          <p className="text-gray-600">
            {isSignUp ? 'Create Admin Account' : 'Administrative Access'}
          </p>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
              placeholder="admin@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter admin password"
            />
          </div>

          <div className="flex gap-4 pt-2">
            <button
              onClick={isSignUp ? handleAdminSignUp : handleAdminLogin}
              disabled={loading}
              className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-all duration-200 disabled:bg-red-400 font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
            >
              {loading ? (isSignUp ? 'Creating...' : 'Signing In...') : (isSignUp ? 'Create Admin Account' : 'Admin Sign In')}
            </button>
          </div>

          <button
            onClick={() => {
              setIsSignUp(!isSignUp)
              clearMessages()
            }}
            className="w-full text-red-600 hover:text-red-700 font-semibold text-sm"
          >
            {isSignUp ? 'Already have admin account? Sign In' : 'Need to create admin account? Sign Up'}
          </button>

          {message && (
            <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm font-medium flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {message}
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm font-medium flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600 mb-3">Or login as</p>
          <Link
            href="/auth/user"
            className="block text-center px-4 py-2 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 font-semibold"
          >
            Student
          </Link>
        </div>
      </div>
    </div>
  )
}
