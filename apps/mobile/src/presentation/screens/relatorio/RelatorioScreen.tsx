// Relatório (paridade Web /dashboard/relatorio · REL-001 · Camada de Comunicação) — COMPILAÇÃO FACTUAL dos
// registros da pessoa para levar/enviar a um profissional. Reúne 13 domínios, filtra por PERÍODO, aplica a
// SELEÇÃO (seções + item a item, espelho da Sidebar), e permite COMPARTILHAR (texto nativo + link público 30d)
// e salvar PERFIS. Montagem/serialização = @sintera/core (assembleReport); leituras/persistência = api-client.
// NÃO é laudo, diagnóstico nem parecer (RDC 657/2022). Impressão em PDF do desktop → aqui é Compartilhar nativo.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ScrollView, View, ActivityIndicator, RefreshControl, Pressable, Alert, Share, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { text } from '@sintera/design-system'
import {
  assembleReport, serializeReportText, defaultSections, REPORT_GROUPS, REPORT_SECTIONS,
  type ReportData, type ReportSectionKey, PERIOD_PRESETS, type Period, periodLabel,
  selectFinancial, typeLabel, type HealthEvent,
} from '@sintera/core'
import type { ShareDTO, TemplateDTO } from '@sintera/api-client'
import { Text, Button, Input, Disclaimer, DatePicker, Select } from '../../primitives'
import { useTheme } from '../../theme'
import { apiClient } from '../../../infrastructure/apiClient'

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL
function fmtD(d: string | null): string { if (!d) return '—'; const [y, m, dd] = d.slice(0, 10).split('-'); return y ? `${dd}/${m}/${y}` : '—' }
function grauStr(a: Record<string, unknown> | null | undefined): string {
  if (!a) return ''
  const g = (k: string) => (a[k] != null && a[k] !== '' ? String(a[k]) : null)
  return [g('sph') && `Esf ${g('sph')}`, g('cyl') && `Cil ${g('cyl')}`, g('axis') && `Eixo ${g('axis')}`, g('add') && `Ad ${g('add')}`].filter(Boolean).join(', ')
}

