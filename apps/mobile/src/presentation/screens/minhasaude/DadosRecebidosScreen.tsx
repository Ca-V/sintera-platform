// DADOS RECEBIDOS — o que entrou sozinho, de onde veio, e o que parece repetido.
//
// POR QUE ESTA TELA EXISTE (decisão da fundadora, 28/08). Ela autoriza a fonte UMA VEZ e o dado passa a entrar
// sem perguntar. Sem um lugar para ver o que entrou, "entra sozinho" viraria "entra sem que eu saiba" — e numa
// plataforma de saúde isso é inaceitável: o dado vai para um relatório levado ao médico.
//
// O TOM É DE INFORMAÇÃO, NÃO DE TAREFA. Nada aqui exige resposta. Quem nunca abrir esta tela não perde nada e
// não terá nada duplicado nem descartado em silêncio. Uma fila de pendências transformaria o registro de saúde
// numa caixa de entrada — o oposto do que a plataforma faz pela pessoa.
//
// O QUE ELA NÃO FAZ: decidir. A suspeita de duplicata é EXPLICADA e as três saídas ficam disponíveis; apagar
// sozinho exigiria uma certeza que não existe, e o custo de errar é perder um fato real.
import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, View, ActivityIndicator, RefreshControl, Pressable, Alert, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { heading, text } from '@sintera/design-system'
import type { ActivitySessionDTO, BodyMetricDTO } from '@sintera/api-client'
import {
  SCREEN_COPY, activityTypeLabel, activitySummary, bodyMetricLabel, bodySourceLabel, formatInstantBR, formatDateBR,
  suspectedDuplicateActivities, DUPLICATE_CHOICES,
  suspectedDuplicateObservations, observationForMatch,
  type ActivityForMatch, type ObservationForMatch, type DuplicateSuspicion, type DuplicateChoice,
} from '@sintera/core'
import { Text, Button, Disclaimer } from '../../primitives'
import { useTheme } from '../../theme'
import { apiClient } from '../../../infrastructure/apiClient'

const C = SCREEN_COPY.dadosRecebidos

/** Só o que veio de FORA. O que a pessoa digitou ela já sabe que existe — não é "recebido". */
const ehDeFora = (source: string | null | undefined): boolean => {
  const s = (source ?? '').trim()
  return s !== '' && s !== 'manual'
}

function paraComparacao(a: ActivitySessionDTO): ActivityForMatch {
  return {
    id: a.id,
    source: a.source ?? 'desconhecida',
    activityType: a.activity_type,
    startedAt: a.started_at,
    durationS: a.duration_s,
    distanceM: a.distance_m,
  }
}

