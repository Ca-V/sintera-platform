// Mobile — Home placeholder (Incremento 1). Confirma autenticação e permite logout.
// A Home real e a navegação completa são o Incremento 2.
import { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { heading, text } from '@sintera/design-system'
import { Text, Button } from '../primitives'
import { useAuth } from '../../state/AuthProvider'
import { useTheme } from '../theme'

export function HomePlaceholder() {
  const t = useTheme()
  const { session, signOut } = useAuth()
  // Guarda de reentrância: impede múltiplas invocações concorrentes de signOut() (medida preventiva —
  // foi observada 1 ocorrência isolada de sessão persistida após múltiplos toques; causa raiz inconclusiva).
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function handleSignOut() {
    if (isSigningOut) return // 2º toque durante o signOut em andamento = no-op
    setIsSigningOut(true)
    try {
      await signOut()
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: t.color.surface.app }]}>
      <Text spec={heading(t, { level: 'page' })}>SINTERA</Text>
      <Text spec={text(t, { role: 'body', tone: 'muted' })}>
        {session?.user?.email ? `Autenticado como ${session.user.email}` : 'Autenticado'}
      </Text>
      <View style={{ height: 24 }} />
      <Button
        label="Sair"
        variant="secondary"
        onPress={handleSignOut}
        loading={isSigningOut}
        loadingLabel="Saindo…"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
})
