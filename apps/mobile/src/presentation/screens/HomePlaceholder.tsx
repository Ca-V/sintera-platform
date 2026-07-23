// Mobile — Home placeholder (Incremento 1). Confirma autenticação e permite logout.
// A Home real e a navegação completa são o Incremento 2.
import { View, StyleSheet } from 'react-native'
import { heading, text } from '@sintera/design-system'
import { Text, Button } from '../primitives'
import { useAuth } from '../../state/AuthProvider'
import { useTheme } from '../theme'

export function HomePlaceholder() {
  const t = useTheme()
  const { session, signOut } = useAuth()
  return (
    <View style={[styles.container, { backgroundColor: t.color.surface.app }]}>
      <Text spec={heading(t, { level: 'page' })}>SINTERA</Text>
      <Text spec={text(t, { role: 'body', tone: 'muted' })}>
        {session?.user?.email ? `Autenticado como ${session.user.email}` : 'Autenticado'}
      </Text>
      <View style={{ height: 24 }} />
      <Button label="Sair" variant="secondary" onPress={signOut} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
})
