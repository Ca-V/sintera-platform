// Monitoramento — Sinais Vitais (paridade Web /dashboard/sinais-vitais) — série temporal autorrelatada na MESMA
// tabela body_metrics (taxonomia VITAL_SIGNS, isVital). Pressão arterial, FC, glicemia, saturação, temperatura,
// outro sinal. FACTUAL (RDC 657/2022): registra e acompanha no tempo; sem juízo clínico. Captura por dispositivo
// (Conexões/HIP-001) é Fase 2 — ainda não disponível no Mobile; entrada manual aqui. Reusa api-client.body.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ScrollView, View, ActivityIndicator, RefreshControl, Pressable, Alert, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { text } from '@sintera/design-system'
import type { BodyMetricDTO, ActivitySessionDTO } from '@sintera/api-client'
import {
  VITAL_SIGNS, bodyMetricLabel, isVital, SCREEN_COPY, type VitalMetric,
  hasTimeOfDay, measurementInstant, measurementMeta, requiresTimeOfDay,
  ACTIVITY_TYPES, activityTypeLabel, activitySummary,
  durationSecondsFromMinutes, distanceMetersFromKm,
} from '@sintera/core'
import { Text, Button, Input, Disclaimer, DatePicker, TimePicker, Select } from '../../primitives'
import { useTheme } from '../../theme'
import { apiClient } from '../../../infrastructure/apiClient'

// PARIDADE (homologação 25/08): todo texto visível vem do core — a Web e o Mobile prometiam coisas
// DIFERENTES no subtítulo desta tela porque cada uma redigia o seu. Aqui não se escreve texto.
const C = SCREEN_COPY.monitoramento

function parseNum(v: string): number { return Number(String(v).replace(',', '.').replace(/[^\d.-]/g, '')) }
function fmt(d: string): string { const [y, m, dd] = (d || '').slice(0, 10).split('-'); return y ? `${dd}/${m}/${y}` : '—' }
function today(): string { return new Date().toISOString().slice(0, 10) }

/**
 * Data e — quando registrada — HORA da medição (HIP-014 §2). Espelha `fmtMeasured` da Web; `hasTimeOfDay` vem do
 * core justamente para que as duas pontas decidam IGUAL o que é hora de verdade e o que é só a âncora do dia.
 */
