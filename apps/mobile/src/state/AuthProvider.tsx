// Mobile — estado de autenticação (espelha a lógica do UserContext da Web: getSession + onAuthStateChange).
// Consome EXCLUSIVAMENTE o @sintera/api-client — nenhum acesso direto ao SDK Supabase.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@sintera/api-client'
import { apiClient } from '../infrastructure/apiClient'

type AuthState = {
  session: Session | null
  loading: boolean // true durante a restauração inicial da sessão
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    // 1) Restaura a sessão persistida (SecureStore, sem rede).
    apiClient.auth.getSession().then((s) => {
      if (!mounted) return
      setSession(s)
      setLoading(false)
    })
    // 2) Observa mudanças de sessão (SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED).
    const unsubscribe = apiClient.auth.onAuthStateChange((s) => {
      if (mounted) setSession(s)
    })
    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  const value: AuthState = {
    session,
    loading,
    signIn: (email, password) => apiClient.auth.signIn(email, password).then(({ error }) => ({ error })),
    signOut: () => apiClient.auth.signOut().then(() => undefined),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>.')
  return ctx
}
