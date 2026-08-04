// Menu da aba "Minha Saúde" (raiz do stack). Projeta o grupo SSOT (Condições, Medicamentos, Suplementos,
// Recursos, Hábitos, Ciclo). Itens sem tela ficam "em breve" (rótulos da taxonomia). SÓ navegação.
import { ScrollView, View, Pressable, StyleSheet } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { heading, text } from '@sintera/design-system'
import { Text } from '../../primitives'
import { useTheme } from '../../theme'
import type { MinhaSaudeStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<MinhaSaudeStackParamList, 'MinhaSaudeMenu'>

export function MinhaSaudeMenuScreen({ navigation }: Props) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const rows: readonly { label: string; onPress?: () => void }[] = [
    { label: 'Condições de Saúde', onPress: () => navigation.navigate('Conditions') },
    { label: 'Medicamentos' },
    { label: 'Suplementos' },
    { label: 'Recursos de Saúde' },
    { label: 'Hábitos', onPress: () => navigation.navigate('Habits') },
    { label: 'Ciclo e Contracepção' },
  ]
  return (
    <ScrollView style={{ backgroundColor: t.color.surface.app }} contentContainerStyle={[styles.content, { paddingTop: styles.content.padding + insets.top }]}>
      <Text spec={heading(t, { level: 'page' })}>Minha Saúde</Text>
      <View style={{ gap: 8 }}>
        {rows.map((r) => {
          const enabled = !!r.onPress
          return (
            <Pressable key={r.label} disabled={!enabled} onPress={r.onPress} accessibilityRole="button"
              style={[styles.row, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default, opacity: enabled ? 1 : 0.5 }]}>
              <Text spec={text(t, { role: 'body' })}>{r.label}</Text>
              <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{enabled ? '›' : 'em breve'}</Text>
            </Pressable>
          )
        })}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1 },
})
