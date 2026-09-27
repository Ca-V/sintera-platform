// UMA PESSOA QUE AUTORIZOU VOCÊ — só o que ela autorizou.
//
// CARE-003. PARIDADE com a Web (/dashboard/profissional/[careLinkId]).
//
// Quem impõe o limite é o RLS (migração 161), não esta tela. Se uma consulta devolvesse dado indevido, o
// defeito estaria na policy — a tela nunca é a última linha de defesa.
//
// O QUE ELA NÃO FAZ: interpretar. Lista o que existe, com data e título. A plataforma preserva, organiza e
// apresenta; não produz conteúdo clínico (RDC 657).
import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, View, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { heading, text } from '@sintera/design-system'
import {
  SCREEN_COPY, nomeDoPaciente, modulosAutorizados, rotuloDoModulo, moduloCarregou, formatDateBR,
  type PacienteNaLista,
} from '@sintera/core'
import type { ConteudoDoModulo } from '@sintera/api-client'
import { Text } from '../../primitives'
import { useTheme } from '../../theme'
import { apiClient } from '../../../infrastructure/apiClient'
import type { MaisStackParamList } from '../../navigation/types'

const C = SCREEN_COPY.painelProfissional

type Props = NativeStackScreenProps<MaisStackParamList, 'PacienteDoProfissional'>

export function PacienteDoProfissionalScreen({ route }: Props) {
  const { careLinkId } = route.params
  const t = useTheme()
  const insets = useSafeAreaInsets()

  const [paciente, setPaciente] = useState<PacienteNaLista | null>(null)
  const [modulos, setModulos] = useState<ConteudoDoModulo[]>([])
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshing, setRefreshing] = useState(false)
  const alive = useRef(true)

  useEffect(() => () => { alive.current = false }, [])

  const carregar = useCallback(async () => {
    try {
      // A lista vem da função do banco, que já filtra por vínculo ativo deste profissional. Não aceitar o id
      // cru da rota é o que impede que um id trocado mostre o NOME de outra pessoa — o RLS barraria os dados,
      // mas o nome viria do lugar errado.
      const lista = await apiClient.care.getPacientesDoProfissional()
      const p = lista.find(x => x.careLinkId === careLinkId) ?? null
      if (!alive.current) return
      setPaciente(p)
      if (p) {
        const conteudo = await apiClient.care.getConteudoDosModulos(p.pacienteUserId, p.escopo)
        if (alive.current) setModulos(conteudo)
      }
      if (alive.current) setPhase('ready')
    } catch {
      if (alive.current) setPhase('error')
    }
  }, [careLinkId])

  useEffect(() => { void carregar() }, [carregar])

  const autorizados = paciente ? modulosAutorizados(paciente.escopo) : []

  return (
    <ScrollView
      style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[styles.content, { paddingBottom: styles.content.padding + insets.bottom }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => {
          setRefreshing(true)
          void carregar().finally(() => alive.current && setRefreshing(false))
        }} />
      }
    >
      {phase === 'loading' && <ActivityIndicator color={t.color.text.muted} />}
      {phase === 'error' && (
        <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Não consegui carregar esta pessoa.</Text>
      )}

      {/* Vínculo encerrado enquanto a tela estava aberta, ou id que não é desta conta. Os dois caem aqui, e é
          assim de propósito: distinguir confirmaria a existência de um vínculo alheio. */}
      {phase === 'ready' && !paciente && (
        <Text spec={text(t, { role: 'body' })}>Esta pessoa não está mais na sua lista.</Text>
      )}

      {phase === 'ready' && paciente && (
        <>
          <Text spec={heading(t, { level: 'page' })}>{nomeDoPaciente(paciente)}</Text>
          <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{C.scopeTitle}</Text>

          {autorizados.length === 0 ? (
            <Text spec={text(t, { role: 'body' })}>{C.noAccess}</Text>
          ) : (
            autorizados.map((m) => {
              const conteudo = modulos.find(x => x.chave === m.chave)
              const total = conteudo?.total ?? -1
              return (
                <View key={m.chave} style={{ gap: 8 }}>
                  <View style={{ gap: 2 }}>
                    <Text spec={heading(t, { level: 'section' })}>{m.label}</Text>
                    <Text spec={text(t, { role: 'caption', tone: 'muted' })}>
                      {m.descricao} · {rotuloDoModulo(total)}
                    </Text>
                  </View>

                  {moduloCarregou(total) && (conteudo?.itens ?? []).map((i) => (
                    <View key={i.id} style={[styles.card, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
                      <Text spec={text(t, { role: 'body' })}>{i.titulo}</Text>
                      {/* Registro sem data própria existe. Dizer "sem data" é melhor do que inventar uma. */}
                      <Text spec={text(t, { role: 'caption', tone: 'muted' })}>
                        {i.data ? formatDateBR(i.data) : 'Sem data registrada'}
                      </Text>
                    </View>
                  ))}
                </View>
              )
            })
          )}

          <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{C.scopeHint}</Text>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 16 },
  card: { padding: 12, borderRadius: 12, borderWidth: 1, gap: 2 },
})
