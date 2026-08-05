// Histórico de Exames (paridade Web /dashboard/saude) — visão LONGITUDINAL em DUAS trilhas: (1) LABORATORIAIS —
// biomarcadores por exame, cada um com valor recente + tendência + evolução (sparkline) + ocorrências que abrem o
// laudo; (2) DOCUMENTAIS — exames SEM biomarcadores numéricos (imagem, densitometria, laudos), histórico por TIPO
// com datas que abrem cada exame. Filtros de descoberta: busca · tipo · período · ordenação. Sumarização do
// @sintera/core (summarizeBiomarkers). FACTUAL (RDC 657/2022): organiza a evolução dos valores impressos.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ScrollView, View, ActivityIndicator, RefreshControl, Pressable, StyleSheet } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { text } from '@sintera/design-system'
import { summarizeBiomarkers, isOrderDocumentType, type BiomarkerSummary, type Trend } from '@sintera/core'
import type { ExamDTO } from '@sintera/api-client'
import { Text, Button, Input } from '../../primitives'
import { useTheme } from '../../theme'
import { apiClient } from '../../../infrastructure/apiClient'

function fmtDate(iso: string): string { if (!iso) return '—'; const [y, m, d] = iso.slice(0, 10).split('-'); return `${d}/${m}/${y}` }
function trendText(tr: Trend, delta: number | null): { s: string; kind: 'up' | 'down' | 'flat' } {
  if (tr === 'up') return { s: delta !== null ? `▲ +${delta}%` : '▲', kind: 'up' }
  if (tr === 'down') return { s: delta !== null ? `▼ ${delta}%` : '▼', kind: 'down' }
  if (tr === 'stable') return { s: delta !== null ? `— ${delta > 0 ? '+' : ''}${delta}%` : '—', kind: 'flat' }
  if (tr === 'single') return { s: '1ª medição', kind: 'flat' }
  return { s: 'unidades ≠', kind: 'flat' }
}
/** Posição do valor na faixa de referência do laudo (▲ acima · ▼ abaixo · ✓ dentro). */
function refMark(s: BiomarkerSummary): { s: string; kind: 'up' | 'down' | 'flat' } | null {
  const m = s.latest
  if (!m || m.value == null) return null
  if (m.referenceMin != null && m.value < m.referenceMin) return { s: '▼ abaixo', kind: 'down' }
  if (m.referenceMax != null && m.value > m.referenceMax) return { s: '▲ acima', kind: 'up' }
  if (m.referenceMin != null || m.referenceMax != null) return { s: '✓ dentro', kind: 'flat' }
  return null
}

const PERIODS: { key: string; label: string; days: number | null }[] = [
  { key: 'all', label: 'Tudo', days: null }, { key: '30d', label: '30 dias', days: 30 },
  { key: '90d', label: '90 dias', days: 90 }, { key: '1a', label: '1 ano', days: 365 },
]

