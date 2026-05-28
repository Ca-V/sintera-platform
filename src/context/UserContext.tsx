'use client'

import {
  createContext, useContext, useEffect,
  useState, useRef, useCallback,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/supabase/types'

interface UserContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const UserContext = createContext<UserContextValue>({
  user: null, profile: null, loading: true,
  signOut: async () => {}, refreshProfile: async () => {},
})

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Singleton — createClient() called exactly once
  const supabase = useRef(createClient()).current

  // Profile fetch is fire-and-forget: never blocks auth loading state
  const fetchProfile = useCallback((userId: string) => {
    const query = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    Promise.resolve(query).then(({ data }) => {
      setProfile((data as Profile | null) ?? null)
    }).catch(() => setProfile(null))
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (user) fetchProfile(user.id)
  }, [user, fetchProfile])

  useEffect(() => {
    let mounted = true

    // Step 1 — read session from localStorage (no network call)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      const u = session?.user ?? null
      setUser(u)
      if (u) fetchProfile(u.id)   // background, non-blocking
    }).catch(() => {
      if (mounted) setUser(null)
    }).finally(() => {
      // Always unblock loading as soon as auth state is known
      if (mounted) setLoading(false)
    })

    // Step 2 — react to subsequent auth events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      // INITIAL_SESSION is handled in step 1 — skip it here
      if (event === 'INITIAL_SESSION') return

      const u = session?.user ?? null
      setUser(u)
      setLoading(false)              // always immediate — no await
      if (u) fetchProfile(u.id)     // background, non-blocking
      else setProfile(null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile]) // both are stable refs — runs once

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    window.location.href = '/login'
  }

  return (
    <UserContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
