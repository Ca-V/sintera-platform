// Home Shell — HUB DE NAVEGAÇÃO (UX-002), estrutura unificada Web↔Mobile: Identidade+Saudação → Adicionar registro →
// Próximos compromissos → Acesso rápido → Como usar → Rodapé. COMPOSIÇÃO pura (INV-HOME-001): dados de outros
// módulos (nome do perfil, próximos eventos) chegam por INJEÇÃO (HomeContainer). "Adicionar registro" abre o hub
// único de captura (taxonomia do core). Resumo/Linha do tempo/Insights saíram da Home (pertencem aos módulos).
import { useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../theme'
import { WelcomeSlot } from './slots/WelcomeSlot'
import { AdicionarRegistroSlot } from './slots/AdicionarRegistroSlot'
import { ProximosCompromissosSlot, type UpcomingItem } from './slots/ProximosCompromissosSlot'
import { QuickActionsSlot } from './slots/QuickActionsSlot'
import { ComoUsarSlot } from './slots/ComoUsarSlot'
import { FooterSlot } from './slots/FooterSlot'
import { RegistrationHubSheet } from '../screens/capture/RegistrationHubSheet'

export function HomeShell({ upcoming = [], name }: { upcoming?: UpcomingItem[]; name?: string | null }) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const [addOpen, setAddOpen] = useState(false)
  const openAdd = () => setAddOpen(true)
  const closeAdd = () => setAddOpen(false)
  return (
    <>
      <ScrollView
        style={{ backgroundColor: t.color.surface.app }}
        contentContainerStyle={[styles.content, { paddingTop: styles.content.padding + insets.top }]}
      >
        <WelcomeSlot name={name} />
        <AdicionarRegistroSlot onPress={openAdd} />
        <ProximosCompromissosSlot items={upcoming} />
        <QuickActionsSlot />
        <ComoUsarSlot />
        <FooterSlot />
      </ScrollView>
      <RegistrationHubSheet visible={addOpen} onClose={closeAdd} />
    </>
  )
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 16 },
})
