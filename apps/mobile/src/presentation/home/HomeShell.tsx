// Home Shell — HUB DE NAVEGAÇÃO (UX-002). COMPOSIÇÃO pura (INV-HOME-001): dados de outros módulos (nome do
// perfil, próximos eventos) chegam por INJEÇÃO (HomeContainer).
//
// ESTRUTURA (revisada com a fundadora em 28/08): Saudação → Adicionar registro → Próximos compromissos →
// Menu completo (com busca) → Como usar → Rodapé.
//
// "ACESSO RÁPIDO" SAIU. Ele oferecia quatro atalhos — Agenda, Exames, Minha Saúde, Rede de Cuidado — que agora
// aparecem logo abaixo, no menu completo, com o nome e o resumo. Dois caminhos para o mesmo lugar na MESMA tela
// não é redundância inofensiva: obriga a pessoa a comparar as duas listas para descobrir se são a mesma coisa.
//
// "ADICIONAR REGISTRO" FICOU. Ele não é navegação — é a AÇÃO principal da plataforma, e abre o hub de captura.
// Sai da lógica do menu (onde encontrar) e entra na de fazer.
//
// "PRÓXIMOS COMPROMISSOS" FICOU pelo mesmo critério: mostra um DADO seu (o que vem a seguir), não um caminho.
import { useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../theme'
import { WelcomeSlot } from './slots/WelcomeSlot'
import { AdicionarRegistroSlot } from './slots/AdicionarRegistroSlot'
import { ProximosCompromissosSlot, type UpcomingItem } from './slots/ProximosCompromissosSlot'
import { MenuCompletoSlot } from './slots/MenuCompletoSlot'
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
        keyboardShouldPersistTaps="handled"
      >
        <WelcomeSlot name={name} />
        <AdicionarRegistroSlot onPress={openAdd} />
        <ProximosCompromissosSlot items={upcoming} />
        <MenuCompletoSlot />
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
