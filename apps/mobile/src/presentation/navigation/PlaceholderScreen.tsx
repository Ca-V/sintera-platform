// Tela placeholder do Incremento 2 (Navegação). Confirma que o destino de navegação é alcançável e
// projeta os rótulos da taxonomia SSOT que este destino conterá. SEM conteúdo de domínio (critério 10).
import { View, StyleSheet, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { heading, text } from '@sintera/design-system'
import { Text } from '../primitives'
import { useTheme } from '../theme'
import type { SsotTab } from './ssotTabs'

export function PlaceholderScreen({ tab }: { tab: SsotTab }) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <ScrollView
      style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[styles.content, { paddingTop: styles.content.padding + insets.top }]}
    >
      <Text spec={heading(t, { level: 'page' })}>{tab.label}</Text>
      <Text spec={text(t, { role: 'bodySmall', tone: 'muted' })}>Em construção (Incremento 2 — Navegação).</Text>
      <View style={{ height: 20 }} />
      <Text spec={text(t, { role: 'label', tone: 'muted' })}>Itens (taxonomia SSOT)</Text>
      <View style={{ height: 8 }} />
      {tab.items.map((item) => (
        <View key={item} style={[styles.row, { borderBottomColor: t.color.border.default }]}>
          <Text spec={text(t, { role: 'body' })}>{item}</Text>
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 4 },
  row: { paddingVertical: 12, borderBottomWidth: 1 },
})
