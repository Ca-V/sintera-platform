// Incremento 3 · Home Shell — a "casca" permanente da tela inicial (MOBILE-014). É uma COMPOSIÇÃO de slots
// nomeados (§3.4), nunca dona de lógica de domínio (§2.1). Layout/espaçamento/hierarquia + safe-area (DS-002).
// Os slots reservados renderizam estado vazio; os domínios futuros preenchem cada slot sem redesenhar a Home.
import { ScrollView, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../theme'
import { WelcomeSlot } from './slots/WelcomeSlot'
import { QuickActionsSlot } from './slots/QuickActionsSlot'
import { SummarySlot } from './slots/SummarySlot'
import { TimelineSlot } from './slots/TimelineSlot'
import { InsightsSlot } from './slots/InsightsSlot'
import { FooterSlot } from './slots/FooterSlot'

export function HomeShell() {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <ScrollView
      style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[styles.content, { paddingTop: styles.content.padding + insets.top }]}
    >
      <WelcomeSlot />
      <QuickActionsSlot />
      <SummarySlot />
      <TimelineSlot />
      <InsightsSlot />
      <FooterSlot />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 16 },
})
