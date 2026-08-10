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
import { summarizeBiomarkers, isOrderDocumentType, interpretationSymbol, trendDeltaText, type BiomarkerSummary } from '@sintera/core'
import type { ExamDTO } from '@sintera/api-client'
import { Text, Button, Input, Select } from '../../primitives'
import { useTheme } from '../../theme'
import { apiClient } from '../../../infrastructure/apiClient'

function fmtDate(iso: string): string { if (!iso) return '—'; const [y, m, d] = iso.slice(0, 10).split('-'); return `${d}/${m}/${y}` }

const PERIODS: { key: string; label: string; days: number | null }[] = [
  { key: 'all', label: 'Qualquer data', days: null }, { key: '30d', label: 'Últimos 30 dias', days: 30 },
  { key: '90d', label: 'Últimos 90 dias', days: 90 }, { key: '1a', label: 'Último ano', days: 365 },
]

export function HistoricoExamesScreen() {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  // HistoricoExames vive no stack de Minha Saúde — abre exame/indicador no próprio stack (mesma aba).
  const nav = navigation as { navigate: (n: string, p: unknown) => void }
  const openExam = (id: string) => nav.navigate('ExamDetail', { id })
  const openIndicador = (name: string) => nav.navigate('IndicadorDetail', { name })
  const [summaries, setSummaries] = useState<BiomarkerSummary[]>([])
  const [exams, setExams] = useState<ExamDTO[]>([])
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [period, setPeriod] = useState('all')
  const [sortDir, setSortDir] = useState<'recent' | 'old'>('recent')
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

  // Metadados do laudo por exam_id (laboratório/solicitante) — para o resumo longitudinal por exame (paridade Web).
  const examMeta = useMemo(() => {
    const m = new Map<string, { issuer: string | null; requester: string | null }>()
    for (const e of exams) m.set(e.id, { issuer: e.issuer, requester: e.requesting_physician })
    return m
  }, [exams])
  // Cor do símbolo de interpretação (mesma leitura da Web: acima=laranja · abaixo=azul · dentro=âncora · s/ref=neutro).
  const symColor = (interp: string | null | undefined): string =>
    interp === 'acima_da_referencia' ? '#f97316' : interp === 'abaixo_da_referencia' ? '#2563eb'
      : interp === 'dentro_da_referencia' ? t.color.identity.primary : t.color.text.muted

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

      {/* Filtros de descoberta — seletores compactos (D-16): toca, rola e escolhe (sem parede de chips). */}
      {availableTypes.length > 0 ? (
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text spec={text(t, { role: 'label', tone: 'muted' })}>TIPO</Text>
              <Select options={[{ id: 'all', label: 'Todos os tipos' }, ...availableTypes.map(ty => ({ id: ty, label: ty }))]} value={typeFilter} onChange={setTypeFilter} title="Filtrar por tipo" searchable />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text spec={text(t, { role: 'label', tone: 'muted' })}>PERÍODO</Text>
              <Select options={PERIODS.map(p => ({ id: p.key, label: p.label }))} value={period} onChange={setPeriod} title="Filtrar por período" />
            </View>
          </View>
          <Pressable onPress={() => setSortDir(d => d === 'recent' ? 'old' : 'recent')} style={{ alignSelf: 'flex-end' }}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>{sortDir === 'recent' ? 'Ordenar: Recentes ↓' : 'Ordenar: Antigos ↑'}</Text></Pressable>
        </View>
      ) : null}

      {empty ? (
        <View style={[styles.card, card, { gap: 10 }]}>
          <Text spec={text(t, { role: 'body', tone: 'muted' })} style={{ textAlign: 'center' }}>Nenhum exame ainda. Envie exames para acompanhar a evolução.</Text>
          <Button label="Enviar exame" onPress={() => nav.navigate('ExamUpload', undefined)} />
        </View>
      ) : null}

      {/* LABORATORIAIS — cada EXAME é um grupo com resumo longitudinal + ocorrências (laudo) + seus biomarcadores. */}
      {labGroups.map(g => {
        const total = g.occs.length
        const lastMeta = total ? examMeta.get(g.occs[0].examId) : null
        const summary: { label: string; value: string }[] = [
          ...(total ? [{ label: 'Primeira realização', value: fmtDate(g.occs[total - 1].date) }] : []),
          ...(total ? [{ label: 'Última realização', value: fmtDate(g.occs[0].date) }] : []),
          { label: 'Total de exames', value: String(total) },
          ...(lastMeta?.issuer ? [{ label: 'Último laboratório', value: lastMeta.issuer }] : []),
          ...(lastMeta?.requester ? [{ label: 'Última solicitação', value: lastMeta.requester }] : []),
        ]
        return (
          <View key={`lab:${g.name}`} style={{ gap: 8 }}>
            <Text spec={text(t, { role: 'label', tone: 'muted' })}>{g.name.toUpperCase()}</Text>
            {/* Resumo longitudinal do exame (entidade ao longo do tempo — tudo derivado dos laudos). */}
            <View style={[styles.card, card, { gap: 8 }]}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {summary.map(s => (
                  <View key={s.label} style={{ width: '50%', paddingVertical: 3, paddingRight: 8 }}>
                    <Text spec={text(t, { role: 'caption', tone: 'faint' })} style={{ textTransform: 'uppercase' }}>{s.label}</Text>
                    <Text spec={text(t, { role: 'caption' })}>{s.value}</Text>
                  </View>
                ))}
              </View>
              {total > 0 ? (
                <View style={styles.chips}>
                  <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Histórico:</Text>
                  {g.occs.map(o => <Pressable key={`${o.examId}|${o.date}`} onPress={() => openExam(o.examId)} style={[styles.pill, { borderColor: t.color.border.default }]}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>{fmtDate(o.date)} ›</Text></Pressable>)}
                </View>
              ) : null}
            </View>
            {/* Biomarcadores medidos — valor recente + símbolo + tendência (paridade Web). Toque → página do indicador. */}
            {g.items.map(s => (
              <Pressable key={s.canonicalName} onPress={() => openIndicador(s.canonicalName)} accessibilityRole="button"
                style={[styles.card, card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text spec={text(t, { role: 'body' })}>{s.displayName}</Text>
                  <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{s.count} {s.count === 1 ? 'medição' : 'medições'}{s.latest ? ` · última em ${fmtDate(s.latest.date)}` : ''}</Text>
                </View>
                {s.latest ? (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text spec={text(t, { role: 'bodyStrong' })}>{s.latest.value} <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{s.unit}</Text> <Text spec={text(t, { role: 'caption' })} style={{ color: symColor(s.latest.interpretation) }}>{interpretationSymbol(s.latest.interpretation)}</Text></Text>
                    <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{trendDeltaText(s.trend, s.deltaPercent)}</Text>
                  </View>
                ) : <Text spec={text(t, { role: 'caption', tone: 'muted' })}>›</Text>}
              </Pressable>
            ))}
          </View>
        )
      })}

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

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
})
