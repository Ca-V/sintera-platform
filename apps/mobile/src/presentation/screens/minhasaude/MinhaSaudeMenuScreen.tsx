// Menu da aba "Minha Saúde" (raiz do stack). Domínio central da IA por modelo mental (MOBILE-036): mesma
// SEQUÊNCIA e TERMINOLOGIA da Sidebar Web (paridade total — ponto 7): Registros · Saúde · Histórico.
// "Exames" é um Registro daqui (deixou de ser aba). SÓ navegação — sem regra de negócio.
import { ScrollView, View, Pressable, StyleSheet } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { heading, text } from '@sintera/design-system'
import { PLATFORM_NAV, type SectionId } from '@sintera/core'
import { Text } from '../../primitives'
import { useTheme } from '../../theme'
import type { MinhaSaudeStackParamList } from '../../navigation/types'
import { SECTION_ROUTES } from '../../navigation/sectionRoutes'
import { useMinhaSaudeCounts } from './useMinhaSaudeCounts'

type Props = NativeStackScreenProps<MinhaSaudeStackParamList, 'MinhaSaudeMenu'>
type Row = { label: string; onPress: () => void; count?: number }

export function MinhaSaudeMenuScreen({ navigation }: Props) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const counts = useMinhaSaudeCounts() // §5d: contadores por INJEÇÃO (best-effort); o menu só apresenta.

  // Contadores por seção — o único dado que este menu acrescenta ao catálogo. Conexões NÃO é item: chega-se por
  // Monitoramento, como na Web (já a tive nos dois lugares, e o caminho divergia da referência).
  const contagem: Partial<Record<SectionId, number | undefined>> = {
    exames: counts?.exams, medicamentos: counts?.medications, suplementos: counts?.supplements,
    recursos: counts?.resources, condicoes: counts?.conditions, habitos: counts?.habits,
  }

  // Os NOMES, a ORDEM e os GRUPOS vêm do catálogo do core — os mesmos que a Sidebar da Web usa e que a Home
  // mostra em "Tudo na SINTERA". Esta tela contribui com o caminho e o contador, não com uma segunda taxonomia.
  const grupoMinhaSaude = PLATFORM_NAV.find(g => g.id === 'minha-saude')
  const sections: { title: string; rows: Row[] }[] = (grupoMinhaSaude?.subgroups ?? []).map(sg => ({
    title: sg.label ?? '',
    rows: sg.sections.map(s => {
      const r = SECTION_ROUTES[s.id]
      // Navegação por nome de rota vindo do mapa — cast fino, o padrão do projeto para nav por string.
      const ir = navigation as unknown as { navigate: (n: string, p?: unknown) => void }
      return {
        label: s.label,
        onPress: () => ir.navigate(r.screen ?? 'MinhaSaudeMenu', r.params),
        count: contagem[s.id],
      }
    }),
  }))
  return (
    <ScrollView style={{ backgroundColor: t.color.surface.app }} contentContainerStyle={[styles.content, { paddingTop: styles.content.padding + insets.top }]}>
      <Text spec={heading(t, { level: 'page' })}>Minha Saúde</Text>
      {sections.map((sec) => (
        <View key={sec.title} style={{ gap: 8 }}>
          <Text spec={text(t, { role: 'label', tone: 'muted' })}>{sec.title.toUpperCase()}</Text>
          {sec.rows.map((r) => (
            <Pressable key={r.label} onPress={r.onPress} accessibilityRole="button"
              style={[styles.row, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
              <Text spec={text(t, { role: 'body' })}>{r.label}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {typeof r.count === 'number' && r.count > 0 ? (
                  <View style={[styles.countBadge, { backgroundColor: t.color.badge.info.soft }]}>
                    <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.info.text }}>{r.count}</Text>
                  </View>
                ) : null}
                <Text spec={text(t, { role: 'caption', tone: 'muted' })}>›</Text>
              </View>
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1 },
  countBadge: { minWidth: 22, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, alignItems: 'center' },
})
