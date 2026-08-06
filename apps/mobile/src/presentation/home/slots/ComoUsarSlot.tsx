// Slot "Como usar a SINTERA" — ONBOARDING PERMANENTE (UX-002), não texto estático nem informação repetida de
// outro módulo. Orienta AÇÕES: como adicionar um registro, como compartilhar, como a plataforma se organiza e
// dicas rápidas. Cada item pode levar direto à ação. Só navegação/apresentação — sem dado de domínio (INV-HOME-001).
// Estrutura estável: no futuro pode virar guia contextual sem redesenhar a Home.
import { View, StyleSheet, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { text } from '@sintera/design-system'
import { Text } from '../../primitives'
import { useTheme } from '../../theme'
import type { AppTabParamList } from '../../navigation/types'

// Modelo EXTENSÍVEL do guia (UX-002 / diretriz da fundadora): a estrutura já nasce pronta para evoluir sem
// redesenhar a Home. Hoje: 'onboarding' e 'tip'. Futuro (mesma estrutura): 'novidade' (novidades da plataforma) e
// 'descoberta' (orientar recursos ainda não utilizados pelo usuário) — bastará acrescentar itens/kinds e a fonte.
type GuideKind = 'onboarding' | 'tip' | 'novidade' | 'descoberta'
type Tip = { kind: GuideKind; title: string; body: string; cta?: string; tab?: keyof AppTabParamList; screen?: string }

const TIPS: readonly Tip[] = [
  { kind: 'onboarding', title: 'Adicionar um registro', body: 'Envie um exame por foto ou arquivo e a SINTERA organiza para você.', cta: 'Adicionar agora', tab: 'Exames', screen: 'ExamUpload' },
  { kind: 'onboarding', title: 'Compartilhar com um profissional', body: 'Monte um relatório factual e gere um link seguro em Compartilhamento.', cta: 'Ir para Compartilhamento', tab: 'Mais', screen: 'Relatorio' },
  { kind: 'onboarding', title: 'Como a plataforma se organiza', body: 'Sua vida de saúde vive em Agenda, Exames e Minha Saúde — cada coisa em seu lugar.' },
  { kind: 'tip', title: 'Dica rápida', body: 'Dentro de cada módulo, use a busca e os filtros para encontrar rápido o que precisa.' },
]

export function ComoUsarSlot() {
  const t = useTheme()
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>()
  const go = (tip: Tip) => { if (tip.tab) (navigation as unknown as { navigate: (n: string, p?: unknown) => void }).navigate(tip.tab, tip.screen ? { screen: tip.screen } : undefined) }
  return (
    <View style={styles.wrap}>
      <Text spec={text(t, { role: 'label', tone: 'muted' })}>Como usar a SINTERA</Text>
      <View style={{ gap: 12 }}>
        {TIPS.map((tip) => (
          <View key={tip.title} style={[styles.card, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
            <Text spec={text(t, { role: 'bodyStrong' })}>{tip.title}</Text>
            <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{tip.body}</Text>
            {tip.cta ? (
              <Pressable onPress={() => go(tip)} accessibilityRole="button" style={{ alignSelf: 'flex-start' }}>
                <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>{tip.cta} →</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  card: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 6 },
})
