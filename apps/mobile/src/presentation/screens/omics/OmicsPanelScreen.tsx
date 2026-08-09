// Exame de Ômica — painel (paridade Web /dashboard/omics/[id]): N1 resumo · N2 categorias · N3 features · N4
// histórico temporal por feature. Comparação/organização FACTUAL — sem "melhorou/piorou/sugere" (RDC 657/2022).
// Entrada manual usa a RESOLUÇÃO DE IDENTIDADE do catálogo (searchCatalog). Leituras via ponte /api/omics;
// escritas diretas (RLS dono). Reusa api-client.omics + rótulos do @sintera/core.
import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, View, ActivityIndicator, RefreshControl, Pressable, Alert, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { text } from '@sintera/design-system'
import type { OmicsPanelDetail, OmicsCategoryDTO, OmicsResultDTO, OmicsHistoryPoint, OmicsCatalogMatch } from '@sintera/api-client'
import { DOMAIN_LABEL, fmtOmicsDate, type OmicsDomain } from '@sintera/core'
import { Text, Button, Input, DatePicker } from '../../primitives'
import { useTheme } from '../../theme'
import { apiClient } from '../../../infrastructure/apiClient'
import type { MinhaSaudeStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<MinhaSaudeStackParamList, 'OmicsPanel'>

function fmt(d: string | null): string { if (!d) return '—'; const [y, m, dd] = d.slice(0, 10).split('-'); return y ? `${dd}/${m}/${y}` : '—' }
function resultText(r: OmicsResultDTO): string {
  const v = r.value != null ? String(r.value) : (r.raw_value ?? (r.detection_status ?? '—'))
  return `${v}${r.unit ? ` ${r.unit}` : ''}`
}

export function OmicsPanelScreen({ route, navigation }: Props) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const { id, domain: domainParam } = route.params
  const [detail, setDetail] = useState<OmicsPanelDetail | null>(null)
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const alive = useRef(true)

  const [openCat, setOpenCat] = useState<string | null>(null)
  const [rowsByCat, setRowsByCat] = useState<Record<string, OmicsResultDTO[]>>({})
  const [loadingCat, setLoadingCat] = useState<string | null>(null)
  const [openFeature, setOpenFeature] = useState<string | null>(null)
  const [hist, setHist] = useState<Record<string, OmicsHistoryPoint[]>>({})

  const [addOpen, setAddOpen] = useState(false)
  const [name, setName] = useState('')
  const [resolved, setResolved] = useState<OmicsCatalogMatch | null>(null)
  const [resolving, setResolving] = useState(false)
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState('')
  const [method, setMethod] = useState('')
  const [rdate, setRdate] = useState('')
  const [saving, setSaving] = useState(false)

  const domain = detail?.panel.domain ?? domainParam ?? 'metabolomics'

  const load = useCallback((silent: boolean) => {
    if (silent) setRefreshing(true); else setPhase('loading')
    apiClient.omics.getPanel(id)
      .then((d) => { if (!alive.current) return; setDetail(d); setPhase('ready'); setError(null); setRowsByCat({}); setOpenCat(null) })
      .catch((e) => { if (alive.current && !silent) { setError(e instanceof Error ? e.message : 'Não foi possível carregar.'); setPhase('error') } })
      .finally(() => { if (alive.current) setRefreshing(false) })
  }, [id])
  useEffect(() => { alive.current = true; load(false); return () => { alive.current = false } }, [load])

  const catKey = (c: OmicsCategoryDTO) => c.category_id ?? '__none__'
  async function toggleCat(c: OmicsCategoryDTO) {
    const k = catKey(c)
    if (openCat === k) { setOpenCat(null); return }
    setOpenCat(k)
    if (!rowsByCat[k]) {
      setLoadingCat(k)
      try {
        const all = await apiClient.omics.getResults(id, c.category_id ?? undefined)
        const rows = c.category_id ? all : all.filter(r => r.category_id == null)
        if (alive.current) setRowsByCat(prev => ({ ...prev, [k]: rows }))
      } catch { if (alive.current) setRowsByCat(prev => ({ ...prev, [k]: [] })) }
      finally { if (alive.current) setLoadingCat(null) }
    }
  }
  async function toggleFeature(r: OmicsResultDTO) {
    if (!r.feature_id) return
    if (openFeature === r.feature_id) { setOpenFeature(null); return }
    setOpenFeature(r.feature_id)
    if (!hist[r.feature_id]) {
      try { const h = await apiClient.omics.getFeatureHistory(r.feature_id); if (alive.current) setHist(prev => ({ ...prev, [r.feature_id!]: h })) }
      catch { if (alive.current) setHist(prev => ({ ...prev, [r.feature_id!]: [] })) }
    }
  }

  async function resolve() {
    if (!name.trim()) { setResolved(null); return }
    setResolving(true)
    try {
      const { resolved: hit, matches } = await apiClient.omics.searchCatalog(name, domain)
      const best = hit ?? matches[0] ?? null
      setResolved(best)
      if (best?.unit_default && !unit) setUnit(best.unit_default)
    } catch { /* silencioso */ } finally { setResolving(false) }
  }
  async function saveResult() {
    if (!name.trim()) { Alert.alert('Campo obrigatório', 'Informe a feature.'); return }
    setSaving(true)
    try {
      const { error: err } = await apiClient.omics.addResult(id, {
        domain, featureId: resolved?.id ?? null, featureName: resolved?.canonical_name ?? name.trim(),
        categoryId: resolved?.category_id ?? null, value: value.trim() ? Number(value.replace(',', '.')) : null,
        unit, rawValue: value.trim() || null, method, measuredOn: rdate || null,
      })
      if (err) { Alert.alert('Não foi possível salvar', err.message || 'Tente novamente.'); return }
      setAddOpen(false); setName(''); setValue(''); setUnit(''); setMethod(''); setRdate(''); setResolved(null); load(true)
    } finally { setSaving(false) }
  }
  function removeResult(r: OmicsResultDTO) {
    Alert.alert('Remover resultado', `Remover ${r.feature_name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => { const { error: err } = await apiClient.omics.deleteResult(r.id); if (err) { Alert.alert('Erro', 'Tente novamente.'); return } setRowsByCat({}); setOpenCat(null); load(true) } },
    ])
  }
  function removePanel() {
    Alert.alert('Excluir exame', 'Excluir este exame de ômica e todos os seus resultados?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => { const { error: err } = await apiClient.omics.deletePanel(id); if (err) { Alert.alert('Erro', 'Tente novamente.'); return } navigation.goBack() } },
    ])
  }

  if (phase === 'loading') {
    return <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}><ActivityIndicator color={t.color.identity.primary} /></View>
  }
  if (phase === 'error' || !detail) {
    return <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}><Text spec={text(t, { role: 'body' })} style={{ color: t.color.badge.error.text, textAlign: 'center' }}>{error ?? 'Painel não encontrado.'}</Text><Button label="Tentar novamente" variant="secondary" onPress={() => load(false)} /></View>
  }

  const card = { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }
  const p = detail.panel

  return (
    <ScrollView style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[styles.content, { paddingBottom: styles.content.padding + insets.bottom }]}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={t.color.identity.primary} />}>
      {/* N1 — resumo do painel */}
      <View style={[styles.card, card, { gap: 4 }]}>
        <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 18 }}>{DOMAIN_LABEL[p.domain as OmicsDomain] ?? p.domain}</Text>
        <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{[fmtOmicsDate(p.collected_on ?? p.created_at), p.laboratory, p.technology, p.platform].filter(Boolean).join(' · ')}</Text>
        <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{detail.total_results} {detail.total_results === 1 ? 'resultado' : 'resultados'}{p.total_features ? ` · ${p.total_features} marcadores` : ''}</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {!addOpen ? <Button label="Adicionar resultado" onPress={() => setAddOpen(true)} /> : null}
      </View>

      {/* Entrada manual com resolução de identidade do catálogo */}
      {addOpen ? (
        <View style={[styles.card, card, { gap: 10 }]}>
          <Text spec={text(t, { role: 'bodyStrong' })}>Adicionar resultado</Text>
          <Input value={name} onChangeText={setName} onBlur={resolve} placeholder="Feature (nome, sinônimo ou ID externo)" autoCapitalize="none" />
          {resolving ? <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Resolvendo no catálogo…</Text>
            : resolved ? <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>Identificado: {resolved.canonical_name}</Text>
            : name.trim() ? <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Sem correspondência no catálogo — será salvo pelo nome digitado.</Text> : null}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Input value={value} onChangeText={setValue} placeholder="Valor" keyboardType="decimal-pad" style={{ flex: 2 }} />
            <Input value={unit} onChangeText={setUnit} placeholder="unidade" style={{ flex: 1 }} />
          </View>
          <Input value={method} onChangeText={setMethod} placeholder="Método (opcional)" />
          <DatePicker value={rdate} onChange={setRdate} placeholder="Data" />
          <View style={styles.actions}>
            <Button label="Cancelar" variant="secondary" onPress={() => setAddOpen(false)} />
            <Button label="Salvar" onPress={saveResult} loading={saving} loadingLabel="Salvando…" />
          </View>
        </View>
      ) : null}

      {/* N2 — categorias (expandem para N3 features) */}
      {detail.categories.length === 0 ? (
        <View style={[styles.card, card]}><Text spec={text(t, { role: 'body', tone: 'muted' })} style={{ textAlign: 'center' }}>Nenhum resultado ainda. Use “Adicionar resultado”.</Text></View>
      ) : null}
      {detail.categories.map(c => {
        const k = catKey(c); const isOpen = openCat === k; const rows = rowsByCat[k] ?? []
        return (
          <View key={k} style={[styles.card, card, { gap: 8 }]}>
            <Pressable onPress={() => toggleCat(c)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text spec={text(t, { role: 'bodyStrong' })}>{c.name}</Text>
              <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{c.count} · {isOpen ? '−' : '+'}</Text>
            </Pressable>
            {isOpen ? (
              loadingCat === k ? <ActivityIndicator color={t.color.identity.primary} />
              : rows.length === 0 ? <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Sem resultados nesta categoria.</Text>
              : rows.map(r => {
                const hpts = (hist[r.feature_id ?? ''] ?? []).filter(h => h.value != null)
                const vals = hpts.map(h => h.value as number); const min = Math.min(...vals), max = Math.max(...vals)
                return (
                  <View key={r.id} style={{ gap: 4, borderTopWidth: 1, borderTopColor: t.color.border.default, paddingTop: 6 }}>
                    <Pressable onPress={() => toggleFeature(r)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text spec={text(t, { role: 'body' })} style={{ flex: 1, paddingRight: 8, color: r.feature_id ? t.color.identity.primary : t.color.text.default }}>{r.feature_name}{r.feature_id ? ' ›' : ''}</Text>
                      <Text spec={text(t, { role: 'bodyStrong' })}>{resultText(r)}</Text>
                    </Pressable>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text spec={text(t, { role: 'caption', tone: 'faint' })}>{[r.method, r.measured_on ? fmt(r.measured_on) : null].filter(Boolean).join(' · ')}</Text>
                      <Pressable onPress={() => removeResult(r)}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.error.text }}>Remover</Text></Pressable>
                    </View>
                    {openFeature === r.feature_id ? (
                      <View style={{ gap: 4, paddingBottom: 4 }}>
                        {hpts.length > 1 && max > min ? (
                          <View style={styles.spark}>{hpts.map((h, i) => <View key={i} style={{ flex: 1, height: 32, justifyContent: 'flex-end' }}><View style={{ height: Math.max(3, (((h.value as number) - min) / (max - min)) * 32), backgroundColor: t.color.identity.primary, borderRadius: 2 }} /></View>)}</View>
                        ) : null}
                        {hpts.length === 0 ? <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Sem histórico para esta feature.</Text>
                          : [...hpts].reverse().map((h, i) => <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text spec={text(t, { role: 'caption', tone: 'muted' })}>{fmt(h.measured_on)}{h.laboratory ? ` · ${h.laboratory}` : ''}</Text><Text spec={text(t, { role: 'caption' })}>{h.value}{h.unit ? ` ${h.unit}` : ''}</Text></View>)}
                      </View>
                    ) : null}
                  </View>
                )
              })
            ) : null}
          </View>
        )
      })}

      <Pressable onPress={removePanel} style={{ alignSelf: 'center', marginTop: 8 }}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.error.text }}>Excluir exame</Text></Pressable>
      <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Organização factual dos resultados — sem interpretação clínica.</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  spark: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 32 },
})
