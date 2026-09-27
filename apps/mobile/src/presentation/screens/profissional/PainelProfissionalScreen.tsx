// PESSOAS QUE ACOMPANHO — o painel de quem recebeu o convite.
//
// CARE-003. PARIDADE com a Web (/dashboard/profissional): a lista, os rótulos e o resumo do acesso vêm do
// core. Só o mecanismo diverge (Pressable × Link).
//
// "Um login, uma pessoa, dois perfis, duas assinaturas" (decisão da fundadora). O profissional não entra na
// conta de ninguém: tem a dele, e aqui estão as pessoas que o autorizaram.
//
// A ENTRADA DO CONVITE NO APLICATIVO é colar o link. Não há deep link, e exigir um elevaria o piso do app
// inteiro para quem tem aparelho antigo — o que a disponibilidade universal proíbe. O que a pessoa colou é
// interpretado pelo core, igual nas duas pontas.
import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, View, ActivityIndicator, RefreshControl, Pressable, StyleSheet } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { heading, text } from '@sintera/design-system'
import {
  SCREEN_COPY, nomeDoPaciente, resumoDoAcesso, painelEstaVazio, formatDateBR, nomeDaProfissao,
  tokenDoLinkDeConvite,
  type PacienteNaLista, type PerfilProfissional,
} from '@sintera/core'
import { Text, Input, Button, FieldRow } from '../../primitives'
import { useTheme } from '../../theme'
import { apiClient } from '../../../infrastructure/apiClient'
import type { MaisStackParamList } from '../../navigation/types'

const C = SCREEN_COPY.painelProfissional
const CC = SCREEN_COPY.conviteRecebido

type Props = NativeStackScreenProps<MaisStackParamList, 'PainelProfissional'>

export function PainelProfissionalScreen({ navigation }: Props) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const [pacientes, setPacientes] = useState<PacienteNaLista[]>([])
  const [perfil, setPerfil] = useState<PerfilProfissional | null>(null)
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshing, setRefreshing] = useState(false)
  const [colado, setColado] = useState('')
  const [avisoColado, setAvisoColado] = useState<string | null>(null)
  const alive = useRef(true)

  useEffect(() => () => { alive.current = false }, [])

  const carregar = useCallback(async () => {
    try {
      const [lista, p] = await Promise.all([
        apiClient.care.getPacientesDoProfissional(),
        apiClient.care.getPerfilProfissional(),
      ])
      if (!alive.current) return
      setPacientes(lista)
      setPerfil(p)
      setPhase('ready')
    } catch {
      if (alive.current) setPhase('error')
    }
  }, [])

  useEffect(() => { void carregar() }, [carregar])

  const abrirConvite = () => {
    const token = tokenDoLinkDeConvite(colado)
    if (!token) { setAvisoColado(CC.pasteInvalid); return }
    setAvisoColado(null)
    setColado('')
    navigation.navigate('ConviteRecebido', { token })
  }

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

      {phase === 'loading' && <ActivityIndicator color={t.color.text.muted} />}
      {phase === 'error' && (
        <Text spec={text(t, { role: 'caption', tone: 'muted' })}>
          Não consegui carregar as pessoas que acompanham você.
        </Text>
      )}

      {/* Sem perfil profissional não há o que listar — e o caminho é criar o perfil, não um erro. */}
      {phase === 'ready' && !perfil && (
        <View style={[styles.card, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
          <Text spec={text(t, { role: 'body' })}>{SCREEN_COPY.perfilProfissional.subtitle}</Text>
          <Button label={SCREEN_COPY.perfilProfissional.save}
            onPress={() => navigation.navigate('PerfilProfissional', {})} />
        </View>
      )}

      {phase === 'ready' && perfil && (
        <>
          <View style={[styles.card, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
            <Text spec={text(t, { role: 'body' })}>{perfil.nomeProfissional}</Text>
            <Text spec={text(t, { role: 'caption', tone: 'muted' })}>
              {nomeDaProfissao(perfil.profissao)}
              {perfil.especialidade ? ` · ${perfil.especialidade}` : ''}
              {perfil.conselho && perfil.registroNumero
                ? ` · ${perfil.conselho} ${perfil.registroNumero}${perfil.registroUf ? `/${perfil.registroUf}` : ''}`
                : ''}
            </Text>
          </View>

          {painelEstaVazio(pacientes) ? (
            <View style={styles.vazio}>
              <Text spec={text(t, { role: 'body' })}>{C.emptyTitle}</Text>
              <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{C.emptyMessage}</Text>
            </View>
          ) : (
            pacientes.map((p) => (
              <Pressable key={p.careLinkId} accessibilityRole="button"
                onPress={() => navigation.navigate('PacienteDoProfissional', { careLinkId: p.careLinkId })}
                style={[styles.card, styles.linha, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text spec={text(t, { role: 'body' })}>{nomeDoPaciente(p)}</Text>
                  <Text spec={text(t, { role: 'caption', tone: 'muted' })}>
                    {resumoDoAcesso(p.escopo)}{p.desde ? ` · desde ${formatDateBR(p.desde.toISOString())}` : ''}
                  </Text>
                </View>
                <Text spec={text(t, { role: 'caption', tone: 'muted' })}>›</Text>
              </Pressable>
            ))
          )}
        </>
      )}

      {/* A entrada do convite fica no fim: quem já acompanha alguém vem aqui para ver a lista, não para
          colar link. Quem chegou pelo convite acha, porque a tela é curta. */}
      {phase === 'ready' && (
        <View style={[styles.card, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
          <Text spec={heading(t, { level: 'section' })}>{CC.pasteTitle}</Text>
          <FieldRow label={CC.pasteField}>
            <Input value={colado} onChangeText={setColado} autoCapitalize="none" autoCorrect={false}
              placeholder="https://…/convite/…" />
          </FieldRow>
          <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{CC.pasteHint}</Text>
          {avisoColado && <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{avisoColado}</Text>}
          <Button label={CC.pasteOpen} onPress={abrirConvite} disabled={!colado.trim()} />
        </View>
      )}

      {phase === 'ready' && perfil && (
        <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{C.scopeHint}</Text>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 16 },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, gap: 8 },
  linha: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  vazio: { gap: 4, paddingVertical: 24 },
})
