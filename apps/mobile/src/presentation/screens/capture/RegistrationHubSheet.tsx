// HUB-001 no Mobile — "O que você deseja registrar?" (intenção antes do mecanismo). Bottom-sheet que CONSOME a
// taxonomia do @sintera/core (SSOT único Web↔Mobile) — não há taxonomia paralela. A intenção declara; aqui só se
// roteia: 'capture' → captura de documento (ExamUpload); 'page' → tela do domínio (REGISTRATION_NAV); 'choice' →
// dois caminhos (enviar documento OU cadastrar manualmente). Apresentação apenas — sem regra de domínio.
import { useState } from 'react'
import { Modal, Pressable, ScrollView, View, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { text } from '@sintera/design-system'
import { INTENT_GROUPS, intentsByGroup, captureDestinationFor, type RegistrationIntent, type RegistrationDestination, type DocumentKind } from '@sintera/core'
import { Text } from '../../primitives'
import { useTheme } from '../../theme'
import { REGISTRATION_NAV } from './registrationNav'

type Nav = { navigate: (n: string, p?: unknown) => void; getParent: () => Nav | undefined }

export function RegistrationHubSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useTheme()
  const navigation = useNavigation() as unknown as Nav
  const [choice, setChoice] = useState<RegistrationIntent | null>(null)

  const close = () => { setChoice(null); onClose() }
  // Captura de documento → tela de upload (aba Minha Saúde, onde vivem os Exames/Registros). O contexto 'order'
  // (Pedido de exame) ajusta só o cabeçalho — pedido é sub-tipo do domínio Exames; persistência segue REG-001.
  const goCapture = (context?: 'exam' | 'order') => { close(); navigation.getParent()?.navigate('MinhaSaude', { screen: 'ExamUpload', params: context ? { context } : undefined }) }
  const goDest = (d: RegistrationDestination) => {
    const nav = REGISTRATION_NAV[d]; close()
    navigation.getParent()?.navigate(nav.tab, nav.screen ? { screen: nav.screen, params: nav.params } : undefined)
  }
  /**
   * Captura por TIPO de documento. O destino vem do domínio (`captureDestinationFor`), não de um `if` aqui:
   * uma receita de medicamento vai para Medicamentos, uma receita de óculos vai para Recursos, uma ômica vai
   * para Ômicas. Só o que não tem destino próprio segue para a captura de exame.
   *
   * DEFEITO CORRIGIDO (homologação, 25/08): antes esta função ignorava o kind e mandava TUDO para
   * `ExamUpload` — "Ler receita e cadastrar medicamento" abria "Adicionar exame".
   */
  const goCaptureKind = (kind: DocumentKind | undefined, context?: 'exam' | 'order') => {
    const destino = captureDestinationFor(kind)
    if (destino) goDest(destino)
    else goCapture(context ?? 'exam')
  }
  const pick = (i: RegistrationIntent) => {
    const m = i.mechanism
    if (m.type === 'capture') goCaptureKind(m.documentKind, i.key === 'pedido_exame' ? 'order' : 'exam')
    else if (m.type === 'page') goDest(m.destination)
    else setChoice(i)
  }

  const card = { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }
  const choiceM = choice && choice.mechanism.type === 'choice' ? choice.mechanism : null

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={[styles.sheet, { backgroundColor: t.color.surface.base }]} onPress={() => { /* consome o toque */ }}>
          <View style={[styles.grabber, { backgroundColor: t.color.border.default }]} />
          {choice && choiceM ? (
            <View style={{ gap: 10 }}>
              <Text spec={text(t, { role: 'bodyStrong' })}>{choice.label} — como deseja registrar?</Text>
              <Pressable onPress={() => goCaptureKind(choiceM.captureKind)} style={[styles.row, card]}><Text spec={text(t, { role: 'body' })}>{choiceM.captureLabel}</Text></Pressable>
              <Pressable onPress={() => goDest(choiceM.pageDestination)} style={[styles.row, card]}><Text spec={text(t, { role: 'body' })}>{choiceM.pageLabel}</Text></Pressable>
              <Pressable onPress={() => setChoice(null)} style={{ alignSelf: 'flex-start' }}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>← Voltar</Text></Pressable>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 460 }} keyboardShouldPersistTaps="handled">
              <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 18, marginBottom: 4 }}>O que você deseja registrar?</Text>
              <Text spec={text(t, { role: 'caption', tone: 'muted' })} style={{ marginBottom: 12 }}>Escolha o que deseja registrar — cada opção leva ao caminho certo.</Text>
              {INTENT_GROUPS.map(g => (
                <View key={g.group} style={{ marginBottom: 12 }}>
                  <Text spec={text(t, { role: 'label', tone: 'muted' })} style={{ marginBottom: 6 }}>{g.label.toUpperCase()}</Text>
                  <View style={{ gap: 8 }}>
                    {intentsByGroup(g.group).map(i => (
                      <Pressable key={i.key} onPress={() => pick(i)} accessibilityRole="button" style={[styles.row, card]}>
                        <Text spec={text(t, { role: 'body' })}>{i.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 28 },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 12 },
  row: { borderWidth: 1, borderRadius: 12, padding: 14 },
})
