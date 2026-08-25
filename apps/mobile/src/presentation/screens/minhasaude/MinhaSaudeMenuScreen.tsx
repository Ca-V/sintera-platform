// Menu da aba "Minha Saúde" (raiz do stack). Domínio central da IA por modelo mental (MOBILE-036): mesma
// SEQUÊNCIA e TERMINOLOGIA da Sidebar Web (paridade total — ponto 7): Registros · Saúde · Histórico.
// "Exames" é um Registro daqui (deixou de ser aba). SÓ navegação — sem regra de negócio.
import { ScrollView, View, Pressable, StyleSheet } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { heading, text } from '@sintera/design-system'
import { Text } from '../../primitives'
import { useTheme } from '../../theme'
import type { MinhaSaudeStackParamList } from '../../navigation/types'
import { useMinhaSaudeCounts } from './useMinhaSaudeCounts'

type Props = NativeStackScreenProps<MinhaSaudeStackParamList, 'MinhaSaudeMenu'>
type Row = { label: string; onPress: () => void; count?: number }

export function MinhaSaudeMenuScreen({ navigation }: Props) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const counts = useMinhaSaudeCounts() // §5d: contadores por INJEÇÃO (best-effort); o menu só apresenta.
  const sections: { title: string; rows: Row[] }[] = [
    { title: 'Registros', rows: [
      { label: 'Exames', onPress: () => navigation.navigate('ExamsList'), count: counts?.exams },
      // DOC-002 — mesma posição da Web: ao lado de Exames, não dentro deles.
      { label: 'Receitas e atestados', onPress: () => navigation.navigate('Documents') },
      { label: 'Medicamentos', onPress: () => navigation.navigate('Medications', { supplements: false }), count: counts?.medications },
      { label: 'Suplementos', onPress: () => navigation.navigate('Medications', { supplements: true }), count: counts?.supplements },
      { label: 'Recursos de Saúde', onPress: () => navigation.navigate('Resources'), count: counts?.resources },
    ] },
    { title: 'Saúde', rows: [
      { label: 'Condições de Saúde', onPress: () => navigation.navigate('Conditions'), count: counts?.conditions },
      { label: 'Composição Corporal', onPress: () => navigation.navigate('Composicao') },
      { label: 'Ciclo e Contracepção', onPress: () => navigation.navigate('Ciclo') },
      { label: 'Monitoramento', onPress: () => navigation.navigate('Monitoramento') },
      { label: 'Hábitos', onPress: () => navigation.navigate('Habits'), count: counts?.habits },
    ] },
    { title: 'Histórico', rows: [
      { label: 'Histórico de Exames', onPress: () => navigation.navigate('HistoricoExames') },
      { label: 'Histórico de Saúde', onPress: () => navigation.navigate('Timeline') },
    ] },
  ]
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
