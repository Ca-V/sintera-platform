// Conexões — dispositivos e serviços de saúde (HIP-001). Paridade com a Web /dashboard/conexoes.
//
// POR QUE ESTA TELA PASSOU A EXISTIR (homologação da fundadora, 25/08): Conexões só existia na Web. O
// protocolo é que tudo que existe numa ponta existe na outra — e esta tela em particular é a PORTA das
// integrações com dispositivos, que é a próxima fase do produto. Sem ela, o Mobile não tinha caminho nenhum.
//
// O estado, os rótulos e o tom vêm do core (`connectorStatusLabel`, `connectorPrimaryAction`) — a Web lê os
// MESMOS. O texto da tela vem de SCREEN_COPY. Nada é redigido aqui.
//
// O fluxo de autorização abre no NAVEGADOR, de propósito: é OAuth do fabricante, e o app nunca manipula a
// credencial da pessoa.
import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, View, ActivityIndicator, RefreshControl, Pressable, Alert, Linking, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { text } from '@sintera/design-system'
import type { ConnectorState } from '@sintera/core'
import {
  connectorStatusLabel, connectorStatusTone, connectorPrimaryAction, isConnectorActive, SCREEN_COPY,
} from '@sintera/core'
import { Text, Button, Disclaimer } from '../../primitives'
import { useTheme } from '../../theme'
import { apiClient } from '../../../infrastructure/apiClient'
import { healthConnectDisponivel, sincronizarHealthConnect } from '../../../infrastructure/healthConnect'

const C = SCREEN_COPY.conexoes

function fmtDataHora(iso: string | null): string {
  if (!iso) return '—'
  const d = iso.slice(0, 10).split('-')
  const h = iso.slice(11, 16)
  return d.length === 3 ? `${d[2]}/${d[1]}/${d[0]}${h ? ` às ${h}` : ''}` : '—'
}

