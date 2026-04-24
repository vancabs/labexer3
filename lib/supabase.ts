import { createBrowserClient } from '@supabase/auth-helpers-nextjs'

export const getSupabaseClient = () => {
  if (typeof window === 'undefined') {
    return null
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
    return null
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}