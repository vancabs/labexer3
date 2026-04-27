import { getSupabaseClient } from './supabase'

export type UserRole = 'admin' | 'user'

export interface UserWithRole {
  id: string
  email: string
  role: UserRole
  createdAt: string
}

// Store role in user metadata during signup
export async function signUpUser(email: string, password: string, role: UserRole) {
  const supabase = getSupabaseClient()
  if (!supabase) {
    throw new Error('Supabase client not initialized')
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        createdAt: new Date().toISOString()
      }
    }
  })

  return { data, error }
}

// Get user role from session
export async function getUserRole(): Promise<UserRole | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const role = session.user.user_metadata?.role as UserRole
  return role || 'user'
}

// Check if user is admin
export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'admin'
}

// Login and get role
export async function loginAndGetRole(email: string, password: string) {
  const supabase = getSupabaseClient()
  if (!supabase) {
    throw new Error('Supabase client not initialized')
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    return { data: null, error, role: null }
  }

  const role = data.session?.user.user_metadata?.role as UserRole || 'user'
  return { data, error: null, role }
}
