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

type Props = NativeStackScreenProps<MinhaSaudeStackParamList, 'MinhaSaudeMenu'>
type Row = { label: string; onPress: () => void }

export function MinhaSaudeMenuScreen({ navigation }: Props) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const sections: { title: string; rows: Row[] }[] = [
    { title: 'Registros', rows: [
      { label: 'Exames', onPress: () => navigation.navigate('ExamsList') },
      { label: 'Medicamentos', onPress: () => navigation.navigate('Medications', { supplements: false }) },
      { label: 'Suplementos', onPress: () => navigation.navigate('Medications', { supplements: true }) },
      { label: 'Recursos de Saúde', onPress: () => navigation.navigate('Resources') },
    ] },
    { title: 'Saúde', rows: [
      { label: 'Condições de Saúde', onPress: () => navigation.navigate('Conditions') },
      { label: 'Composição Corporal', onPress: () => navigation.navigate('Composicao') },
      { label: 'Ciclo e Contracepção', onPress: () => navigation.navigate('Ciclo') },
      { label: 'Monitoramento', onPress: () => navigation.navigate('Monitoramento') },
      { label: 'Hábitos', onPress: () => navigation.navigate('Habits') },
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
              <Text spec={text(t, { role: 'caption', tone: 'muted' })}>›</Text>
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
})
