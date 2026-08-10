// Lista de Exames (Inc.5) — COMPOSIÇÃO de primitivos DS + `useExamsList` (sem rede/domínio aqui; tudo via
// apiClient). FRONTEIRA REG-001: exibe LISTA (título/data/emissor/status) e leva ao documento — NUNCA
// resultado interpretado/diagnóstico/risco. Paridade com a tela de Exames da Web: separa RESULTADOS × PEDIDOS
// (isOrderDocumentType), oferece busca/status/ano, e sinaliza DUPLICADOS (findDuplicateIds, req_deteccao_duplicados).
import { useMemo, useState, useEffect } from 'react'
import { ScrollView, View, Pressable, ActivityIndicator, RefreshControl, Alert, StyleSheet } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { ExamDTO } from '@sintera/api-client'
import { isOrderDocumentType, findDuplicateIds, originalIdFor, categoryOf, compareNames, effectiveOrderStatus, orderStatusLabel, type DuplicateCandidate } from '@sintera/core'
import { heading, text } from '@sintera/design-system'
import { Button, Text, Input, Disclaimer, DatePicker, AttachmentLink } from '../../primitives'
import { useTheme } from '../../theme'
import { apiClient } from '../../../infrastructure/apiClient'
import type { MinhaSaudeStackParamList } from '../../navigation/types'
import { useExamsList } from './useExamsList'
import { examStatusLabel, isExamFailed } from './examStatus'
import { formatExamDate } from './examFormat'

type Props = NativeStackScreenProps<MinhaSaudeStackParamList, 'ExamsList'>

const STATUS_FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'Todos os status' }, { id: 'processed', label: 'Dados extraídos' },
  { id: 'pending', label: 'Aguardando' }, { id: 'error', label: 'Com erro' },
]
function statusBucket(s: string | null): string {
  if (s === 'processed') return 'processed'
  if (s === 'error' || s === 'failed') return 'error'
  return 'pending'
}
function groupByYear(exams: readonly ExamDTO[]): { year: string; items: ExamDTO[] }[] {
  const map = new Map<string, ExamDTO[]>()
  for (const e of exams) {
    const year = (e.exam_date ?? e.created_at ?? '').slice(0, 4) || 'Sem data'
    const bucket = map.get(year); if (bucket) bucket.push(e); else map.set(year, [e])
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] === 'Sem data' ? 1 : b[0] === 'Sem data' ? -1 : b[0].localeCompare(a[0])))
    .map(([year, items]) => ({ year, items }))
}