function fmtMeasured(measuredOn: string, measuredAt: string | null | undefined): string {
  if (!hasTimeOfDay(measuredAt)) return fmt(measuredOn)
  const d = new Date(measuredAt as string)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${fmt(measuredOn)} · ${hh}:${mm}`
}

/** Data + hora locais → instante UTC. Sem hora, delega ao core (âncora do dia = "hora não registrada"). */
function instantOf(date: string, time: string): string | null {
  if (!time) return measurementInstant(null, date)
  const [y, m, d] = date.split('-').map(Number)
  const [h, min] = time.split(':').map(Number)
  const dt = new Date(y, m - 1, d, h, min, 0, 0)
  return Number.isNaN(dt.getTime()) ? measurementInstant(null, date) : dt.toISOString()
}
const unitOf = (m: VitalMetric) => VITAL_SIGNS.find(v => v.value === m)?.unit ?? ''

export function MonitoramentoScreen() {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  // Navegação para Conexões — o convite abaixo é a única porta para as integrações no aparelho.
  const navigation = useNavigation() as unknown as { navigate: (n: string) => void }
  const [items, setItems] = useState<BodyMetricDTO[]>([])
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const alive = useRef(true)

  const [open, setOpen] = useState(false)
  const [metric, setMetric] = useState<VitalMetric>('pressao_arterial')
  const [label, setLabel] = useState('')
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState('mmHg')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const [acts, setActs] = useState<ActivitySessionDTO[]>([])
  const [actOpen, setActOpen] = useState(false)
  const [actType, setActType] = useState('caminhada')
  const [actName, setActName] = useState('')
  const [actDate, setActDate] = useState('')
  const [actTime, setActTime] = useState('')
  const [actMin, setActMin] = useState('')
  const [actKm, setActKm] = useState('')
  const [savingAct, setSavingAct] = useState(false)

  const load = useCallback((silent: boolean) => {
    if (silent) setRefreshing(true); else setPhase('loading')
    apiClient.body.listBodyMetrics()
      .then((ms) => { if (!alive.current) return; setItems(ms.filter(m => isVital(m.metric))); setPhase('ready'); setError(null) })
      .catch((e) => { if (alive.current && !silent) { setError(e instanceof Error ? e.message : 'Não foi possível carregar.'); setPhase('error') } })
      .finally(() => { if (alive.current) setRefreshing(false) })
  }, [])
  useEffect(() => { alive.current = true; load(false); return () => { alive.current = false } }, [load])

  const groups = useMemo(() => VITAL_SIGNS.map(v => ({ v, list: items.filter(i => i.metric === v.value) })).filter(g => g.list.length > 0), [items])

  function startNew() { setMetric('pressao_arterial'); setLabel(''); setValue(''); setUnit('mmHg'); setDate(today()); setTime(''); setNotes(''); setOpen(true) }
  function chooseMetric(m: VitalMetric) { setMetric(m); setUnit(unitOf(m)) }
  async function save() {
    if (!value.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { Alert.alert('Campos obrigatórios', 'Informe valor e data (AAAA-MM-DD).'); return }
    setSaving(true)
    try {
      const { error: err } = await apiClient.body.saveBodyMetric({
        metric, label: metric === 'outro_sinal' ? (label.trim() || 'Sinal') : null,
        value_text: value, unit, measured_on: date, measured_at: instantOf(date, time), notes,
      })
      if (err) { Alert.alert('Não foi possível salvar', err.message || 'Tente novamente.'); return }
      setOpen(false); load(true)
    } finally { setSaving(false) }
  }

  // ── Atividade física (HIP-014 §3) — seção IRMÃ. FATO observado, com proveniência sempre visível.
  const loadActs = useCallback(() => {
    apiClient.activity.listActivitySessions()
      .then((a) => { if (alive.current) setActs(a) })
      .catch(() => { /* seção degrada vazia; não derruba a tela */ })
  }, [])
  useEffect(() => { loadActs() }, [loadActs])

  function startNewAct() {
    setActType('caminhada'); setActName(''); setActDate(today()); setActTime(''); setActMin(''); setActKm('')
    setActOpen(true)
  }

  async function saveAct() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(actDate)) { Alert.alert('Campo obrigatório', 'Informe a data da atividade.'); return }
    setSavingAct(true)
    try {
      // Conversão de unidade vem do core: campo vazio vira AUSENTE, nunca zero, e as duas telas convertem igual.
      const { error: err } = await apiClient.activity.saveActivitySession({
        source: 'manual',
        activity_type: actType,
        title: actName.trim() || null,
        started_at: instantOf(actDate, actTime) ?? `${actDate}T00:00:00.000Z`,
        duration_s: durationSecondsFromMinutes(actMin),
        distance_m: distanceMetersFromKm(actKm),
      })
      if (err) { Alert.alert('Não foi possível salvar', err.message || 'Tente novamente.'); return }
      setActOpen(false); loadActs()
    } finally { setSavingAct(false) }
  }

  function removeAct(a: ActivitySessionDTO) {
    Alert.alert('Remover atividade', `Remover ${a.title?.trim() || activityTypeLabel(a.activity_type)}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: C.removeAction, style: 'destructive', onPress: async () => {
        const { error: err } = await apiClient.activity.deleteActivitySession(a.id)
        if (err) { Alert.alert('Erro', 'Tente novamente.'); return }
        loadActs()
      } },
    ])
  }
  function remove(m: BodyMetricDTO) {
    Alert.alert('Remover registro', `Remover ${bodyMetricLabel(m.metric)} de ${fmt(m.measured_on)}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => { const { error: err } = await apiClient.body.deleteBodyMetric(m.id); if (err) { Alert.alert('Erro', 'Tente novamente.'); return } load(true) } },
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
        <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 22 }}>{C.title}</Text>
        <Button label={open ? C.close : C.add} variant={open ? 'secondary' : 'primary'} onPress={() => (open ? setOpen(false) : startNew())} />
      </View>
      <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{C.subtitle}</Text>

      {/* Conexões — porta das integrações com dispositivos (HIP-001). A Web tem este convite aqui; o Mobile
          não tinha, e sem ele não havia caminho nenhum para Conexões no aparelho. */}
      <Pressable onPress={() => navigation.navigate('Conexoes')} style={[styles.card, card, styles.connect]}>
        <Text spec={text(t, { role: 'body' })} style={{ flex: 1 }}>{C.connectInvite}</Text>
        <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>{C.connectAction} →</Text>
      </Pressable>

      {open ? (
        <View style={[styles.card, card, { gap: 12 }]}>
          {/* SELETOR, não opções expostas: os seis sinais ocupavam três linhas e empurravam o resto do
              formulário para fora da tela. Mesmo controle da Web, mesma ordem de campos, campos ROTULADOS. */}
          <Campo label={C.fieldVital}>
            <Select
              value={metric}
              onChange={(v) => chooseMetric(v as VitalMetric)}
              options={VITAL_SIGNS.map(v => ({ id: v.value, label: v.label }))}
              title={C.fieldVital}
            />
          </Campo>
          {metric === 'outro_sinal' ? (
            <Campo label="Nome do sinal">
              <Input value={label} onChangeText={setLabel} placeholder="Ex.: Saturação em exercício" />
            </Campo>
          ) : null}
          <Campo label={C.fieldDate}>
            <DatePicker value={date} onChange={setDate} placeholder={C.fieldDate} />
          </Campo>
          {/* HIP-014 §2 — paridade com a Web: a hora distingue duas medições do mesmo dia. */}
          {requiresTimeOfDay(metric) ? (
            <Campo label={C.fieldTime}>
              <TimePicker value={time} onChange={setTime} placeholder={C.fieldTime} />
              <Text spec={text(t, { role: 'caption', tone: 'muted' })} style={{ marginTop: 4 }}>{C.fieldTimeHint}</Text>
            </Campo>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 2 }}>
              <Campo label={C.fieldValue}>
                <Input value={value} onChangeText={setValue} placeholder={VITAL_SIGNS.find(v => v.value === metric)?.placeholder} />
              </Campo>
            </View>
            <View style={{ flex: 1 }}>
              <Campo label={C.fieldUnit}>
                <Input value={unit} onChangeText={setUnit} />
              </Campo>
            </View>
          </View>
          <Campo label={C.fieldNotes}>
            <Input value={notes} onChangeText={setNotes} multiline style={{ minHeight: 50, textAlignVertical: 'top' }} />
          </Campo>
          <View style={styles.actions}>
            <Button label={C.save} onPress={save} loading={saving} loadingLabel="Salvando…" />
          </View>
        </View>
      ) : null}

      <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 17, marginTop: 4 }}>{C.vitalsSection}</Text>

      {groups.length === 0 && !open ? (
        <View style={[styles.card, card]}><View style={{ gap: 4 }}>
          <Text spec={text(t, { role: 'bodyStrong' })} style={{ textAlign: 'center' }}>{C.emptyTitle}</Text>
          <Text spec={text(t, { role: 'body', tone: 'muted' })} style={{ textAlign: 'center' }}>{C.emptyMessage}</Text>
        </View></View>
      ) : null}

      {groups.map(({ v, list }) => {
        // Série cronológica (asc) p/ o sparkline. Pressão arterial → parseNum usa o 1º número (sistólica).
        const serie = [...list].reverse().map(i => parseNum(i.value_text)).filter(n => Number.isFinite(n))
        const min = Math.min(...serie), max = Math.max(...serie)
        return (
          <View key={v.value} style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text spec={text(t, { role: 'bodyStrong' })}>{v.label}</Text>
              <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{list.length} {list.length === 1 ? 'registro' : 'registros'}</Text>
            </View>
            {serie.length >= 2 && max > min ? (
              <View style={styles.spark}>
                {serie.map((n, i) => <View key={i} style={{ flex: 1, height: 36, justifyContent: 'flex-end' }}><View style={{ height: Math.max(3, ((n - min) / (max - min)) * 36), backgroundColor: t.color.identity.primary, borderRadius: 2 }} /></View>)}
              </View>
            ) : null}
            {list.map(i => (
              <View key={i.id} style={[styles.card, card, { gap: 2 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text spec={text(t, { role: 'body' })}>{i.metric === 'outro_sinal' && i.label ? `${i.label}: ` : ''}{i.value_text}{i.unit ? ` ${i.unit}` : ''}</Text>
                  <Pressable onPress={() => remove(i)}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.error.text }}>{C.removeAction}</Text></Pressable>
                </View>
                <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{measurementMeta({ when: fmtMeasured(i.measured_on, i.measured_at), source: i.source, notes: i.notes })}</Text>
              </View>
            ))}
          </View>
        )
      })}

      {/* ATIVIDADE FÍSICA (HIP-014 §3) — seção irmã, mesma estrutura da Web. Registra o que aconteceu, sem
          avaliar desempenho (RDC 657). Origem sempre visível, como nos sinais vitais. */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 17 }}>{C.activitySection}</Text>
        <Button label={actOpen ? C.close : C.activityAdd} variant="secondary"
          onPress={() => (actOpen ? setActOpen(false) : startNewAct())} />
      </View>

      {actOpen ? (
        <View style={[styles.card, card, { gap: 10 }]}>
          <Campo label={C.fieldActivityType}>
            <Select options={ACTIVITY_TYPES.map(a => ({ id: a.value, label: a.label }))} value={actType}
              onChange={setActType} title={C.fieldActivityType} />
          </Campo>
          <Campo label={C.fieldActivityName}>
            <Input value={actName} onChangeText={setActName} placeholder="Ex.: Corrida no parque" />
          </Campo>
          <Campo label={C.fieldStartDate}>
            <DatePicker value={actDate} onChange={setActDate} placeholder={C.fieldStartDate} />
          </Campo>
          <Campo label={C.fieldStartTime}>
            <TimePicker value={actTime} onChange={setActTime} placeholder={C.fieldStartTime} />
          </Campo>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Campo label={C.fieldDurationMin}>
                <Input value={actMin} onChangeText={setActMin} placeholder="Ex.: 45" keyboardType="numeric" />
              </Campo>
            </View>
            <View style={{ flex: 1 }}>
              <Campo label={C.fieldDistanceKm}>
                <Input value={actKm} onChangeText={setActKm} placeholder="Ex.: 5,2" keyboardType="numeric" />
              </Campo>
            </View>
          </View>
          <Button label={C.save} onPress={saveAct} loading={savingAct} loadingLabel="Salvando…" />
        </View>
      ) : null}

      {acts.length === 0 && !actOpen ? (
        <View style={[styles.card, card]}><View style={{ gap: 4 }}>
          <Text spec={text(t, { role: 'bodyStrong' })} style={{ textAlign: 'center' }}>{C.activityEmptyTitle}</Text>
          <Text spec={text(t, { role: 'body', tone: 'muted' })} style={{ textAlign: 'center' }}>{C.activityEmptyMsg}</Text>
        </View></View>
      ) : null}

      {acts.map(a => (
        <View key={a.id} style={[styles.card, card, { gap: 2 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text spec={text(t, { role: 'body' })}>{a.title?.trim() || activityTypeLabel(a.activity_type)}</Text>
            <Pressable onPress={() => removeAct(a)}>
              <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.error.text }}>{C.removeAction}</Text>
            </Pressable>
          </View>
          <Text spec={text(t, { role: 'caption', tone: 'muted' })}>
            {measurementMeta({
              when: [fmtMeasured(a.started_at.slice(0, 10), a.started_at), activitySummary(a)].filter(Boolean).join(' · '),
              source: a.source,
              notes: a.notes,
            })}
          </Text>
        </View>
      ))}

      <Disclaimer variant="geral" />
    </ScrollView>
  )
}

/** Rótulo acima do controle. A Web rotula todos os campos; o Mobile não rotulava nenhum. */
function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  const t = useTheme()
  return (
    <View style={{ gap: 6 }}>
      <Text spec={text(t, { role: 'label', tone: 'muted' })}>{label}</Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  connect: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  spark: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 36 },
})
