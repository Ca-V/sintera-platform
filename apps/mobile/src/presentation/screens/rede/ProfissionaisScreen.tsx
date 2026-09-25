// PROFISSIONAIS — quem acompanha você, e o que cada um enxerga.
//
// CARE-003 §8 etapa 5. PARIDADE com a Web (/dashboard/rede-de-cuidado/profissionais): as seções, a ordem, o
// texto e os estados vêm do core. Só o mecanismo diverge (Pressable × button, Alert × ConfirmDialog).
//
// O QUE ESTA TELA PRECISA DEIXAR ÓBVIO, porque é dado de saúde de quem a usa:
//  · ninguém enxerga nada antes do aceite dela;
//  · ela vê de relance o tamanho do acesso que concedeu a cada um;
//  · encerrar é imediato, e o registro de que existiu não some.
//
// O QUE ELA NÃO FAZ: esconder histórico. Vínculo revogado continua em "Encerrados" — é o registro de quem já
// teve acesso aos dados dela.
import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, View, ActivityIndicator, RefreshControl, Pressable, Alert, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { heading, text } from '@sintera/design-system'
import {
  SCREEN_COPY, secoesDaRedeDeCuidado, redeEstaVazia, descricaoDoProfissional, resumoDoEscopo,
  rotuloParaRemetente, formatDateBR,
  type VinculoNaLista, type ConviteNaLista,
} from '@sintera/core'
import { Text, Input, Button, FieldRow } from '../../primitives'
import { useTheme } from '../../theme'
import { apiClient } from '../../../infrastructure/apiClient'

const C = SCREEN_COPY.profissionais

export function ProfissionaisScreen() {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const [vinculos, setVinculos] = useState<VinculoNaLista[]>([])
  const [convites, setConvites] = useState<ConviteNaLista[]>([])
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshing, setRefreshing] = useState(false)
  const [contato, setContato] = useState('')
  const [enviando, setEnviando] = useState(false)
  const alive = useRef(true)

  useEffect(() => () => { alive.current = false }, [])

  const carregar = useCallback(async () => {
    try {
      const rede = await apiClient.care.getRedeDeCuidado()
      if (!alive.current) return
      setVinculos(rede.vinculos)
      setConvites(rede.convites)
      setPhase('ready')
    } catch {
      if (alive.current) setPhase('error')
    }
  }, [])

  useEffect(() => { void carregar() }, [carregar])

  const convidar = async () => {
    if (!contato.trim() || enviando) return
    setEnviando(true)
    try {
      await apiClient.care.convidarProfissional(contato)
      if (!alive.current) return
      setContato('')
      await carregar()
    } catch (e) {
      Alert.alert('Não consegui enviar o convite', e instanceof Error ? e.message : 'Tente de novo.')
    } finally {
      if (alive.current) setEnviando(false)
    }
  }

  const confirmarRevogacao = (v: VinculoNaLista) => {
    Alert.alert(
      C.revoke,
      `${v.nomeProfissional} deixa de ver seus dados. ${C.revokeHint}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: C.revoke, style: 'destructive',
          onPress: () => { void apiClient.care.revogarVinculo(v.id).then(carregar) },
        },
      ],
    )
  }

  const agora = new Date()
  const secoes = secoesDaRedeDeCuidado(vinculos, convites, agora)
  const vazia = redeEstaVazia(vinculos, convites, agora)

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

      {/* Convidar vem ANTES da lista: numa tela vazia é a única ação possível, e numa cheia continua sendo o
          que a pessoa vem fazer aqui. */}
      <View style={[styles.card, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
        <FieldRow label={C.fieldContact}>
          <Input value={contato} onChangeText={setContato}
            placeholder="nome@exemplo.com" autoCapitalize="none" keyboardType="email-address" />
        </FieldRow>
        <Button label={C.invite} onPress={() => { void convidar() }} disabled={!contato.trim() || enviando} />
        {/* A frase que desarma a dúvida antes de ela existir. */}
        <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{C.contactHint}</Text>
      </View>

      {phase === 'loading' && <ActivityIndicator color={t.color.text.muted} />}
      {phase === 'error' && (
        <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Não consegui carregar sua rede de cuidado.</Text>
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

          {s.vinculos.map((v) => (
            <View key={v.id} style={[styles.card, styles.linha, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text spec={text(t, { role: 'body' })}>{v.nomeProfissional}</Text>
                <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{descricaoDoProfissional(v)}</Text>
                <Text spec={text(t, { role: 'caption', tone: 'muted' })}>
                  {resumoDoEscopo(v.escopo)}{v.desde ? ` · desde ${formatDateBR(v.desde.toISOString())}` : ''}
                </Text>
              </View>
              {v.status === 'ativo' && (
                <Pressable onPress={() => confirmarRevogacao(v)} accessibilityRole="button">
                  <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{C.revoke}</Text>
                </Pressable>
              )}
            </View>
          ))}

          {s.convites.map((c) => (
            <View key={c.id} style={[styles.card, styles.linha, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text spec={text(t, { role: 'body' })}>{c.paraContato}</Text>
                {/* "Convite encerrado" e não "recusado": quem convidou não precisa saber que foi negativa. */}
                <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{rotuloParaRemetente(c.status)}</Text>
              </View>
              {c.status === 'enviado' && (
                <Pressable onPress={() => { void apiClient.care.cancelarConvite(c.id).then(carregar) }} accessibilityRole="button">
                  <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{C.cancelInvite}</Text>
                </Pressable>
              )}
            </View>
          ))}
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
