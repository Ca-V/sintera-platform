// Contexto de autenticação do Mobile. Envolve o app, expõe a sessão e as ações de
// login/cadastro/logout. A sessão é do Supabase (persistida em AsyncStorage); o token
// dela é o que o client de API envia como Bearer para as rotas /api da Web.
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthState {
  session: Session | null
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null; needsConfirmation: boolean }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthState>(() => ({
    session,
    user: session?.user ?? null,
    loading,
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error ? error.message : null }
    },
    async signUp(email, password, name) {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) return { error: error.message, needsConfirmation: false }
      // Sessão presente = confirmação de e-mail desligada → grava o perfil já.
      if (data.session) {
        await supabase.from('profiles').upsert({ id: data.user!.id, name })
        return { error: null, needsConfirmation: false }
      }
      // Sem sessão = confirmação de e-mail ligada → aguardar verificação.
      return { error: null, needsConfirmation: true }
    },
    async signOut() {
      await supabase.auth.signOut()
    },
  }), [session, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
