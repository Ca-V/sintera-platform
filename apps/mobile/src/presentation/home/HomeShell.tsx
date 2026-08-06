// Home Shell — a "casca" permanente da tela inicial. HUB DE NAVEGAÇÃO (UX-002), não um relatório: cada slot ajuda o
// usuário a INICIAR uma ação; não repete informação que já vive em outro módulo. COMPOSIÇÃO de slots nomeados,
// nunca dona de lógica de domínio (MOBILE-014 §2.1 / INV-HOME-001). Layout/espaçamento/hierarquia + safe-area (DS-002).
// Slots: saudação · acesso rápido · como usar (onboarding permanente) · rodapé (logout). Resumo/Linha do tempo/
// Insights saíram da Home (pertencem aos respectivos módulos). Próximos Compromissos entra por INJEÇÃO (container).
import { ScrollView, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../theme'
import { WelcomeSlot } from './slots/WelcomeSlot'
import { QuickActionsSlot } from './slots/QuickActionsSlot'
import { ProximosCompromissosSlot, type UpcomingItem } from './slots/ProximosCompromissosSlot'
import { ComoUsarSlot } from './slots/ComoUsarSlot'
import { FooterSlot } from './slots/FooterSlot'

/** Dados de outros módulos chegam por INJEÇÃO (HomeContainer, fora de home/) — a Home permanece apresentação pura. */
export function HomeShell({ upcoming = [] }: { upcoming?: UpcomingItem[] }) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <ScrollView
      style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[styles.content, { paddingTop: styles.content.padding + insets.top }]}
    >
      <WelcomeSlot />
      <QuickActionsSlot />
      <ProximosCompromissosSlot items={upcoming} />
      <ComoUsarSlot />
      <FooterSlot />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 16 },
})