export function ExamsListScreen({ navigation }: Props) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const p = useExamsList()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [year, setYear] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const all = p.exams ?? []
  const results = useMemo(() => all.filter(e => !isOrderDocumentType(e.document_type)), [all])
  const orders = useMemo(() => all.filter(e => isOrderDocumentType(e.document_type)), [all])
  const candidates = useMemo(() => results.map((e): DuplicateCandidate => ({
    id: e.id, createdAt: e.created_at ?? '', examDate: e.exam_date, issuer: e.issuer, title: e.display_title ?? e.type,
  })), [results])
  const dupIds = useMemo(() => findDuplicateIds(candidates), [candidates])
  // Duplicado → id do exame ORIGINAL (para o link "Ver original", paridade Web).
  const originalOf = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of candidates) { if (dupIds.has(c.id)) { const o = originalIdFor(c, candidates); if (o) m.set(c.id, o) } }
    return m
  }, [candidates, dupIds])
  const years = useMemo(() => [...new Set(results.map(e => (e.exam_date ?? e.created_at ?? '').slice(0, 4)).filter(Boolean))].sort((a, b) => b.localeCompare(a)), [results])
  const q = query.trim().toLowerCase()
  const filteredResults = useMemo(() => results.filter(e => {
    if (q && !`${e.display_title ?? ''} ${e.type ?? ''} ${e.issuer ?? ''}`.toLowerCase().includes(q)) return false
    if (status !== 'all' && statusBucket(e.status) !== status) return false
    if (year !== 'all' && (e.exam_date ?? e.created_at ?? '').slice(0, 4) !== year) return false
    if (from && e.exam_date && e.exam_date < from) return false
    if (to && e.exam_date && e.exam_date > to) return false
    return true
  }), [results, q, status, year, from, to])

  // Nome do perfil (para o aviso de nome divergente — paridade Web). Falha silenciosa (aviso é auxiliar).
  const [profileName, setProfileName] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    apiClient.profile.getProfile().then(pr => { if (alive) setProfileName(pr?.name ?? null) }).catch(() => {})
    return () => { alive = false }
  }, [])
  // Exames cujo nome de paciente diverge do perfil (compareNames — regra única do core).
  const mismatchIds = useMemo(
    () => new Set(results.filter(e => compareNames(profileName, e.patient_name) === 'mismatch').map(e => e.id)),
    [results, profileName],
  )
  // Quantos RESULTADOS estão vinculados a cada PEDIDO (fulfills_order_id) — paridade Web.
  const linkedCountByOrder = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of results) { const oid = r.fulfills_order_id; if (oid) m.set(oid, (m.get(oid) ?? 0) + 1) }
    return m
  }, [results])

  // Ações do Pedido (mesmo comportamento da Web; gravação via apiClient + refresh confiável).
  const [busyId, setBusyId] = useState<string | null>(null)
  async function setOrderStatus(id: string, next: 'pendente' | 'realizado') {
    setBusyId(id)
    try { await apiClient.exams.updateExam(id, { order_status: next }); await p.refresh() } finally { setBusyId(null) }
  }
  function confirmDeleteOrder(id: string, label: string) {
    Alert.alert('Excluir pedido', `Excluir "${label}"? Esta ação não pode ser desfeita.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => { setBusyId(id); try { await apiClient.exams.deleteExam(id); await p.refresh() } finally { setBusyId(null) } } },
    ])
  }
  function agendarFromOrder(order: ExamDTO) {
    // Lembrete de um exame FUTURO (opcional) — não dá baixa no pedido. Navega à aba Agenda → EventForm (prefill).
    (navigation as unknown as { navigate: (n: string, p?: unknown) => void })
      .navigate('Agenda', { screen: 'EventForm', params: { prefill: { type: 'exame', title: order.type ?? order.display_title ?? 'Exame' } } })
  }

  if (p.phase === 'idle' || p.phase === 'loading') {
    return (
      <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}>
        <ActivityIndicator color={t.color.identity.primary} />
        <Text spec={text(t, { role: 'body', tone: 'muted' })}>Carregando seus exames…</Text>
      </View>
    )
  }
  if (p.phase === 'error') {
    return (
      <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}>
        <Text spec={text(t, { role: 'body' })} style={{ color: t.color.badge.error.text, textAlign: 'center' }}>{p.error ?? 'Não foi possível carregar seus exames.'}</Text>
        <Button label="Tentar novamente" variant="secondary" onPress={p.retry} />
      </View>
    )
  }

  const groups = groupByYear(filteredResults)
  const card = { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }

  return (
    <ScrollView
      style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[styles.content, { paddingTop: styles.content.padding + insets.top, paddingBottom: styles.content.padding + insets.bottom }]}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={p.refreshing} onRefresh={p.refresh} tintColor={t.color.identity.primary} />}
    >
      <Text spec={heading(t, { level: 'page' })}>Exames</Text>
      <Text spec={text(t, { role: 'bodySmall', tone: 'muted' })}>Seus exames ao longo do tempo. Abra um para ver o documento original.</Text>

      <Button label="Adicionar exame" onPress={() => navigation.navigate('ExamUpload')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        <Pressable onPress={() => navigation.navigate('HistoricoExames')}>
          <Text spec={text(t, { role: 'bodySmall' })} style={{ color: t.color.identity.primary }}>Histórico de Exames →</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('OmicsList')}>
          <Text spec={text(t, { role: 'bodySmall' })} style={{ color: t.color.identity.primary }}>Exames de ômica →</Text>
        </Pressable>
      </View>

      {all.length === 0 ? (
        <View style={styles.empty}><Text spec={text(t, { role: 'body', tone: 'muted' })}>Nenhum exame ainda.</Text></View>
      ) : null}

      {/* Aviso de nome divergente do perfil (paridade Web) — factual, não bloqueia. */}
      {mismatchIds.size > 0 ? (
        <View style={[styles.card, { backgroundColor: t.color.badge.attention.soft, borderColor: t.color.badge.attention.soft }]}>
          <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.attention.text }}>
            {mismatchIds.size === 1 ? 'Um exame tem' : `${mismatchIds.size} exames têm`} um nome diferente do seu perfil{profileName ? ` (${profileName})` : ''}. Confira se {mismatchIds.size === 1 ? 'é seu' : 'são seus'}.
          </Text>
        </View>
      ) : null}

      {/* Filtros de descoberta */}
      {results.length > 0 ? (
        <View style={{ gap: 8 }}>
          <Input value={query} onChangeText={setQuery} placeholder="Buscar por nome, tipo ou laboratório…" autoCapitalize="none" />
          <Chips options={STATUS_FILTERS} value={status} onChange={setStatus} />
          {years.length > 1 ? <Chips options={[{ id: 'all', label: 'Todos os anos' }, ...years.map(y => ({ id: y, label: y }))]} value={year} onChange={setYear} /> : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Período:</Text>
            <DatePicker value={from} onChange={setFrom} placeholder="De" max={to || undefined} style={{ flex: 1 }} />
            <DatePicker value={to} onChange={setTo} placeholder="Até" min={from || undefined} style={{ flex: 1 }} />
          </View>
        </View>
      ) : null}

      {/* RESULTADOS */}
      {groups.map((g) => (
        <View key={g.year} style={{ gap: 8 }}>
          <Text spec={text(t, { role: 'label', tone: 'muted' })}>{g.year}</Text>
          {g.items.map((e) => {
            const dup = dupIds.has(e.id)
            return (
              <Pressable key={e.id} onPress={() => navigation.navigate('ExamDetail', { id: e.id })} accessibilityRole="button" style={[styles.card, card]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <Text spec={text(t, { role: 'bodyStrong' })} style={{ flex: 1 }}>{e.display_title ?? e.type ?? 'Exame'}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' }}>
                    <View style={[styles.pill, { borderWidth: 1, borderColor: t.color.border.default }]}><Text spec={text(t, { role: 'caption', tone: 'muted' })}>{categoryOf(e.document_type).label}</Text></View>
                    {mismatchIds.has(e.id) ? <View style={[styles.pill, { backgroundColor: t.color.badge.attention.soft }]}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.attention.text }}>Nome diferente</Text></View> : null}
                    {dup ? <View style={[styles.pill, { backgroundColor: t.color.badge.attention.soft }]}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.attention.text }}>Possível duplicado</Text></View> : null}
                  </View>
                </View>
                <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{formatExamDate(e.exam_date)}{e.issuer ? ` · ${e.issuer}` : ''}{e.requesting_physician ? ` · Solic.: ${e.requesting_physician}` : ''}</Text>
                {e.status === 'processed'
                  ? <Text spec={text(t, { role: 'caption', tone: 'faint' })}>{e.extraction_completeness === 'document_only' ? 'Documento disponível' : 'Resultados estruturados'}</Text>
                  : examStatusLabel(e.status) ? <Text spec={text(t, { role: 'caption', tone: 'faint' })} style={isExamFailed(e.status) ? { color: t.color.badge.error.text } : undefined}>{examStatusLabel(e.status)}</Text> : null}
                {dup && originalOf.get(e.id)
                  ? <Pressable onPress={() => navigation.navigate('ExamDetail', { id: originalOf.get(e.id)! })}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>Ver original →</Text></Pressable>
                  : null}
              </Pressable>
            )
          })}
        </View>
      ))}
      {results.length > 0 && filteredResults.length === 0 ? (
        <Text spec={text(t, { role: 'caption', tone: 'muted' })} style={{ textAlign: 'center' }}>Nenhum resultado para os filtros atuais.</Text>
      ) : null}

      {/* PEDIDOS E SOLICITAÇÕES (guias/pedidos médicos — objeto distinto do exame realizado). Q1: o pedido é a
          ORIGEM, não é substituído pelo exame. Mesmo ciclo/ações da Web. */}
      {orders.length > 0 ? (
        <View style={{ gap: 8 }}>
          <Text spec={text(t, { role: 'label', tone: 'muted' })}>PEDIDOS E SOLICITAÇÕES</Text>
          <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Pedidos médicos e guias de convênio — documentos de solicitação, guardados à parte dos resultados.</Text>
          {orders.map((e) => {
            const linked = linkedCountByOrder.get(e.id) ?? 0
            const st = effectiveOrderStatus(e.order_status, linked)
            const busy = busyId === e.id
            return (
              <View key={e.id} style={[styles.card, card]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <Pressable onPress={() => navigation.navigate('ExamDetail', { id: e.id })} style={{ flex: 1 }}>
                    <Text spec={text(t, { role: 'bodyStrong' })}>{e.type ?? e.display_title ?? 'Pedido médico'}</Text>
                  </Pressable>
                  <View style={[styles.pill, { borderWidth: 1, borderColor: t.color.border.default }]}><Text spec={text(t, { role: 'caption', tone: 'muted' })}>{orderStatusLabel(st)}</Text></View>
                </View>
                <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Adicionado em {formatExamDate(e.created_at)}{e.requesting_physician ? ` · ${e.requesting_physician}` : ''}</Text>
                {linked > 0 ? <Text spec={text(t, { role: 'caption', tone: 'faint' })}>{linked} resultado{linked !== 1 ? 's' : ''} vinculado{linked !== 1 ? 's' : ''} — origem preservada.</Text> : null}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginTop: 4 }}>
                  {st === 'pendente' ? (
                    <Pressable onPress={() => setOrderStatus(e.id, 'realizado')} disabled={busy}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.success.text }}>{busy ? 'Salvando…' : 'Marcar como realizado'}</Text></Pressable>
                  ) : st === 'realizado' ? (
                    <Pressable onPress={() => setOrderStatus(e.id, 'pendente')} disabled={busy}><Text spec={text(t, { role: 'caption', tone: 'muted' })}>{busy ? 'Salvando…' : 'Desfazer'}</Text></Pressable>
                  ) : null}
                  <Pressable onPress={() => agendarFromOrder(e)}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>Agendar</Text></Pressable>
                  <AttachmentLink url={e.file_url} label="Ver documento" variant="inline" />
                  <Pressable onPress={() => confirmDeleteOrder(e.id, e.type ?? e.display_title ?? 'Pedido')} disabled={busy}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.error.text }}>Excluir</Text></Pressable>
                </View>
              </View>
            )
          })}
        </View>
      ) : null}

      <Disclaimer variant="laudo" />
    </ScrollView>
  )
}

function Chips({ options, value, onChange }: { options: readonly { id: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  const t = useTheme()
  return (
    <View style={styles.chips}>
      {options.map(o => {
        const on = value === o.id
        return <Pressable key={o.id} onPress={() => onChange(o.id)} style={[styles.pill, { borderWidth: 1, borderColor: on ? t.color.identity.primary : t.color.border.default, backgroundColor: on ? t.color.badge.info.soft : 'transparent' }]}><Text spec={text(t, { role: 'caption', tone: on ? 'default' : 'muted' })}>{o.label}</Text></Pressable>
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  empty: { paddingVertical: 24, alignItems: 'center' },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, gap: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
})
