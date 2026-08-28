// Home Shell — HUB DE NAVEGAÇÃO (UX-002). COMPOSIÇÃO pura (INV-HOME-001).
//
// ESTRUTURA (definida com a fundadora em 28/08): Saudação → Adicionar registro → Menu completo (com busca) →
// Como usar → Rodapé.
//
// O QUE SAIU, e por quê — a regra que emergiu da revisão: a primeira tela não repete um caminho que o menu logo
// abaixo já oferece.
//   • "Acesso rápido" — quatro atalhos (Agenda, Exames, Minha Saúde, Rede de Cuidado) que o menu já lista, com
//     nome e resumo. Duas listas para os mesmos destinos, na mesma tela, obrigavam a comparação.
//   • "Próximos compromissos" — eu tinha argumentado que ficasse, por mostrar um DADO e não um caminho. A
//     fundadora decidiu o contrário e o critério dela é mais simples de sustentar: o cartão levava à Agenda, e a
//     Agenda é o primeiro item do menu. Um atalho a mais no topo, ocupando a área mais valiosa da tela.
//
// O QUE FICOU: "Adicionar registro" não é navegação — é a AÇÃO principal da plataforma, e abre o hub de captura.
// Sai da lógica de "onde encontrar" e entra na de "fazer".
import { useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../theme'
import { WelcomeSlot } from './slots/WelcomeSlot'
import { AdicionarRegistroSlot } from './slots/AdicionarRegistroSlot'
import { MenuCompletoSlot } from './slots/MenuCompletoSlot'
import { ComoUsarSlot } from './slots/ComoUsarSlot'
import { FooterSlot } from './slots/FooterSlot'
import { RegistrationHubSheet } from '../screens/capture/RegistrationHubSheet'

export function HomeShell({ name }: { name?: string | null }) {
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