export function RelatorioScreen() {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const [data, setData] = useState<ReportData | null>(null)
  const [name, setName] = useState('')
  const [shares, setShares] = useState<ShareDTO[]>([])
  const [templates, setTemplates] = useState<TemplateDTO[]>([])
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const alive = useRef(true)

  const [sections, setSections] = useState<Record<ReportSectionKey, boolean>>(defaultSections())
  const [excluded, setExcluded] = useState<Partial<Record<string, string[]>>>({})
  const [period, setPeriod] = useState<Period>({ preset: 'all' })
  const [configOpen, setConfigOpen] = useState(false)
  const [tplName, setTplName] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback((silent: boolean) => {
    if (silent) setRefreshing(true); else setPhase('loading')
    // H-05 (DIAGNÓSTICO): identificar QUAL das fontes falha. O `asError` do api-client mascara o erro real
    // como "Erro desconhecido"; aqui rotulamos cada chamada pelo NOME (e o erro real quando disponível), SEM
    // mascarar nem tornar resiliente — o relatório ainda ERRA se uma fonte falhar. Correção definitiva só
    // após identificar a fonte responsável (não trocar por allSettled às cegas — evita mascarar inconsistência).
    const errMsg = (e: unknown): string =>
      e instanceof Error ? e.message
      : (e && typeof e === 'object' && 'message' in e) ? String((e as { message: unknown }).message)
      : String(e)
    const tag = <T,>(name: string, p: Promise<T>): Promise<T> =>
      p.catch((e) => { throw new Error(`${name} → ${errMsg(e)}`) })
    Promise.all([
      tag('medications', apiClient.medications.listMedications()),
      tag('agenda', apiClient.agenda.listEvents()),
      tag('exams', apiClient.exams.listExams()),
      tag('body_metrics', apiClient.body.listBodyMetrics()),
      tag('conditions', apiClient.conditions.listConditions()),
      tag('habits', apiClient.habits.listHabits()),
      tag('resources', apiClient.resources.listResources()),
      tag('omics', apiClient.report.listOmicsPanels()),
      tag('contraceptives', apiClient.cycle.listContraceptives()),
      tag('periods', apiClient.cycle.listPeriods()),
      tag('biomarkers', apiClient.exams.getAllBiomarkers()),
      tag('shares', apiClient.report.listShares()),
      tag('templates', apiClient.report.listTemplates()),
      tag('heightCm', apiClient.body.getHeightCm()),
    ]).then(([meds, events, exams, measures, conditions, habits, resources, omics, contraceptives, periods, bio, sh, tpls, heightCm]) => {
      if (!alive.current) return
      const eyewear = resources.filter(r => r.resource_type === 'correcao_visual').map(r => {
        const a = (r.attributes ?? {}) as Record<string, unknown>
        return {
          kind: (a.vision_kind as string) ?? 'oculos', prescribedOn: r.started_on, prescriber: r.prescriber,
          grauOD: grauStr(a.od as Record<string, unknown> | undefined), grauOE: grauStr(a.oe as Record<string, unknown> | undefined),
          dnp: (a.dnp as string) ?? null, bc: (a.bc as string) ?? null, dia: (a.dia as string) ?? null,
        }
      })
      setData({
        meds: meds.map(m => ({ name: m.name, kind: m.kind, dose: m.dose, frequency: m.frequency, startedOn: m.started_on, untilOn: m.until_date, status: m.status })),
        events,
        exams: exams.map(e => ({ id: e.id, type: e.display_title || e.type || 'Exame', date: e.exam_date ?? '', fileUrl: e.file_url })),
        measures: measures.map(m => ({ metric: m.metric, label: m.label, valueText: m.value_text, unit: m.unit, date: m.measured_on, examId: m.exam_id })),
        conditions: conditions.map(c => ({ scope: c.scope, name: c.name, relative: c.relative, since: c.since_label, notes: c.notes })),
        habits: habits.map(h => ({ category: h.category, description: h.description, frequency: h.frequency, notes: h.notes })),
        eyewear,
        omics: omics.map(o => ({ domain: o.domain, laboratory: o.laboratory, totalFeatures: o.total_features, date: o.collected_on ?? o.created_at })),
        contraceptives: contraceptives.map(c => ({ kind: c.kind, brand: c.brand, startedOn: c.started_on, replaceOn: c.replace_on, status: c.status })),
        menstruations: periods.map(p => ({ startedOn: p.started_on, notes: p.notes })),
        expenses: selectFinancial(events),
        biomarkers: bio, // crus — assembleReport resume DENTRO do período (Histórico de Exames respeita a janela)
        heightCm,
      })
      setShares(sh); setTemplates(tpls); setPhase('ready'); setError(null)
    }).catch((e) => { if (alive.current && !silent) { setError(e instanceof Error ? e.message : 'Não foi possível carregar.'); setPhase('error') } })
      .finally(() => { if (alive.current) setRefreshing(false) })
  }, [])
  useEffect(() => { alive.current = true; load(false); return () => { alive.current = false } }, [load])

  const model = useMemo(() => data ? assembleReport(data, { sections, excluded, period, showEmpty: true }) : null, [data, sections, excluded, period])

  // Itens para seleção item a item (exames/medicamentos/suplementos/eventos) — espelha a Web.
  const sectionItems = (k: ReportSectionKey): { key: string; label: string }[] => {
    if (!data) return []
    if (k === 'exames') return data.exams.map(e => ({ key: `${e.type}__${e.date}`, label: `${fmtD(e.date)} — ${e.type}` }))
    if (k === 'medicamentos') return data.meds.filter(m => m.kind !== 'suplemento').map(m => ({ key: m.name, label: m.name + (m.status === 'suspenso' ? ' (suspenso)' : '') }))
    if (k === 'suplementos') return data.meds.filter(m => m.kind === 'suplemento').map(m => ({ key: m.name, label: m.name }))
    if (k === 'eventos') {
      const seen = new Set<string>(); const out: { key: string; label: string }[] = []
      for (const e of data.events as HealthEvent[]) if (!seen.has(e.type)) { seen.add(e.type); out.push({ key: e.type, label: typeLabel(e.type) }) }
      return out.sort((a, b) => a.label.localeCompare(b.label))
    }
    return []
  }
  const hasItems = (k: ReportSectionKey) => k === 'exames' || k === 'medicamentos' || k === 'suplementos' || k === 'eventos'
  const itemOn = (k: string, key: string) => !(excluded[k]?.includes(key))
  const toggleItem = (k: string, key: string) => setExcluded(e => { const set = new Set(e[k] ?? []); if (set.has(key)) set.delete(key); else set.add(key); return { ...e, [k]: [...set] } })
  const toggleSection = (k: ReportSectionKey) => setSections(s => ({ ...s, [k]: !s[k] }))
  const allSections = (v: boolean) => setSections(Object.fromEntries(REPORT_SECTIONS.map(k => [k, v])) as Record<ReportSectionKey, boolean>)

  async function shareText() {
    if (!model) return
    const header = { title: 'Relatório de Saúde (compilação factual)', name: name || undefined }
    try { await Share.share({ message: serializeReportText(model, header) }) } catch { /* cancelado */ }
  }
  async function createLink() {
    if (busy) return
    setBusy(true)
    const sel = REPORT_SECTIONS.filter(k => sections[k])
    const { data: res, error: err } = await apiClient.report.createShare({ sections: sel, excluded, period })
    setBusy(false)
    if (err || !res) { Alert.alert('Não foi possível criar o link', err?.message ?? 'Tente novamente.'); return }
    load(true)
    if (WEB_URL) { try { await Share.share({ message: `${WEB_URL}/r/${res.token}` }) } catch { /* cancelado */ } }
    else Alert.alert('Link criado', 'O link ficará disponível na lista abaixo.')
  }
  async function shareLink(token: string) { if (WEB_URL) { try { await Share.share({ message: `${WEB_URL}/r/${token}` }) } catch { /* cancelado */ } } }
  function revokeLink(id: string) {
    Alert.alert('Revogar link', 'Quem o tiver não verá mais o relatório.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Revogar', style: 'destructive', onPress: async () => { const { error: err } = await apiClient.report.revokeShare(id); if (err) { Alert.alert('Erro', 'Tente novamente.'); return } load(true) } },
    ])
  }
  async function saveTemplate() {
    if (!tplName.trim()) return
    const selection = { sections, excluded, period }
    const { error: err } = await apiClient.report.saveTemplate({ name: tplName.trim(), selection })
    if (err) { Alert.alert('Erro', 'Não foi possível salvar o perfil.'); return }
    setTplName(''); load(true)
  }
  function applyTemplate(tpl: TemplateDTO) {
    const sel = tpl.selection as { sections?: Record<string, boolean>; excluded?: Record<string, string[]>; period?: Period }
    if (sel.sections) setSections(s => ({ ...s, ...(sel.sections as Partial<Record<ReportSectionKey, boolean>>) }))
    setExcluded(sel.excluded ?? {})
    if (sel.period) setPeriod(sel.period)
  }
  function deleteTemplate(id: string) {
    Alert.alert('Excluir perfil', 'Remover este perfil de comunicação?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => { await apiClient.report.deleteTemplate(id); load(true) } },
    ])
  }

  if (phase === 'loading') {
    return <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}><ActivityIndicator color={t.color.identity.primary} /></View>
  }
  if (phase === 'error') {
    return <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}><Text spec={text(t, { role: 'body' })} style={{ color: t.color.badge.error.text, textAlign: 'center' }}>{error}</Text><Button label="Tentar novamente" variant="secondary" onPress={() => load(false)} /></View>
  }

  const card = { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }

  return (
    <ScrollView style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[styles.content, { paddingTop: styles.content.padding + insets.top, paddingBottom: styles.content.padding + insets.bottom }]}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={t.color.identity.primary} />}>
      <View style={styles.headerRow}>
        <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 22 }}>Relatório</Text>
        <Button label="Compartilhar" onPress={shareText} />
      </View>
      <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Compilação factual dos seus registros para levar a um profissional. Você escolhe o período e o que incluir.</Text>

      {/* Período — seletor COMPACTO (adaptação de dispositivo: tela curta) + intervalo quando "Personalizado" */}
      <View style={[styles.card, card, { gap: 8 }]}>
        <Text spec={text(t, { role: 'bodyStrong' })}>Período</Text>
        <Select
          aria-label="Período"
          value={period.preset}
          onChange={(v) => setPeriod(v === 'custom' ? { preset: 'custom', from: period.from ?? null, to: period.to ?? null } : { preset: v as Period['preset'] })}
          options={PERIOD_PRESETS.map(p => ({ id: p.value, label: p.label }))}
        />
        {period.preset === 'custom' ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <DatePicker value={period.from ?? ''} onChange={(v) => setPeriod(pd => ({ ...pd, preset: 'custom', from: v || null }))} placeholder="De" style={{ flex: 1 }} />
            <DatePicker value={period.to ?? ''} onChange={(v) => setPeriod(pd => ({ ...pd, preset: 'custom', to: v || null }))} placeholder="Até" style={{ flex: 1 }} />
          </View>
        ) : null}
      </View>

      {/* Mostrar no relatório — seleção de seções + item a item, PROMINENTE (paridade Web: "Mostrar no relatório"). */}
      <View style={[styles.card, card, { gap: 12 }]}>
        <Text spec={text(t, { role: 'bodyStrong' })}>Mostrar no relatório</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable onPress={() => allSections(true)}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>Selecionar tudo</Text></Pressable>
          <Pressable onPress={() => allSections(false)}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>Limpar</Text></Pressable>
          <Pressable onPress={() => { setSections(defaultSections()); setExcluded({}) }}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>Padrão</Text></Pressable>
        </View>
        {REPORT_GROUPS.map(g => (
          <View key={g.title} style={{ gap: 8 }}>
            <Text spec={text(t, { role: 'label', tone: 'muted' })}>{g.title.toUpperCase()}</Text>
            {g.items.map(it => (
              <View key={it.key} style={{ gap: 6 }}>
                <Pressable onPress={() => toggleSection(it.key)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[styles.box, { borderColor: sections[it.key] ? t.color.identity.primary : t.color.border.default, backgroundColor: sections[it.key] ? t.color.identity.primary : 'transparent' }]} />
                  <Text spec={text(t, { role: 'body' })}>{it.label}</Text>
                </Pressable>
                {sections[it.key] && hasItems(it.key) && sectionItems(it.key).length > 0 ? (
                  <View style={[styles.chips, { paddingLeft: 26 }]}>
                    {sectionItems(it.key).map(item => {
                      const on = itemOn(it.key, item.key)
                      return <Pressable key={item.key} onPress={() => toggleItem(it.key, item.key)} style={[styles.chip, { borderColor: on ? t.color.identity.primary : t.color.border.default, backgroundColor: on ? t.color.badge.info.soft : 'transparent' }]}><Text spec={text(t, { role: 'caption', tone: on ? 'default' : 'faint' })}>{item.label}</Text></Pressable>
                    })}
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ))}
      </View>

      {/* Configurações de relatório — perfis salvos (discreto, recolhido por padrão; paridade Web). */}
      <Pressable onPress={() => setConfigOpen(o => !o)} style={[styles.card, card, { flexDirection: 'row', justifyContent: 'space-between' }]}>
        <Text spec={text(t, { role: 'bodyStrong' })}>Configurações de relatório</Text>
        <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>{configOpen ? 'Ocultar' : 'Ajustar'}</Text>
      </Pressable>
      {configOpen ? (
        <View style={[styles.card, card, { gap: 8 }]}>
          <Text spec={text(t, { role: 'label', tone: 'muted' })}>PERFIS SALVOS</Text>
          {templates.map(tpl => (
            <View key={tpl.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Pressable onPress={() => applyTemplate(tpl)}><Text spec={text(t, { role: 'body' })} style={{ color: t.color.identity.primary }}>{tpl.name}</Text></Pressable>
              <Pressable onPress={() => deleteTemplate(tpl.id)}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.error.text }}>Excluir</Text></Pressable>
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Input value={tplName} onChangeText={setTplName} placeholder="Nome do perfil…" style={{ flex: 1 }} />
            <Button label="Salvar" variant="secondary" onPress={saveTemplate} />
          </View>
        </View>
      ) : null}

      {/* Link público */}
      <View style={[styles.card, card, { gap: 10 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <Text spec={text(t, { role: 'bodyStrong' })} style={{ flex: 1 }} numberOfLines={2}>Compartilhar com um profissional</Text>
          <Button label="Gerar link" onPress={createLink} loading={busy} loadingLabel="Gerando…" />
        </View>
        <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Link válido por 30 dias, revogável a qualquer momento.</Text>
        {shares.map(s => (
          <View key={s.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Expira em {fmtD(s.expires_at)}</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable onPress={() => shareLink(s.token)}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>Compartilhar</Text></Pressable>
              <Pressable onPress={() => revokeLink(s.id)}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.error.text }}>Revogar</Text></Pressable>
            </View>
          </View>
        ))}
      </View>

      {/* Prévia do relatório compilado */}
      <Input value={name} onChangeText={setName} placeholder="Seu nome (opcional, aparece no relatório)" />

      {/* Resumo do relatório + Índice — cabeçalho executivo factual (paridade Web). Contagens vêm do MESMO
          model do @sintera/core (assembleReport) — batem com a Web por construção. */}
      {model && model.groups.length > 0 ? (
        <>
          <View style={[styles.card, card, { gap: 6 }]}>
            <Text spec={text(t, { role: 'bodyStrong' })}>Resumo do relatório</Text>
            <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>Período considerado: {periodLabel(period)}</Text>
            <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Registros incluídos: {model.groups.reduce((n, g) => n + g.sections.reduce((m, s) => m + s.lines.length, 0), 0)}</Text>
            {model.groups.flatMap(g => g.sections).map(s => (
              <Text key={s.key} spec={text(t, { role: 'caption', tone: 'muted' })}>{s.heading}: {s.lines.length}</Text>
            ))}
          </View>
          <View style={[styles.card, card, { gap: 6 }]}>
            <Text spec={text(t, { role: 'bodyStrong' })}>Índice</Text>
            {model.groups.map(g => (
              <View key={g.title} style={{ gap: 2 }}>
                <Text spec={text(t, { role: 'label', tone: 'muted' })}>{g.title.toUpperCase()}</Text>
                {g.sections.map(s => <Text key={s.key} spec={text(t, { role: 'caption', tone: 'muted' })}>· {s.heading}</Text>)}
              </View>
            ))}
          </View>
        </>
      ) : null}

      <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Período: {periodLabel(period)}</Text>
      {model && model.groups.length > 0 ? model.groups.map(g => (
        <View key={g.title} style={{ gap: 8 }}>
          <Text spec={text(t, { role: 'label', tone: 'muted' })}>{g.title.toUpperCase()}</Text>
          {g.sections.map(s => (
            <View key={s.key} style={[styles.card, card, { gap: 4 }]}>
              <Text spec={text(t, { role: 'bodyStrong' })}>{s.heading}</Text>
              {s.lines.map((l, i) => <Text key={i} spec={text(t, { role: 'body' })}>• {l}</Text>)}
            </View>
          ))}
        </View>
      )) : (
        <View style={[styles.card, card]}><Text spec={text(t, { role: 'body', tone: 'muted' })} style={{ textAlign: 'center' }}>Nada a exibir para a seleção e o período atuais.</Text></View>
      )}

      <Disclaimer variant="relatorio" />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  box: { width: 18, height: 18, borderRadius: 5, borderWidth: 2 },
})
