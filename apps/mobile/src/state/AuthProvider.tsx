// Mobile — estado de autenticação (espelha a lógica do UserContext da Web: getSession + onAuthStateChange).
// Consome EXCLUSIVAMENTE o @sintera/api-client — nenhum acesso direto ao SDK Supabase.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@sintera/api-client'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { apiClient } from '../infrastructure/apiClient'

type AuthState = {
  session: Session | null
  loading: boolean // true durante a restauração inicial da sessão
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  /**
   * Entrada pelo Google. Abre o navegador do SISTEMA — a senha do Google é digitada no domínio do Google, e o
   * aplicativo nunca a vê. O que volta por deep link é só o par de tokens de sessão.
   * `cancelled` distingue "a pessoa desistiu" de "deu erro": mostrar mensagem de falha para quem apenas fechou
   * a janela é dizer que algo quebrou quando nada quebrou.
   */
  signInWithGoogle: () => Promise<{ error: Error | null; cancelled: boolean }>
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
    signInWithGoogle: async () => {
      try {
        // Deep link de volta para o app. Precisa estar na lista de URLs permitidas do Supabase, senão o
        // provedor recusa o retorno — é a causa nº 1 de "o Google abre e não volta".
        const redirect = Linking.createURL('auth')
        const { url, error } = await apiClient.auth.startOAuth('google', redirect)
        if (error || !url) return { error: error ?? new Error('Sem endereço de autorização'), cancelled: false }

        const r = await WebBrowser.openAuthSessionAsync(url, redirect)
        // 'cancel' = fechou a janela; 'dismiss' = voltou pelo gesto do sistema. Nenhum dos dois é falha.
        if (r.type !== 'success') return { error: null, cancelled: true }

        return { ...(await apiClient.auth.completeOAuth(r.url)), cancelled: false }
      } catch (e) {
        return { error: e instanceof Error ? e : new Error('Falha ao entrar'), cancelled: false }
      }
    },
    signOut: () => apiClient.auth.signOut().then(() => undefined),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>.')
  return ctx
}
