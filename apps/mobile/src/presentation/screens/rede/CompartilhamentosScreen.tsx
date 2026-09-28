// COMPARTILHAMENTOS — os links de relatório que você criou.
//
// CARE-003. PARIDADE com a Web (/dashboard/rede-de-cuidado/compartilhamentos): as seções, a ordem, o texto e
// os estados vêm do core.
//
// O MECANISMO DIVERGE, E É LEGÍTIMO. A Web copia para a área de transferência; aqui o sistema abre a folha de
// compartilhamento nativa (`Share`, da própria React Native — sem dependência nova, e é o gesto que a pessoa
// já usa no celular). A DECISÃO — o que é um link aberto, o que pode ser encerrado, e que palavras ela lê —
// mora no core, decidida uma vez para as duas pontas.
//
// O FATO QUE A TELA DIZ ANTES: o link é PÚBLICO. `/r/<token>` não pede login.
import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, View, ActivityIndicator, RefreshControl, Pressable, Alert, Share, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { heading, text } from '@sintera/design-system'
import {
  SCREEN_COPY, secoesDeCompartilhamentos, compartilhamentosVazio, estadoDoCompartilhamento, podeRevogar,
  rotuloDoCompartilhamento, resumoDoConteudo, urlDoCompartilhamento, formatDateBR,
  type CompartilhamentoNaLista,
} from '@sintera/core'
import { Text } from '../../primitives'
import { useTheme } from '../../theme'
import { apiClient } from '../../../infrastructure/apiClient'

const C = SCREEN_COPY.compartilhamentos
const dataBR = (d: Date) => formatDateBR(d.toISOString())

// Mesma origem que a ponte ADR-020 usa. Ausente, a tela AVISA em vez de montar um link quebrado.
const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL

export function CompartilhamentosScreen() {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const [itens, setItens] = useState<CompartilhamentoNaLista[]>([])
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshing, setRefreshing] = useState(false)
  const alive = useRef(true)

  useEffect(() => () => { alive.current = false }, [])

  const carregar = useCallback(async () => {
    try {
      const linhas = await apiClient.report.listAllShares()
      if (!alive.current) return
      setItens(linhas.map((l) => ({
        id: l.id,
        token: l.token,
        criadoEm: new Date(l.created_at),
        expiraEm: new Date(l.expires_at),
        revogado: l.revoked,
        // Link antigo pode não ter `sections`. Vazio = relatório inteiro, e quem resolve isso é o core.
        secoes: Array.isArray(l.sections) ? l.sections : [],
      })))
      setPhase('ready')
    } catch {
      if (alive.current) setPhase('error')
    }
  }, [])

  useEffect(() => { void carregar() }, [carregar])

  const compartilhar = async (c: CompartilhamentoNaLista) => {
    if (!WEB_URL) { Alert.alert(C.title, C.noWebUrl); return }
    try {
      await Share.share({ message: urlDoCompartilhamento(c.token, WEB_URL) })
    } catch {
      // A pessoa fechou a folha, ou o sistema recusou. Não há o que corrigir e não há o que afirmar.
    }
  }

  const confirmarRevogacao = (c: CompartilhamentoNaLista) => {
    Alert.alert(C.revoke, C.revokeHint, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: C.revoke, style: 'destructive',
        onPress: () => { void apiClient.report.revokeShare(c.id).then(carregar) },
      },
    ])
  }

  const agora = new Date()
  const secoes = secoesDeCompartilhamentos(itens, agora)
  const vazia = compartilhamentosVazio(itens)

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
      <Text spec={heading(t, { level: 'page' })}>{C.title}</Text>
      <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{C.subtitle}</Text>

      {/* O aviso vem ANTES da lista. Depois dela, viraria rodapé que ninguém lê. */}
      <View style={[styles.card, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
        <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{C.publicWarning}</Text>
      </View>

      {phase === 'loading' && <ActivityIndicator color={t.color.text.muted} />}
      {phase === 'error' && (
        <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Não consegui carregar seus compartilhamentos.</Text>
      )}

      {phase === 'ready' && vazia && (
        <View style={styles.vazio}>
          <Text spec={text(t, { role: 'body' })}>{C.emptyTitle}</Text>
          <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{C.emptyMessage}</Text>
        </View>
      )}

      {phase === 'ready' && secoes.map((s) => (
        <View key={s.chave} style={{ gap: 8 }}>
          <Text spec={heading(t, { level: 'section' })}>{s.titulo}</Text>

          {s.itens.map((c) => {
            const estado = estadoDoCompartilhamento(c, agora)
            return (
              <View key={c.id} style={[styles.card, styles.linha, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text spec={text(t, { role: 'body' })}>{resumoDoConteudo(c.secoes)}</Text>
                  <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{rotuloDoCompartilhamento(c, agora, dataBR)}</Text>
                  <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Criado em {dataBR(c.criadoEm)}</Text>
                </View>
                {/* Só link que abre pode ser compartilhado ou encerrado. Oferecer o endereço de um link morto
                    seria entregar algo que não funciona sem dizer que não funciona. */}
                {podeRevogar(estado) && (
                  <View style={{ gap: 6, alignItems: 'flex-end' }}>
                    <Pressable onPress={() => { void compartilhar(c) }} accessibilityRole="button">
                      <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{C.shareLink}</Text>
                    </Pressable>
                    <Pressable onPress={() => confirmarRevogacao(c)} accessibilityRole="button">
                      <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{C.revoke}</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )
          })}
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 16 },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, gap: 8 },
  linha: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  vazio: { gap: 4, paddingVertical: 24 },
})
