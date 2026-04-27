'use client'

import { useState } from 'react'
import { loginAndGetRole } from '@/lib/auth-helper'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function UserAuthPage() {
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

  const handleLogin = async () => {
    clearMessages()
    setLoading(true)

    try {
      const { data, error: loginError, role } = await loginAndGetRole(email, password)

      if (loginError) {
        setError(loginError.message)
        setLoading(false)
        return
      }

      if (role === 'admin') {
        setError('Admin accounts must login via the Admin portal.')
        setLoading(false)
        return
      }

      setMessage('Login successful! Redirecting...')
      setTimeout(() => {
        router.push('/profile')
      }, 1500)
    } catch (err: unknown) {
      setError((err as Error).message || 'Login failed')
      setLoading(false)
    }
  }

  const handleSignUp = async () => {
    clearMessages()
    setLoading(true)

    try {
      const { getSupabaseClient } = await import('@/lib/supabase')
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
            role: 'user',
            createdAt: new Date().toISOString()
          }
        }
      })

      setLoading(false)

      if (error) {
        setError(error.message)
      } else {
        setMessage('Sign up successful! Please check your email to confirm your account.')
        setEmail('')
        setPassword('')
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Sign up failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isSignUp ? 'Create Account' : 'Student Login'}
          </h2>
          <p className="text-gray-600">
            {isSignUp ? 'Join our student community' : 'Access your student portal'}
          </p>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter your password"
            />
          </div>

          <div className="flex gap-4 pt-2">
            <button
              onClick={isSignUp ? handleSignUp : handleLogin}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:bg-blue-400 font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
            >
              {loading ? (isSignUp ? 'Creating...' : 'Signing In...') : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </div>

          <button
            onClick={() => {
              setIsSignUp(!isSignUp)
              clearMessages()
            }}
            className="w-full text-blue-600 hover:text-blue-700 font-semibold text-sm"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
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
          <p className="text-center text-sm text-gray-600 mb-3">Or access</p>
          <Link
            href="/auth/admin"
            className="block text-center px-4 py-2 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 font-semibold"
          >
            Admin Portal
          </Link>
        </div>
      </div>
    </div>
  )
}
