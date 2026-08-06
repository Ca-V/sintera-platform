// Menu da aba "Mais" (raiz do stack — Inc.4). Projeta o grupo SSOT (Despesas/Relatórios/Configurações) e
// oferece a entrada de conta "Perfil" (como a Web: Mais → Perfil, MOBILE-016 §5). É SÓ NAVEGAÇÃO — sem regra
// de negócio, consulta de dados ou lógica clínica (critério 10, MOBILE-009). Os itens ainda sem tela ficam
// "em breve" (rótulos da taxonomia, não placeholders de dados).
import { ScrollView, View, Pressable, StyleSheet } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { heading, text } from '@sintera/design-system'
import { Text } from '../../primitives'
import { useTheme } from '../../theme'
import type { MaisStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<MaisStackParamList, 'MaisMenu'>

export function MaisMenuScreen({ navigation }: Props) {
  const t = useTheme()
  const insets = useSafeAreaInsets()

  // `onPress` presente = destino existe (navegável); ausente = "em breve".
  const rows: readonly { label: string; onPress?: () => void }[] = [
    { label: 'Perfil', onPress: () => navigation.navigate('Perfil') },
    { label: 'Despesas', onPress: () => navigation.navigate('Despesas') },
    { label: 'Configurações', onPress: () => navigation.navigate('Configuracoes') },
  ]

  return (
    <ScrollView
      style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[styles.content, { paddingTop: styles.content.padding + insets.top }]}
    >
      <Text spec={heading(t, { level: 'page' })}>Mais</Text>
      <View style={{ gap: 8 }}>
        {rows.map((r) => {
          const enabled = !!r.onPress
          return (
            <Pressable
              key={r.label}
              disabled={!enabled}
              onPress={r.onPress}
              accessibilityRole="button"
              style={[
                styles.row,
                { backgroundColor: t.color.surface.base, borderColor: t.color.border.default, opacity: enabled ? 1 : 0.5 },
              ]}
            >
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
})
