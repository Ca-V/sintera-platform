// Slot Quick Actions — pontos de entrada. APENAS navegação para funcionalidades já existentes (as abas do
// AppNavigator), SEM qualquer decisão ou priorização por regra de negócio (MOBILE-014 §3.1). Não é um
// RegistrationHub: não decide "o que registrar" nem "qual prioridade". Sem lógica de domínio.
import { View, StyleSheet, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { text } from '@sintera/design-system'
import { Text } from '../../primitives'
import { useTheme } from '../../theme'
import type { AppTabParamList } from '../../navigation/types'

// Rótulos/alvos derivados dos grupos do SSOT (mesmos da navegação). Só navegação.
const ENTRIES: { label: string; target: keyof AppTabParamList }[] = [
  { label: 'Acompanhamento', target: 'Acompanhamento' },
  { label: 'Documentos', target: 'Documentos' },
  { label: 'Minha Saúde', target: 'MinhaSaude' },
  { label: 'Mais', target: 'Mais' },
]

export function QuickActionsSlot() {
  const t = useTheme()
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>()
  return (
    <View style={styles.wrap}>
      <Text spec={text(t, { role: 'label', tone: 'muted' })}>Acesso rápido</Text>
      <View style={styles.grid}>
        {ENTRIES.map((e) => (
          <Pressable
            key={e.target}
            onPress={() => navigation.navigate(e.target)}
            accessibilityRole="button"
            style={[styles.card, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}
          >
            <Text spec={text(t, { role: 'bodyStrong' })}>{e.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { flexGrow: 1, minWidth: '45%', borderWidth: 1, borderRadius: 12, paddingVertical: 18, paddingHorizontal: 16 },
})