export function HistoricoExamesScreen() {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const openExam = (id: string) => (navigation.getParent() as { navigate: (n: string, p: unknown) => void } | undefined)?.navigate('Documentos', { screen: 'ExamDetail', params: { id } })
  const [summaries, setSummaries] = useState<BiomarkerSummary[]>([])
  const [exams, setExams] = useState<ExamDTO[]>([])
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [period, setPeriod] = useState('all')
  const [sortDir, setSortDir] = useState<'recent' | 'old'>('recent')
  const [expanded, setExpanded] = useState<string | null>(null)
  const alive = useRef(true)

  const load = useCallback((silent: boolean) => {
    if (silent) setRefreshing(true); else setPhase('loading')
    Promise.all([apiClient.exams.getAllBiomarkers(), apiClient.exams.listExams()])
      .then(([rows, exs]) => { if (!alive.current) return; setSummaries(summarizeBiomarkers(rows)); setExams(exs); setPhase('ready'); setError(null) })
      .catch((e) => { if (alive.current && !silent) { setError(e instanceof Error ? e.message : 'Não foi possível carregar.'); setPhase('error') } })
      .finally(() => { if (alive.current) setRefreshing(false) })
  }, [])
  useEffect(() => { alive.current = true; load(false); return () => { alive.current = false } }, [load])
  useFocusEffect(useCallback(() => { load(true) }, [load])) // eslint-disable-line react-hooks/exhaustive-deps

  const q = query.trim().toLowerCase()
  const cutoff = useMemo(() => { const p = PERIODS.find(x => x.key === period)?.days; if (!p) return null; const d = new Date(); d.setDate(d.getDate() - p); return d.toISOString().slice(0, 10) }, [period])
  const cmp = (a: string, b: string) => sortDir === 'recent' ? (a < b ? 1 : a > b ? -1 : 0) : (a < b ? -1 : a > b ? 1 : 0)

  // Trilha LABORATORIAL — biomarcadores agrupados por exame de origem.
  const labGroups = useMemo(() => {
    const filtered = q ? summaries.filter(s => s.displayName.toLowerCase().includes(q) || (s.sourceExamName ?? '').toLowerCase().includes(q)) : summaries
    const map = new Map<string, BiomarkerSummary[]>()
    for (const s of filtered) { const k = s.sourceExamName?.trim() || 'Exames'; const arr = map.get(k) ?? []; arr.push(s); map.set(k, arr) }
    let list = [...map.entries()].map(([name, items]) => {
      const occ = new Map<string, string>()
      for (const s of items) for (const m of s.measurements) if (m.examId && m.date) occ.set(`${m.examId}|${m.date}`, m.date)
      const occs = [...occ.entries()].map(([k, date]) => ({ examId: k.split('|')[0], date })).sort((a, b) => (a.date < b.date ? 1 : -1))
      return { name, items, occs, latestDate: occs[0]?.date ?? '' }
    })
    if (typeFilter !== 'all') list = list.filter(g => g.name === typeFilter)
    if (cutoff) list = list.filter(g => g.occs.some(o => o.date >= cutoff))
    return list.sort((a, b) => cmp(a.latestDate, b.latestDate))
  }, [summaries, q, typeFilter, cutoff, sortDir])

  // Trilha DOCUMENTAL — exames SEM biomarcadores (e que não são pedidos), agrupados por TIPO.
  const biomarkerExamIds = useMemo(() => { const s = new Set<string>(); for (const su of summaries) for (const m of su.measurements) if (m.examId) s.add(m.examId); return s }, [summaries])
  const docGroups = useMemo(() => {
    const docs = exams.filter(e => !biomarkerExamIds.has(e.id) && !isOrderDocumentType(e.document_type))
    const map = new Map<string, { type: string; occs: { examId: string; date: string }[] }>()
    for (const e of docs) {
      const type = e.display_title || e.type || 'Exame'
      const date = (e.exam_date ?? e.created_at ?? '').slice(0, 10)
      if (!map.has(type)) map.set(type, { type, occs: [] })
      map.get(type)!.occs.push({ examId: e.id, date })
    }
    let list = [...map.values()].map(g => { g.occs.sort((a, b) => (a.date < b.date ? 1 : -1)); return g })
    if (q) list = list.filter(g => g.type.toLowerCase().includes(q))
    if (typeFilter !== 'all') list = list.filter(g => g.type === typeFilter)
    if (cutoff) list = list.filter(g => g.occs.some(o => o.date >= cutoff))
    return list.sort((a, b) => cmp(a.occs[0]?.date ?? '', b.occs[0]?.date ?? ''))
  }, [exams, biomarkerExamIds, q, typeFilter, cutoff, sortDir])

  const availableTypes = useMemo(() => {
    const s = new Set<string>()
    labGroups.forEach(g => s.add(g.name)); docGroups.forEach(g => s.add(g.type))
    return [...s].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [labGroups, docGroups])

  const trendColor = (kind: 'up' | 'down' | 'flat') => kind === 'up' ? t.color.badge.attention.text : kind === 'down' ? t.color.badge.info.text : t.color.text.muted

  if (phase === 'loading') {
    return <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}><ActivityIndicator color={t.color.identity.primary} /><Text spec={text(t, { role: 'body', tone: 'muted' })}>Carregando…</Text></View>
  }
  if (phase === 'error') {
    return <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}><Text spec={text(t, { role: 'body' })} style={{ color: t.color.badge.error.text, textAlign: 'center' }}>{error}</Text><Button label="Tentar novamente" variant="secondary" onPress={() => load(false)} /></View>
  }

  const card = { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }
  const empty = summaries.length === 0 && docGroups.length === 0

  return (
    <ScrollView style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[styles.content, { paddingTop: styles.content.padding + insets.top, paddingBottom: styles.content.padding + insets.bottom }]}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={t.color.identity.primary} />}>
      <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 22 }}>Histórico de Exames</Text>
      <Input value={query} onChangeText={setQuery} placeholder="Buscar por biomarcador ou exame…" autoCapitalize="none" />

      {/* Filtros de descoberta */}
      {availableTypes.length > 0 ? (
        <View style={{ gap: 8 }}>
          <Chips options={[{ id: 'all', label: 'Todos os tipos' }, ...availableTypes.map(ty => ({ id: ty, label: ty }))]} value={typeFilter} onChange={setTypeFilter} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Chips options={PERIODS.map(p => ({ id: p.key, label: p.label }))} value={period} onChange={setPeriod} />
            <Pressable onPress={() => setSortDir(d => d === 'recent' ? 'old' : 'recent')}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>{sortDir === 'recent' ? 'Recentes ↓' : 'Antigos ↑'}</Text></Pressable>
          </View>
        </View>
      ) : null}

      {empty ? (
        <View style={[styles.card, card]}><Text spec={text(t, { role: 'body', tone: 'muted' })} style={{ textAlign: 'center' }}>Nenhum exame ainda. Envie exames para acompanhar a evolução.</Text></View>
      ) : null}

      {/* LABORATORIAIS */}
      {labGroups.map(g => (
        <View key={`lab:${g.name}`} style={{ gap: 8 }}>
          <Text spec={text(t, { role: 'label', tone: 'muted' })}>{g.name.toUpperCase()}</Text>
          {g.items.map(s => {
            const tr = trendText(s.trend, s.deltaPercent); const rm = refMark(s)
            const open = expanded === s.canonicalName
            const vals = s.measurements.map(m => m.value); const min = Math.min(...vals), max = Math.max(...vals)
            return (
              <Pressable key={s.canonicalName} onPress={() => setExpanded(open ? null : s.canonicalName)} style={[styles.card, card, { gap: 6 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text spec={text(t, { role: 'body' })} style={{ flex: 1, paddingRight: 8 }}>{s.displayName}</Text>
                  <Text spec={text(t, { role: 'bodyStrong' })}>{s.latest ? `${s.latest.value}${s.unit ? ` ${s.unit}` : ''}` : '—'}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{s.count} {s.count === 1 ? 'medição' : 'medições'}{s.latest ? ` · última em ${fmtDate(s.latest.date)}` : ''}</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {rm ? <Text spec={text(t, { role: 'caption' })} style={{ color: trendColor(rm.kind) }}>{rm.s}</Text> : null}
                    <Text spec={text(t, { role: 'caption' })} style={{ color: trendColor(tr.kind) }}>{tr.s}</Text>
                  </View>
                </View>
                {open ? (
                  <View style={{ gap: 6, marginTop: 4 }}>
                    {s.measurements.length > 1 && max > min ? (
                      <View style={styles.spark}>
                        {s.measurements.map((m, i) => <View key={i} style={{ flex: 1, height: 40, justifyContent: 'flex-end' }}><View style={{ height: Math.max(3, ((m.value - min) / (max - min)) * 40), backgroundColor: t.color.identity.primary, borderRadius: 2 }} /></View>)}
                      </View>
                    ) : null}
                    {[...s.measurements].reverse().map((m, i) => (
                      <Pressable key={i} onPress={() => m.examId && openExam(m.examId)} disabled={!m.examId} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{fmtDate(m.date)}{m.examId ? ' · abrir laudo ›' : ''}</Text>
                        <Text spec={text(t, { role: 'caption' })} style={{ color: m.examId ? t.color.identity.primary : t.color.text.default }}>{m.value}{m.unit ? ` ${m.unit}` : ''}</Text>
                      </Pressable>
                    ))}
                    <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Faixas de referência, quando presentes, são as do documento. Não substitui avaliação médica.</Text>
                  </View>
                ) : null}
              </Pressable>
            )
          })}
        </View>
      ))}

      {/* DOCUMENTAIS */}
      {docGroups.length > 0 ? (
        <View style={{ gap: 8 }}>
          <Text spec={text(t, { role: 'label', tone: 'muted' })}>OUTROS EXAMES (DOCUMENTOS)</Text>
          {docGroups.map(g => (
            <View key={`doc:${g.type}`} style={[styles.card, card, { gap: 6 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text spec={text(t, { role: 'body' })} style={{ flex: 1, paddingRight: 8 }}>{g.type}</Text>
                <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{g.occs.length} {g.occs.length === 1 ? 'realizado' : 'realizados'}</Text>
              </View>
              <View style={styles.chips}>
                {g.occs.map(o => <Pressable key={o.examId} onPress={() => openExam(o.examId)} style={[styles.pill, { borderColor: t.color.border.default }]}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>{fmtDate(o.date)} ›</Text></Pressable>)}
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  )
}

function Chips({ options, value, onChange }: { options: readonly { id: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  const t = useTheme()
  return (
    <View style={styles.chips}>
      {options.map(o => {
        const on = value === o.id
        return <Pressable key={o.id} onPress={() => onChange(o.id)} style={[styles.pill, { borderColor: on ? t.color.identity.primary : t.color.border.default, backgroundColor: on ? t.color.badge.info.soft : 'transparent' }]}><Text spec={text(t, { role: 'caption', tone: on ? 'default' : 'muted' })}>{o.label}</Text></Pressable>
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  spark: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 40 },
})
