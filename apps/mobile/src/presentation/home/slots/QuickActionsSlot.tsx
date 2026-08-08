// Slot Quick Actions — acessos rápidos às funcionalidades de MAIOR frequência (hub de navegação, não um segundo
// menu). APENAS navegação (MOBILE-014 §3.1 / UX-002): sem regra de negócio, sem dados de domínio. Alvos podem ser
// uma aba ou uma tela dentro do stack da aba (ex.: Compartilhamento = Mais→Relatório; Adicionar Registro = Exames→Upload).
import { View, StyleSheet, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { text } from '@sintera/design-system'
import { Text } from '../../primitives'
import { useTheme } from '../../theme'
import type { AppTabParamList } from '../../navigation/types'

type Entry = { label: string; tab: keyof AppTabParamList; screen?: string }

// Alta frequência (UX-002): Agenda · Exames · Minha Saúde · Rede de Cuidado. ("Adicionar registro" é card-herói próprio.)
const ENTRIES: readonly Entry[] = [
  { label: 'Agenda', tab: 'Agenda' },
  { label: 'Exames', tab: 'MinhaSaude', screen: 'ExamsList' },
  { label: 'Minha Saúde', tab: 'MinhaSaude' },
  { label: 'Rede de Cuidado', tab: 'RedeCuidado' },
]

export function QuickActionsSlot() {
  const t = useTheme()
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>()
  // Navegação aninhada (aba → tela do stack) — cast fino, sem regra de negócio (padrão do projeto p/ nav por string).
  const go = (e: Entry) => (navigation as unknown as { navigate: (n: string, p?: unknown) => void })
    .navigate(e.tab, e.screen ? { screen: e.screen } : undefined)
  return (
    <View style={styles.wrap}>
      <Text spec={text(t, { role: 'label', tone: 'muted' })}>Acesso rápido</Text>
      <View style={styles.grid}>
        {ENTRIES.map((e) => (
          <Pressable key={e.label} onPress={() => go(e)} accessibilityRole="button"
            style={[styles.card, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
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
