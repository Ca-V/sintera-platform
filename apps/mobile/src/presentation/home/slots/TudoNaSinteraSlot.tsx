// "Tudo na SINTERA" — o menu COMPLETO na primeira tela (pedido da fundadora, 27/08).
//
// POR QUÊ: abrindo o aplicativo, a pessoa via quatro atalhos de alta frequência e cinco passos de como usar. Não
// via a plataforma inteira. Quem entra pela primeira vez — ou volta depois de um tempo — não tem como saber o que
// existe sem caçar dentro das abas. Este slot é o equivalente da Sidebar da Web: todas as seções, nos mesmos
// grupos, na mesma ordem, cada uma dizendo numa frase o que guarda.
//
// SÓ NAVEGAÇÃO E APRESENTAÇÃO (INV-HOME-001): nada de dado de domínio, nada de regra. Os nomes, a ordem e os
// resumos vêm do catálogo do core — os mesmos que a Sidebar usa. As ROTAS vêm de `sectionRoutes`, que é a parte
// que por natureza só existe aqui.
import { View, Pressable, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { text } from '@sintera/design-system'
import { PLATFORM_NAV, type PlatformSection } from '@sintera/core'
import { Text } from '../../primitives'
import { useTheme } from '../../theme'
import type { AppTabParamList } from '../../navigation/types'
import { SECTION_ROUTES } from '../../navigation/sectionRoutes'

export function TudoNaSinteraSlot() {
  const t = useTheme()
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>()

  const ir = (s: PlatformSection) => {
    const r = SECTION_ROUTES[s.id]
    // Navegação aninhada por string (aba → tela) — o padrão do projeto; sem regra de negócio.
    ;(navigation as unknown as { navigate: (n: string, p?: unknown) => void })
      .navigate(r.tab, r.screen ? { screen: r.screen, params: r.params } : undefined)
  }

  // "Painel Inicial" fica de fora: este menu VIVE nele. A Sidebar da Web mostra o item porque acompanha a pessoa
  // em todas as páginas; aqui apontaria para a própria tela.
  const grupos = PLATFORM_NAV
    .map(g => ({
      ...g,
      subgroups: g.subgroups
        .map(sg => ({ ...sg, sections: sg.sections.filter(s => s.id !== 'inicio') }))
        .filter(sg => sg.sections.length > 0),
    }))
    .filter(g => g.subgroups.length > 0)

  // A lista vem INTEIRA e aberta. Recolher por trás de um "ver mais" devolveria o problema que este slot existe
  // para resolver: quem abre o aplicativo precisa VER o que a plataforma faz, não descobrir que há mais adiante.
  return (
    <View style={styles.wrap}>
      <Text spec={text(t, { role: 'label', tone: 'muted' })}>Tudo na SINTERA</Text>

      {grupos.map(g => (
        <View key={g.id} style={{ gap: 10 }}>
          {g.label && <Text spec={text(t, { role: 'bodyStrong' })}>{g.label}</Text>}
          {g.subgroups.map((sg, i) => (
            <View key={sg.label ?? `sg-${i}`} style={{ gap: 8 }}>
              {sg.label && (
                <Text spec={text(t, { role: 'caption', tone: 'faint' })}>{sg.label.toUpperCase()}</Text>
              )}
              {sg.sections.map(s => (
                <Pressable
                  key={s.id}
                  onPress={() => ir(s)}
                  accessibilityRole="button"
                  accessibilityLabel={`${s.label}. ${s.summary}`}
                  style={[styles.item, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}
                >
                  <Text spec={text(t, { role: 'body' })}>{s.label}</Text>
                  <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{s.summary}</Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      ))}

    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  item: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 4 },
})
