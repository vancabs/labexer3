import { createBrowserClient } from '@supabase/auth-helpers-nextjs'

export const getSupabaseClient = () => {
  if (typeof window === 'undefined') {
    return null
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vronkmrgwugrteywvmch.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyb25rbXJnd3VncnRleXd2bWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNjg2NDksImV4cCI6MjA5MTc0NDY0OX0.7N8Kusohp2SAm2fr-t4GknQ-Znlhmt4g0D_QpBin_Z0'
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
    return null
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}