export function ConexoesScreen() {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const [items, setItems] = useState<ConnectorState[]>([])
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const alive = useRef(true)

  // Health Connect — estado próprio, porque não vem da API: é do aparelho. `null` = ainda não perguntamos.
  const [hcDisponivel, setHcDisponivel] = useState<boolean | null>(null)
  const [hcOcupado, setHcOcupado] = useState(false)
  const [hcResumo, setHcResumo] = useState<string | null>(null)

  useEffect(() => {
    healthConnectDisponivel().then(d => { if (alive.current) setHcDisponivel(d) }).catch(() => {
      if (alive.current) setHcDisponivel(false)
    })
  }, [])

  const sincronizarHc = useCallback(async () => {
    setHcOcupado(true); setHcResumo(null)
    try {
      // Primeira sincronização: 30 dias para trás. O bruto é idempotente, então repetir a janela não duplica.
      const ate = new Date()
      const desde = new Date(ate.getTime() - 30 * 24 * 60 * 60 * 1000)
      const r = await sincronizarHealthConnect(desde, ate)
      if (!alive.current) return
      setHcDisponivel(r.disponivel)
      if (!r.disponivel) { setHcResumo(null); return }
      if (!r.autorizado) { setHcResumo(C.hcDenied); return }
      if (r.erro) { setHcResumo(r.erro); return }
      // Diz o que ENTROU, não "sucesso" — número verificável é mais confiável que adjetivo.
      const partes = [
        r.leituras > 0 ? `${r.leituras} ${r.leituras === 1 ? 'leitura' : 'leituras'}` : null,
        r.sessoes > 0 ? `${r.sessoes} ${r.sessoes === 1 ? 'atividade' : 'atividades'}` : null,
      ].filter(Boolean)
      setHcResumo(partes.length ? `${partes.join(' · ')} — veja em Monitoramento` : 'Nada novo desde a última vez')
    } finally {
      if (alive.current) setHcOcupado(false)
    }
  }, [])

  const load = useCallback((silent: boolean) => {
    if (silent) setRefreshing(true); else setPhase('loading')
    apiClient.connectors.listConnectors()
      .then((cs) => { if (!alive.current) return; setItems(cs); setPhase('ready'); setError(null) })
      .catch((e) => {
        if (alive.current && !silent) {
          setError(e instanceof Error ? e.message : 'Não foi possível carregar.')
          setPhase('error')
        }
      })
      .finally(() => { if (alive.current) setRefreshing(false) })
  }, [])
  useEffect(() => { alive.current = true; load(false); return () => { alive.current = false } }, [load])

  async function conectar(c: ConnectorState) {
    const url = apiClient.connectors.connectUrl(c.source)
    if (!url) { Alert.alert('Indisponível', 'A conexão não está configurada neste aparelho.'); return }
    // Navegador: a autorização é do fabricante e a credencial é da pessoa. Ao voltar, o pull-to-refresh
    // atualiza o estado — o retorno do OAuth acontece na Web.
    await Linking.openURL(url)
  }

  async function sincronizar(c: ConnectorState) {
    setBusy(c.source)
    try {
      const { error: err } = await apiClient.connectors.syncConnector(c.source)
      if (err) Alert.alert('Não foi possível sincronizar', err.message)
      else load(true)
    } finally { setBusy(null) }
  }

  function desconectar(c: ConnectorState) {
    Alert.alert(
      `${C.disconnect} ${c.label}?`,
      'Os dados já recebidos permanecem. A fonte para de enviar novos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: C.disconnect, style: 'destructive',
          onPress: async () => {
            setBusy(c.source)
            try {
              const { error: err } = await apiClient.connectors.disconnectConnector(c.source)
              if (err) Alert.alert('Não foi possível desconectar', err.message)
              else load(true)
            } finally { setBusy(null) }
          },
        },
      ],
    )
  }

  const toneColor = (c: ConnectorState) => {
    const tone = connectorStatusTone(c.status)
    if (tone === 'success') return t.color.badge.success.text
    if (tone === 'error') return t.color.badge.error.text
    if (tone === 'attention') return t.color.badge.attention.text
    return t.color.text.muted
  }

  if (phase === 'loading') {
    return <View style={s.center}><ActivityIndicator color={t.color.identity.primary} /></View>
  }
  if (phase === 'error') {
    return (
      <View style={s.center}>
        <Text spec={text(t, { role: 'body' })} style={{ color: t.color.text.muted, textAlign: 'center' }}>{error}</Text>
        <View style={{ height: 12 }} />
        <Button label="Tentar de novo" onPress={() => load(false)} variant="secondary" />
      </View>
    )
  }

  const card = { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }

  return (
    <ScrollView
      style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 12 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={t.color.identity.primary} />}
    >
      <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 22 }}>{C.title}</Text>
      <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{C.subtitle}</Text>

      {/* HEALTH CONNECT (HIP-014 §5) — vem PRIMEIRO porque é de natureza diferente das demais: lê o que já
          está no aparelho, sem login nem senha, e traz junto Strava, Oura e Garmin sem contrato separado com
          cada fabricante. A autorização vive na permissão do sistema operacional — a pessoa revoga por lá. */}
      <View style={[s.card, card, { gap: 8 }]}>
        <View style={s.linha}>
          <Text spec={text(t, { role: 'bodyStrong' })} style={{ flex: 1 }}>{C.hcTitle}</Text>
          {hcDisponivel === false && (
            <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.text.muted }}>{C.hcUnavailable}</Text>
          )}
        </View>
        <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{C.hcSubtitle}</Text>

        {hcDisponivel === false ? (
          <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{C.hcUnavailableHint}</Text>
        ) : (
          <>
            <Button
              label={hcOcupado ? C.hcSyncing : C.hcAction}
              onPress={sincronizarHc}
              loading={hcOcupado}
              loadingLabel={C.hcSyncing}
              variant="secondary"
            />
            <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{C.hcRevokeHint}</Text>
          </>
        )}

        {hcResumo && (
          <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>{hcResumo}</Text>
        )}
      </View>

      {items.length === 0 ? (
        <View style={[s.card, card, { gap: 4 }]}>
          <Text spec={text(t, { role: 'bodyStrong' })} style={{ textAlign: 'center' }}>{C.emptyTitle}</Text>
          <Text spec={text(t, { role: 'body', tone: 'muted' })} style={{ textAlign: 'center' }}>{C.emptyMessage}</Text>
        </View>
      ) : (
        items.map(c => (
          <View key={c.source} style={[s.card, card, { gap: 8 }]}>
            <View style={s.linha}>
              <Text spec={text(t, { role: 'bodyStrong' })} style={{ flex: 1 }}>{c.label}</Text>
              <Text spec={text(t, { role: 'caption' })} style={{ color: toneColor(c) }}>
                {connectorStatusLabel(c.status)}
              </Text>
            </View>

            {isConnectorActive(c.status) && (
              <Text spec={text(t, { role: 'caption', tone: 'muted' })}>
                {C.lastSync}: {fmtDataHora(c.lastSyncAt)}
              </Text>
            )}
            {c.lastError && (
              <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.error.text }}>{c.lastError}</Text>
            )}

            <View style={{ gap: 8 }}>
              {isConnectorActive(c.status) ? (
                <>
                  <Button
                    label="Sincronizar agora"
                    variant="secondary"
                    onPress={() => sincronizar(c)}
                    loading={busy === c.source}
                    loadingLabel="Sincronizando…"
                  />
                  <Pressable onPress={() => desconectar(c)} disabled={busy === c.source} hitSlop={8}>
                    <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.error.text }}>
                      {C.disconnect}
                    </Text>
                  </Pressable>
                </>
              ) : (
                <Button label={connectorPrimaryAction(c.status)} onPress={() => conectar(c)} />
              )}
            </View>
          </View>
        ))
      )}

      <Disclaimer variant="geral" />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12 },
})