export function DadosRecebidosScreen() {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const [acts, setActs] = useState<ActivitySessionDTO[]>([])
  const [metrics, setMetrics] = useState<BodyMetricDTO[]>([])
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshing, setRefreshing] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const alive = useRef(true)

  const load = useCallback((silent: boolean) => {
    if (silent) setRefreshing(true); else setPhase('loading')
    Promise.all([
      apiClient.activity.listActivitySessions().catch(() => [] as ActivitySessionDTO[]),
      apiClient.body.listBodyMetrics().catch(() => [] as BodyMetricDTO[]),
    ])
      .then(([a, m]) => {
        if (!alive.current) return
        setActs(a.filter(x => ehDeFora(x.source)))
        setMetrics(m.filter(x => ehDeFora(x.source)))
        setPhase('ready')
      })
      .finally(() => { if (alive.current) setRefreshing(false) })
  }, [])
  useEffect(() => { alive.current = true; load(false); return () => { alive.current = false } }, [load])

  // A regra de "é o mesmo fato?" vive no core, testada. Aqui só se compara a lista consigo mesma: cada
  // atividade contra as demais, para achar o par que veio por dois caminhos.
  const suspeitas: DuplicateSuspicion<ActivityForMatch>[] = []
  const jaVistos = new Set<string>()
  for (const a of acts) {
    if (jaVistos.has(a.id)) continue
    const outros = acts.filter(o => o.id !== a.id && !jaVistos.has(o.id)).map(paraComparacao)
    const [s] = suspectedDuplicateActivities([paraComparacao(a)], outros)
    if (s) { suspeitas.push(s); jaVistos.add(s.incoming.id); jaVistos.add(s.existing.id) }
  }

  // MEDIÇÕES TAMBÉM SE REPETEM, e por um caminho ainda mais comum que o das atividades: um relógio e um
  // aplicativo escrevendo o mesmo peso no Health Connect. O detector existia desde 28/08 e não tinha um único
  // consumidor — mesmo padrão de "especificado e nunca ligado".
  const suspeitasMedicao: DuplicateSuspicion<ObservationForMatch>[] = []
  const vistosMedicao = new Set<string>()
  for (const m of metrics) {
    if (vistosMedicao.has(m.id)) continue
    const outros = metrics.filter(o => o.id !== m.id && !vistosMedicao.has(o.id)).map(observationForMatch)
    const [s] = suspectedDuplicateObservations([observationForMatch(m)], outros)
    if (s) { suspeitasMedicao.push(s); vistosMedicao.add(s.incoming.id); vistosMedicao.add(s.existing.id) }
  }

  async function resolverMedicao(sus: DuplicateSuspicion<ObservationForMatch>, escolha: DuplicateChoice) {
    if (escolha === 'manter-ambos') {
      Alert.alert('Mantidas', 'As duas continuam registradas.')
      return
    }
    const alvo = escolha === 'descartar-novo' ? sus.incoming.id : sus.existing.id
    setBusy(alvo)
    try {
      const { error } = await apiClient.body.deleteBodyMetric(alvo)
      if (error) { Alert.alert('Não foi possível remover', error.message || 'Tente de novo.'); return }
      load(true)
    } finally { setBusy(null) }
  }

  async function resolver(s: DuplicateSuspicion<ActivityForMatch>, escolha: DuplicateChoice) {
    if (escolha === 'manter-ambos') {
      // Nada a fazer no banco. A semelhança continua visível — é informação, não pendência.
      Alert.alert('Mantidas', 'As duas continuam registradas.')
      return
    }
    const alvo = escolha === 'descartar-novo' ? s.incoming.id : s.existing.id
    setBusy(alvo)
    try {
      const { error } = await apiClient.activity.deleteActivitySession(alvo)
      if (error) { Alert.alert('Não foi possível remover', error.message || 'Tente de novo.'); return }
      load(true)
    } finally { setBusy(null) }
  }

  async function removerMedicao(m: BodyMetricDTO) {
    Alert.alert('Remover medição', `Remover ${bodyMetricLabel(m.metric)} recebida de ${bodySourceLabel(m.source) ?? 'origem desconhecida'}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: C.removeAction, style: 'destructive',
        onPress: async () => {
          setBusy(m.id)
          try {
            const { error } = await apiClient.body.deleteBodyMetric(m.id)
            if (error) Alert.alert('Não foi possível remover', error.message || 'Tente de novo.')
            else load(true)
          } finally { setBusy(null) }
        },
      },
    ])
  }

  if (phase === 'loading') {
    return <View style={s.center}><ActivityIndicator color={t.color.identity.primary} /></View>
  }

  const vazio = acts.length === 0 && metrics.length === 0
  const card = { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }

  return (
    <ScrollView
      style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[s.content, { paddingTop: s.content.padding + insets.top }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={t.color.identity.primary} />}
    >
      <Text spec={heading(t, { level: 'page' })}>{C.title}</Text>
      <Text spec={text(t, { role: 'bodySmall', tone: 'muted' })}>{C.subtitle}</Text>

      {vazio ? (
        <View style={[s.card, card, { gap: 6, marginTop: 8 }]}>
          <Text spec={text(t, { role: 'bodyStrong' })}>{C.emptyTitle}</Text>
          <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{C.emptyMessage}</Text>
        </View>
      ) : null}

      {/* POSSÍVEIS REPETIÇÕES primeiro — é a única coisa aqui sobre a qual vale a pena decidir. */}
      {suspeitas.length > 0 && (
        <View style={{ gap: 10, marginTop: 8 }}>
          <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 17 }}>{C.duplicateTitle}</Text>
          <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{C.duplicateHint}</Text>

          {suspeitas.map(sus => (
            <View key={sus.incoming.id} style={[s.card, card, { gap: 10, borderColor: t.color.badge.attention.text }]}>
              <Text spec={text(t, { role: 'body' })}>
                {activityTypeLabel(sus.incoming.activityType ?? 'outro')} — {sus.incoming.source}
              </Text>
              <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{sus.reason}</Text>

              <View style={{ gap: 8 }}>
                {DUPLICATE_CHOICES.map(op => (
                  <Pressable
                    key={op.id}
                    onPress={() => resolver(sus, op.id)}
                    disabled={busy === sus.incoming.id || busy === sus.existing.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${op.label}. ${op.hint}`}
                    style={[s.escolha, { borderColor: t.color.border.default }]}
                  >
                    <Text spec={text(t, { role: 'body' })}>{op.label}</Text>
                    <Text spec={text(t, { role: 'caption', tone: 'faint' })}>{op.hint}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {suspeitasMedicao.length > 0 && (
        <View style={{ gap: 10, marginTop: 8 }}>
          <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 17 }}>{C.duplicateTitle}</Text>
          <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{C.duplicateHint}</Text>

          {suspeitasMedicao.map(sus => (
            <View key={sus.incoming.id} style={[s.card, card, { gap: 10, borderColor: t.color.badge.attention.text }]}>
              <Text spec={text(t, { role: 'body' })}>
                {bodyMetricLabel(sus.incoming.metric)} — {sus.incoming.source}
              </Text>
              <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{sus.reason}</Text>

              <View style={{ gap: 8 }}>
                {DUPLICATE_CHOICES.map(op => (
                  <Pressable
                    key={op.id}
                    onPress={() => resolverMedicao(sus, op.id)}
                    disabled={busy === sus.incoming.id || busy === sus.existing.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${op.label}. ${op.hint}`}
                    style={[s.escolha, { borderColor: t.color.border.default }]}
                  >
                    <Text spec={text(t, { role: 'body' })}>{op.label}</Text>
                    <Text spec={text(t, { role: 'caption', tone: 'faint' })}>{op.hint}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {acts.length > 0 && (
        <View style={{ gap: 8, marginTop: 8 }}>
          <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 17 }}>Atividades recebidas</Text>
          {acts.map(a => (
            <View key={a.id} style={[s.card, card, { gap: 2 }]}>
              <Text spec={text(t, { role: 'body' })}>{a.title?.trim() || activityTypeLabel(a.activity_type)}</Text>
              {/* QUANDO ACONTECEU VEM PRIMEIRO. Sem a data, uma atividade de três semanas atrás e uma de hoje
                  são o mesmo cartão — e a fundadora viu doze delas, todas idênticas, sem saber de que dias
                  eram. Num registro de saúde, o quando não é detalhe: é metade do fato. */}
              <Text spec={text(t, { role: 'caption', tone: 'muted' })}>
                {[formatInstantBR(a.started_at), activitySummary(a)].filter(Boolean).join(' · ')}
              </Text>
              <Text spec={text(t, { role: 'caption', tone: 'faint' })}>
                {`${C.sourceLabel}: ${a.source}`}
              </Text>
            </View>
          ))}
        </View>
      )}

      {metrics.length > 0 && (
        <View style={{ gap: 8, marginTop: 8 }}>
          <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 17 }}>Medições recebidas</Text>
          {metrics.map(m => (
            <View key={m.id} style={[s.card, card, { gap: 2 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text spec={text(t, { role: 'body' })} style={{ flex: 1 }}>
                  {bodyMetricLabel(m.metric)}: {m.value_text}{m.unit ? ` ${m.unit}` : ''}
                </Text>
                <Pressable onPress={() => removerMedicao(m)} disabled={busy === m.id} hitSlop={8}>
                  <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.error.text }}>{C.removeAction}</Text>
                </Pressable>
              </View>
              <Text spec={text(t, { role: 'caption', tone: 'muted' })}>
                {/* `measured_at` é o instante; `measured_on` é o dia. Duas leituras de pressão do mesmo dia só
                    se distinguem pelo primeiro — mas nem toda medição tem hora, e aí o dia é o que há. */}
                {[
                  m.measured_at ? formatInstantBR(m.measured_at) : formatDateBR(m.measured_on),
                  `${C.sourceLabel}: ${bodySourceLabel(m.source) ?? m.source}`,
                ].filter(Boolean).join(' · ')}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Disclaimer variant="geral" />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  content: { padding: 20, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  escolha: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 2 },
})
