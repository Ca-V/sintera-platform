// Slot Welcome (saudação). Usa EXCLUSIVAMENTE dados locais da sessão autenticada (useAuth) — nenhuma
// requisição de rede na renderização (MOBILE-014, critério de desempenho). Sem lógica de domínio.
import { View } from 'react-native'
import { heading, text } from '@sintera/design-system'
import { Text } from '../../primitives'
import { useAuth } from '../../../state/AuthProvider'
import { useTheme } from '../../theme'

export function WelcomeSlot() {
  const t = useTheme()
  const { session } = useAuth()
  const email = session?.user?.email
  return (
    <View style={{ gap: 4 }}>
      <Text spec={heading(t, { level: 'page' })}>Olá</Text>
      {email ? <Text spec={text(t, { role: 'body', tone: 'muted' })}>{email}</Text> : null}
    </View>
  )
}
