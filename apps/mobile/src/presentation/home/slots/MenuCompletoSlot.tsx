// MENU COMPLETO — a plataforma inteira na primeira tela, com busca.
//
// PEDIDOS DA FUNDADORA (27 e 28/08):
//   • ao abrir o aplicativo, ver um menu com TODAS as opções e um resumo do que cada uma guarda;
//   • hierarquia visível: Agenda, depois Minha Saúde COM suas subcategorias, e depois Rede de Cuidado, Despesas
//     e Configurações — categorias irmãs, não filhas de Minha Saúde;
//   • uma busca em que "qualquer palavra que estiver dentro da plataforma precisa ser encontrada".
//
// A BUSCA TEM DUAS NATUREZAS, e mostrar as duas é o que a torna honesta:
//   • REGISTROS — o que a pessoa cadastrou. "Vitamina D" acha o suplemento que ela toma E o indicador dentro do
//     laudo, para ela escolher em qual entrar. Vêm PRIMEIRO: quem digita o nome de uma coisa sua quer a coisa.
//   • SEÇÕES — onde as coisas ficam. "Pressão" leva a Monitoramento. É o mapa, e vale quando o nome digitado
//     não é de nada que ela tenha registrado ainda.
//
// A primeira versão só tinha seções, e "vitamina D" devolvia NADA ENCONTRADO — sobre um dado que existe. Isso é
// pior do que não ter busca: ensina a não confiar nela.
//
// SÓ NAVEGAÇÃO E APRESENTAÇÃO (INV-HOME-001): os achados chegam por PROP, do HomeContainer. Nomes, ordem,
// resumos e a ordenação dos achados vêm do core; as ROTAS, de `sectionRoutes` — a parte que só existe aqui.
import { useMemo } from 'react'
import { View, Pressable, ActivityIndicator, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { text } from '@sintera/design-system'
import {
  PLATFORM_NAV, searchSections, rankHits, groupHits, shouldQuery,
  type PlatformSection, type SearchHit, type SectionId,
} from '@sintera/core'
import { Text, Input } from '../../primitives'
import { useTheme } from '../../theme'
import type { AppTabParamList } from '../../navigation/types'
import { SECTION_ROUTES } from '../../navigation/sectionRoutes'

export interface MenuCompletoSlotProps {
  busca: string
  onBusca: (v: string) => void
  hits: readonly SearchHit[]
  procurando: boolean
  onLimpar: () => void
}

export function MenuCompletoSlot({ busca, onBusca, hits, procurando, onLimpar }: MenuCompletoSlotProps) {
  const t = useTheme()
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>()

  const irPara = (id: SectionId) => {
    const r = SECTION_ROUTES[id]
    // Navegação aninhada por string (aba → tela) — o padrão do projeto; sem regra de negócio.
    ;(navigation as unknown as { navigate: (n: string, p?: unknown) => void })
      .navigate(r.tab, r.screen ? { screen: r.screen, params: r.params } : undefined)
    // A aba Início continua montada ao navegar. Sem limpar, quem voltasse encontraria a busca antiga preenchida
    // e o menu ainda filtrado — parecendo que a plataforma encolheu.
    onLimpar()
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

  const buscando = shouldQuery(busca)
  const registros = useMemo(() => groupHits(rankHits(hits, busca)), [hits, busca])
  const secoes = useMemo(() => (buscando ? searchSections(busca) : []), [busca, buscando])
  const semNada = buscando && !procurando && registros.length === 0 && secoes.length === 0

  const cartao = (
    titulo: string,
    detalhe: string | null | undefined,
    onPress: () => void,
    chave: string,
    recuada = false,
  ) => (
    <Pressable
      key={chave}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={detalhe ? `${titulo}. ${detalhe}` : titulo}
      style={[
        styles.item,
        recuada && styles.recuada,
        { backgroundColor: t.color.surface.base, borderColor: t.color.border.default },
      ]}
    >
      <Text spec={text(t, { role: 'body' })}>{titulo}</Text>
      {detalhe ? <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{detalhe}</Text> : null}
    </Pressable>
  )

  return (
    <View style={styles.wrap}>
      <Text spec={text(t, { role: 'label', tone: 'muted' })}>Menu completo</Text>

      {/* LIMPAR precisa existir aqui, e não via `clearButtonMode`: aquela propriedade é só do iOS, e no Android
          — que é onde a plataforma é homologada — a pessoa teria que apagar a busca letra por letra. */}
      <View>
        <Input
          value={busca}
          onChangeText={onBusca}
          placeholder="Buscar em toda a plataforma"
          autoCorrect={false}
          accessibilityLabel="Buscar na plataforma"
          style={busca.length > 0 ? { paddingRight: 72 } : undefined}
        />
        {busca.length > 0 && (
          <Pressable onPress={onLimpar} accessibilityRole="button" accessibilityLabel="Limpar busca" hitSlop={10} style={styles.limpar}>
            <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>Limpar</Text>
          </Pressable>
        )}
      </View>

      {buscando ? (
        <View style={{ gap: 14 }}>
          {/* OS SEUS REGISTROS, agrupados por natureza. O grupo é o que distingue o suplemento "Vitamina D" do
              indicador "Vitamina D" — sem ele, dois achados de mesmo nome ficariam indistinguíveis. */}
          {registros.map(g => (
            <View key={g.kind} style={{ gap: 8 }}>
              <Text spec={text(t, { role: 'caption', tone: 'faint' })}>{g.label.toUpperCase()}</Text>
              {g.hits.map(h => cartao(h.title, h.subtitle, () => irPara(h.section), `${g.kind}-${h.id}`))}
            </View>
          ))}

          {/* AS SEÇÕES vêm depois, sob um título que diz o que são: quem procurava um registro não deve confundir
              "Monitoramento" com um dado seu. */}
          {secoes.length > 0 && (
            <View style={{ gap: 8 }}>
              <Text spec={text(t, { role: 'caption', tone: 'faint' })}>ONDE REGISTRAR</Text>
              {secoes.map(m => cartao(m.section.label, m.section.summary, () => irPara(m.section.id), `sec-${m.section.id}`))}
            </View>
          )}

          {procurando && registros.length === 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator size="small" color={t.color.text.muted} />
              <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Procurando…</Text>
            </View>
          )}

          {semNada && (
            <Text spec={text(t, { role: 'caption', tone: 'muted' })}>
              Nada encontrado para “{busca.trim()}” — nem nos seus registros, nem nas seções. Tente outra palavra,
              ou limpe a busca para ver a plataforma inteira.
            </Text>
          )}
        </View>
      ) : (
        // A lista vem INTEIRA e aberta. Recolher atrás de um "ver mais" devolveria o problema que este slot
        // existe para resolver: quem abre o aplicativo precisa VER o que a plataforma faz.
        grupos.map((g, gi) => (
          <View key={g.id} style={{ gap: 10 }}>
            {gi > 0 && <View style={[styles.divisor, { backgroundColor: t.color.border.default }]} />}

            {g.label && <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 17 }}>{g.label}</Text>}

            {g.subgroups.map((sg, i) => (
              <View key={sg.label ?? `sg-${i}`} style={{ gap: 8 }}>
                {sg.label && (
                  <Text spec={text(t, { role: 'caption', tone: 'faint' })} style={styles.recuada}>
                    {sg.label.toUpperCase()}
                  </Text>
                )}
                {/* Recuo SÓ dentro de um grupo com título: é ele que mostra que estes itens pertencem àquele
                    grupo, e que os de fora não pertencem. */}
                {sg.sections.map((s: PlatformSection) =>
                  cartao(s.label, s.summary, () => irPara(s.id), s.id, g.label !== null))}
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
  limpar: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
})
