// Menu da aba "Rede de Cuidado" (raiz do stack). Paridade TOTAL com a Web (/dashboard/rede-de-cuidado).
//
// AS LINHAS E O TEXTO VÊM DO CORE (BASE ÚNICA). Estavam digitados aqui E na Web, com as mesmas palavras —
// iguais até o dia em que uma das pontas mudasse, e aí divergiriam sem ninguém notar. O mecanismo diverge
// (Pressable × Link); a decisão — quais linhas, em que ordem, com que texto e em que estado — não.
import { ScrollView, View, Pressable, StyleSheet } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { heading, text } from '@sintera/design-system'
import { MENU_REDE, SCREEN_COPY, type DestinoRede } from '@sintera/core'
import { Text } from '../../primitives'
import { useTheme } from '../../theme'
import type { RedeCuidadoStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<RedeCuidadoStackParamList, 'RedeMenu'>

export function RedeCuidadoMenuScreen({ navigation }: Props) {
  const t = useTheme()
  const insets = useSafeAreaInsets()

  const irPara = (destino: DestinoRede) => {
    if (destino === 'relatorio') navigation.navigate('Relatorio')
    else if (destino === 'profissionais') navigation.navigate('Profissionais')
  }

  return (
    <ScrollView style={{ backgroundColor: t.color.surface.app }} contentContainerStyle={[styles.content, { paddingTop: styles.content.padding + insets.top }]}>
      <Text spec={heading(t, { level: 'page' })}>{SCREEN_COPY.rede.title}</Text>
      <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{SCREEN_COPY.rede.subtitle}</Text>
      <View style={{ gap: 8 }}>
        {MENU_REDE.map((r) => (
          <View key={r.destino}>
            <Pressable disabled={!r.disponivel} onPress={() => irPara(r.destino)} accessibilityRole="button"
              style={[styles.row, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default, opacity: r.disponivel ? 1 : 0.5 }]}>
              <Text spec={text(t, { role: 'body' })}>{r.label}</Text>
              <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{r.disponivel ? '›' : SCREEN_COPY.rede.soonLabel}</Text>
            </Pressable>
            {/* Indisponível sem motivo faz a pessoa achar que errou. O motivo vem do core. */}
            {!r.disponivel && (
              <Text spec={text(t, { role: 'caption', tone: 'muted' })} style={styles.motivo}>{SCREEN_COPY.rede.soonReason}</Text>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1 },
  motivo: { marginTop: 4, paddingHorizontal: 4 },
})
