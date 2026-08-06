// Menu da aba "Rede de Cuidado" (raiz do stack). Entidade permanente (CARE-002 futura): hoje Relatórios;
// Profissionais/Compartilhamentos ficam "em breve" (rótulos da taxonomia, sem placeholder de dados). Só navegação.
import { ScrollView, View, Pressable, StyleSheet } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { heading, text } from '@sintera/design-system'
import { Text } from '../../primitives'
import { useTheme } from '../../theme'
import type { RedeCuidadoStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<RedeCuidadoStackParamList, 'RedeMenu'>

export function RedeCuidadoMenuScreen({ navigation }: Props) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const rows: readonly { label: string; onPress?: () => void }[] = [
    { label: 'Relatórios', onPress: () => navigation.navigate('Relatorio') },
    { label: 'Profissionais' },
    { label: 'Compartilhamentos' },
  ]
  return (
    <ScrollView style={{ backgroundColor: t.color.surface.app }} contentContainerStyle={[styles.content, { paddingTop: styles.content.padding + insets.top }]}>
      <Text spec={heading(t, { level: 'page' })}>Rede de Cuidado</Text>
      <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Leve sua saúde a quem cuida de você. Relatórios hoje; profissionais e compartilhamentos em breve.</Text>
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
