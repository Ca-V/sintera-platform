// MENU COMPLETO — a plataforma inteira na primeira tela, com busca.
//
// PEDIDOS DA FUNDADORA (27 e 28/08):
//   • ao abrir o aplicativo, ver um menu com TODAS as opções e um resumo do que cada uma guarda;
//   • uma BUSCA em que se digita qualquer palavra e a plataforma leva ao lugar certo;
//   • hierarquia visível: Agenda, depois Minha Saúde COM suas subcategorias, e depois Rede de Cuidado,
//     Despesas e Configurações — que são categorias irmãs, não filhas de Minha Saúde.
//
// A terceira era um defeito de leitura da tela: como os itens finais vinham logo depois dos subgrupos de Minha
// Saúde, sem separação, pareciam pertencer a ela. Aqui o primeiro nível não tem recuo e os filhos de Minha Saúde
// têm — a indentação passa a DIZER a hierarquia, em vez de depender de o leitor adivinhá-la.
//
// SÓ NAVEGAÇÃO E APRESENTAÇÃO (INV-HOME-001): nada de dado de domínio, nada de regra. Nomes, ordem, resumos e
// termos de busca vêm do catálogo do core — os mesmos que a Sidebar da Web usa. As ROTAS vêm de `sectionRoutes`,
// que é a parte que por natureza só existe aqui.
import { useMemo, useState } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { text } from '@sintera/design-system'
import { PLATFORM_NAV, searchSections, type PlatformSection } from '@sintera/core'
import { Text, Input } from '../../primitives'
import { useTheme } from '../../theme'
import type { AppTabParamList } from '../../navigation/types'
import { SECTION_ROUTES } from '../../navigation/sectionRoutes'

export function MenuCompletoSlot() {
  const t = useTheme()
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>()
  const [busca, setBusca] = useState('')

  const ir = (s: PlatformSection) => {
    const r = SECTION_ROUTES[s.id]
    // Navegação aninhada por string (aba → tela) — o padrão do projeto; sem regra de negócio.
    ;(navigation as unknown as { navigate: (n: string, p?: unknown) => void })
      .navigate(r.tab, r.screen ? { screen: r.screen, params: r.params } : undefined)
  }

  // "Painel Inicial" fica de fora: este menu VIVE nele. A Sidebar da Web mostra o item porque acompanha a pessoa
  // em todas as páginas; aqui apontaria para a própria tela.
  const grupos = useMemo(() => PLATFORM_NAV
    .map(g => ({
      ...g,
      subgroups: g.subgroups
        .map(sg => ({ ...sg, sections: sg.sections.filter(s => s.id !== 'inicio') }))
        .filter(sg => sg.sections.length > 0),
    }))
    .filter(g => g.subgroups.length > 0), [])

  const resultados = useMemo(() => searchSections(busca), [busca])
  const buscando = busca.trim().length >= 2

  const linha = (s: PlatformSection, recuada: boolean) => (
    <Pressable
      key={s.id}
      onPress={() => ir(s)}
      accessibilityRole="button"
      accessibilityLabel={`${s.label}. ${s.summary}`}
      style={[
        styles.item,
        recuada && styles.recuada,
        { backgroundColor: t.color.surface.base, borderColor: t.color.border.default },
      ]}
    >
      <Text spec={text(t, { role: 'body' })}>{s.label}</Text>
      <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{s.summary}</Text>
    </Pressable>
  )

  return (
    <View style={styles.wrap}>
      <Text spec={text(t, { role: 'label', tone: 'muted' })}>Menu completo</Text>

      <Input
        value={busca}
        onChangeText={setBusca}
        placeholder="Buscar em toda a plataforma"
        autoCorrect={false}
        clearButtonMode="while-editing"
        accessibilityLabel="Buscar na plataforma"
      />

      {buscando ? (
        // RESULTADO: lista única, sem grupos. Quem buscou já sabe o que quer — reagrupar aqui só afastaria
        // o acerto do topo da tela.
        resultados.length > 0 ? (
          <View style={{ gap: 8 }}>
            {resultados.map(m => linha(m.section, false))}
          </View>
        ) : (
          <Text spec={text(t, { role: 'caption', tone: 'muted' })}>
            Nada encontrado para “{busca.trim()}”. Tente outra palavra — ou role para ver tudo.
          </Text>
        )
      ) : (
        // A lista vem INTEIRA e aberta. Recolher atrás de um "ver mais" devolveria o problema que este slot
        // existe para resolver: quem abre o aplicativo precisa VER o que a plataforma faz.
        grupos.map((g, gi) => (
          <View key={g.id} style={{ gap: 10 }}>
            {gi > 0 && <View style={[styles.divisor, { backgroundColor: t.color.border.default }]} />}

            {g.label && (
              <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 17 }}>{g.label}</Text>
            )}

            {g.subgroups.map((sg, i) => (
              <View key={sg.label ?? `sg-${i}`} style={{ gap: 8 }}>
                {sg.label && (
                  <Text
                    spec={text(t, { role: 'caption', tone: 'faint' })}
                    style={styles.recuada}
                  >
                    {sg.label.toUpperCase()}
                  </Text>
                )}
                {/* Recuo SÓ dentro de um grupo com título: é ele que mostra que estes itens pertencem
                    àquele grupo, e que os de fora não pertencem. */}
                {sg.sections.map(s => linha(s, g.label !== null))}
              </View>
            ))}
          </View>
        ))
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  item: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 4 },
  recuada: { marginLeft: 12 },
  divisor: { height: 1, marginVertical: 4 },
})
