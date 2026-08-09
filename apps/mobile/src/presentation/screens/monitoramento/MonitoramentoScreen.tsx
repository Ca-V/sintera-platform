// Monitoramento — Sinais Vitais (paridade Web /dashboard/sinais-vitais) — série temporal autorrelatada na MESMA
// tabela body_metrics (taxonomia VITAL_SIGNS, isVital). Pressão arterial, FC, glicemia, saturação, temperatura,
// outro sinal. FACTUAL (RDC 657/2022): registra e acompanha no tempo; sem juízo clínico. Captura por dispositivo
// (Conexões/HIP-001) é Fase 2 — ainda não disponível no Mobile; entrada manual aqui. Reusa api-client.body.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ScrollView, View, ActivityIndicator, RefreshControl, Pressable, Alert, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { text } from '@sintera/design-system'
import type { BodyMetricDTO } from '@sintera/api-client'
import { VITAL_SIGNS, bodyMetricLabel, isVital, type VitalMetric } from '@sintera/core'
import { Text, Button, Input, Disclaimer } from '../../primitives'
import { useTheme } from '../../theme'
import { apiClient } from '../../../infrastructure/apiClient'

function parseNum(v: string): number { return Number(String(v).replace(',', '.').replace(/[^\d.-]/g, '')) }
function fmt(d: string): string { const [y, m, dd] = (d || '').slice(0, 10).split('-'); return y ? `${dd}/${m}/${y}` : '—' }
function today(): string { return new Date().toISOString().slice(0, 10) }
const unitOf = (m: VitalMetric) => VITAL_SIGNS.find(v => v.value === m)?.unit ?? ''

export function MonitoramentoScreen() {
  const t = useTheme()
  const insets = useSafeAreaInsets()
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
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback((silent: boolean) => {
    if (silent) setRefreshing(true); else setPhase('loading')
    apiClient.body.listBodyMetrics()
      .then((ms) => { if (!alive.current) return; setItems(ms.filter(m => isVital(m.metric))); setPhase('ready'); setError(null) })
      .catch((e) => { if (alive.current && !silent) { setError(e instanceof Error ? e.message : 'Não foi possível carregar.'); setPhase('error') } })
      .finally(() => { if (alive.current) setRefreshing(false) })
  }, [])
  useEffect(() => { alive.current = true; load(false); return () => { alive.current = false } }, [load])

  const groups = useMemo(() => VITAL_SIGNS.map(v => ({ v, list: items.filter(i => i.metric === v.value) })).filter(g => g.list.length > 0), [items])

  function startNew() { setMetric('pressao_arterial'); setLabel(''); setValue(''); setUnit('mmHg'); setDate(today()); setNotes(''); setOpen(true) }
  function chooseMetric(m: VitalMetric) { setMetric(m); setUnit(unitOf(m)) }
  async function save() {
    if (!value.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { Alert.alert('Campos obrigatórios', 'Informe valor e data (AAAA-MM-DD).'); return }
    setSaving(true)
    try {
      const { error: err } = await apiClient.body.saveBodyMetric({
        metric, label: metric === 'outro_sinal' ? (label.trim() || 'Sinal') : null,
        value_text: value, unit, measured_on: date, notes,
      })
      if (err) { Alert.alert('Não foi possível salvar', err.message || 'Tente novamente.'); return }
      setOpen(false); load(true)
    } finally { setSaving(false) }
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
        <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 22 }}>Monitoramento</Text>
        {!open ? <Button label="Adicionar" onPress={startNew} /> : null}
      </View>
      <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Acompanhe sinais vitais ao longo do tempo — pressão, frequência cardíaca, glicemia, saturação e outros. Registro manual; captura por dispositivo em breve.</Text>

      {open ? (
        <View style={[styles.card, card, { gap: 12 }]}>
          <Text spec={text(t, { role: 'bodyStrong' })}>Novo registro</Text>
          <Chips options={VITAL_SIGNS.map(v => ({ id: v.value, label: v.label }))} value={metric} onChange={(v) => chooseMetric(v as VitalMetric)} />
          {metric === 'outro_sinal' ? <Input value={label} onChangeText={setLabel} placeholder="Nome do sinal (ex.: Saturação em exercício)" /> : null}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Input value={value} onChangeText={setValue} placeholder={VITAL_SIGNS.find(v => v.value === metric)?.placeholder} style={{ flex: 2 }} />
            <Input value={unit} onChangeText={setUnit} placeholder="unidade" style={{ flex: 1 }} />
          </View>
          <Input value={date} onChangeText={setDate} placeholder="Data (AAAA-MM-DD)" />
          <Input value={notes} onChangeText={setNotes} placeholder="Observações…" multiline style={{ minHeight: 50, textAlignVertical: 'top' }} />
          <View style={styles.actions}>
            <Button label="Cancelar" variant="secondary" onPress={() => setOpen(false)} />
            <Button label="Salvar" onPress={save} loading={saving} loadingLabel="Salvando…" />
          </View>
        </View>
      ) : null}

      {groups.length === 0 && !open ? (
        <View style={[styles.card, card]}><Text spec={text(t, { role: 'body', tone: 'muted' })} style={{ textAlign: 'center' }}>Nenhum sinal vital ainda. Registre um em “Adicionar”.</Text></View>
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
                  <Pressable onPress={() => remove(i)}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.error.text }}>Remover</Text></Pressable>
                </View>
                <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{fmt(i.measured_on)}{i.notes ? ` · ${i.notes}` : ''}</Text>
              </View>
            ))}
          </View>
        )
      })}

      <Disclaimer variant="geral" />
    </ScrollView>
  )
}

function Chips({ options, value, onChange }: { options: readonly { id: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  const t = useTheme()
  return (
    <View style={styles.chips}>
      {options.map(o => {
        const on = value === o.id
        return <Pressable key={o.id} onPress={() => onChange(o.id)} style={[styles.chip, { borderColor: on ? t.color.identity.primary : t.color.border.default, backgroundColor: on ? t.color.badge.info.soft : 'transparent' }]}><Text spec={text(t, { role: 'caption', tone: on ? 'default' : 'muted' })}>{o.label}</Text></Pressable>
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  spark: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 36 },
})
