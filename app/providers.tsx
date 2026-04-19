'use client'

import { useEffect, ReactNode } from 'react'
import { getSupabaseClient } from '@/lib/supabase'

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const initializeAuth = async () => {
      const supabase = getSupabaseClient()
      if (!supabase) return

      // Refresh session on mount to ensure valid tokens
      try {
        const { data, error } = await supabase.auth.refreshSession()
        
        if (error) {
          // Session refresh failed - this is expected for logged-out users
          console.debug('Session refresh info:', error.message)
        }
      } catch (error) {
        console.debug('Auth initialization:', error)
      }
    }

    initializeAuth()

    // Set up auth state listener
    const supabase = getSupabaseClient()
    if (!supabase) return

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        // Token refreshed or user signed in
        console.debug('Auth state updated:', event)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  return <>{children}</>
}
