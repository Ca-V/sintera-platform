// "Como usar a SINTERA" — onboarding permanente (UX-002). MESMOS 5 passos da Web (paridade de conteúdo e ordem):
// adicionar documentos → registrar rotina → acompanhar → compartilhar → escolher como ser avisada. Cada passo
// leva à ação correspondente. Só navegação/apresentação — sem dado de domínio (INV-HOME-001).
import { View, StyleSheet, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { text } from '@sintera/design-system'
import { Text } from '../../primitives'
import { useTheme } from '../../theme'
import type { AppTabParamList } from '../../navigation/types'

type Step = { title: string; body: string; tab: keyof AppTabParamList; screen: string }

const STEPS: readonly Step[] = [
  { title: '1. Adicione seus documentos', body: 'Envie exames, receitas e laudos (foto ou arquivo) — a SINTERA lê e organiza.', tab: 'MinhaSaude', screen: 'ExamUpload' },
  { title: '2. Registre a sua rotina de saúde', body: 'Medicamentos, consultas, condições, hábitos e composição corporal.', tab: 'MinhaSaude', screen: 'Medications' },
  { title: '3. Acompanhe ao longo do tempo', body: 'Sua linha do tempo em Histórico de Saúde e a evolução em Histórico de Exames.', tab: 'MinhaSaude', screen: 'Timeline' },
  { title: '4. Compartilhe com quem cuida de você', body: 'Reúna suas informações em um relatório e envie ao seu profissional de saúde.', tab: 'RedeCuidado', screen: 'Relatorio' },
  { title: '5. Escolha como ser avisada', body: 'Na Central de Notificações (em Configurações) você define se recebe lembretes por e-mail, WhatsApp, ambos ou nenhum.', tab: 'Mais', screen: 'Configuracoes' },
]

export function ComoUsarSlot() {
  const t = useTheme()
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>()
  const go = (s: Step) => (navigation as unknown as { navigate: (n: string, p?: unknown) => void }).navigate(s.tab, { screen: s.screen })
  return (
    <View style={styles.wrap}>
      <Text spec={text(t, { role: 'label', tone: 'muted' })}>Como usar a SINTERA</Text>
      <View style={{ gap: 12 }}>
        {STEPS.map((s) => (
          <Pressable key={s.title} onPress={() => go(s)} accessibilityRole="button"
            style={[styles.card, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
            <Text spec={text(t, { role: 'bodyStrong' })}>{s.title}</Text>
            <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{s.body}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  card: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 6 },
})
