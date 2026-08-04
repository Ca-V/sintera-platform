// Ciclo e Contracepção (paridade Web /dashboard/ciclo) — métodos contraceptivos (com lembrete de troca/recompra,
// mecanismo idêntico à Web via agenda_events) + ciclo menstrual (registro factual + média/previsão). Reutiliza
// apiClient.cycle + taxonomia/estatística do @sintera/core. FACTUAL (REG-001): organiza e lembra, não prescreve.
import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, View, ActivityIndicator, RefreshControl, Pressable, Alert, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { text } from '@sintera/design-system'
import type { ContraceptiveDTO, PeriodDTO } from '@sintera/api-client'
import {
  CONTRACEPTIVE_KINDS, contraceptiveLabel, contraceptiveNature, CONTRACEPTIVE_CADENCES, defaultCadenceFor,
  cadenceUsageLabel, cycleStats,
} from '@sintera/core'
import { Text, Button, Input, Switch } from '../../primitives'
import { useTheme } from '../../theme'
import { apiClient } from '../../../infrastructure/apiClient'

function fmt(d: string | null): string {
  if (!d) return '—'
  return new Date(`${d}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function CicloScreen() {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const [methods, setMethods] = useState<ContraceptiveDTO[]>([])
  const [periods, setPeriods] = useState<PeriodDTO[]>([])
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const alive = useRef(true)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ContraceptiveDTO | null>(null)
  const [kind, setKind] = useState('diu_hormonal')
  const [brand, setBrand] = useState('')
  const [startedOn, setStartedOn] = useState('')
  const [duration, setDuration] = useState('60')
  const [cadence, setCadence] = useState('')
  const [reminder, setReminder] = useState(true)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [periodDate, setPeriodDate] = useState('')
  const [savingPeriod, setSavingPeriod] = useState(false)

  const load = useCallback((silent: boolean) => {
    if (silent) setRefreshing(true); else setPhase('loading')
    Promise.all([apiClient.cycle.listContraceptives(), apiClient.cycle.listPeriods()])
      .then(([ms, ps]) => { if (!alive.current) return; setMethods(ms); setPeriods(ps); setPhase('ready'); setError(null) })
      .catch((e) => { if (alive.current && !silent) { setError(e instanceof Error ? e.message : 'Não foi possível carregar.'); setPhase('error') } })
      .finally(() => { if (alive.current) setRefreshing(false) })
  }, [])
  useEffect(() => { alive.current = true; load(false); return () => { alive.current = false } }, [load])

  function chooseKind(k: string) {
    setKind(k)
    if (contraceptiveNature(k) === 'hormonal') { setCadence(defaultCadenceFor(k) ?? 'mensal'); setDuration('') }
    else if (contraceptiveNature(k) === 'dispositivo') { const def = CONTRACEPTIVE_KINDS.find(x => x.value === k)?.months; setDuration(def != null ? String(def) : ''); setCadence('') }
    else { setDuration(''); setCadence('') }
  }
  function startNew() { setEditing(null); chooseKind('diu_hormonal'); setBrand(''); setStartedOn(''); setReminder(true); setNotes(''); setOpen(true) }
  function startEdit(m: ContraceptiveDTO) {
    setEditing(m); setKind(m.kind); setBrand(m.brand ?? ''); setStartedOn(m.started_on ?? '')
    setDuration(m.duration_months != null ? String(m.duration_months) : ''); setCadence(m.usage_cadence ?? '')
    setReminder(m.reminder_enabled); setNotes(m.notes ?? ''); setOpen(true)
  }

  async function save() {
    setSaving(true)
    try {
      const { error: err } = await apiClient.cycle.saveContraceptive({
        id: editing?.id, kind, brand, startedOn, durationMonths: duration, cadence, reminder, notes,
        reminderEventId: editing?.reminder_event_id,
      })
      if (err) { Alert.alert('Não foi possível salvar', err.message || 'Tente novamente.'); return }
      setOpen(false); load(true)
    } finally { setSaving(false) }
  }
  function toggle(m: ContraceptiveDTO) { apiClient.cycle.toggleContraceptiveStatus(m).then(() => load(true)) }
  function remove(m: ContraceptiveDTO) {
    Alert.alert('Remover método', `Remover "${contraceptiveLabel(m.kind)}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => { const { error: err } = await apiClient.cycle.deleteContraceptive(m); if (err) { Alert.alert('Erro', 'Tente novamente.'); return } load(true) } },
    ])
  }
  async function registerPeriod() {
    setSavingPeriod(true)
    try { const { error: err } = await apiClient.cycle.addPeriod(periodDate); if (!err) { setPeriodDate(''); load(true) } } finally { setSavingPeriod(false) }
  }
  function removePeriod(id: string) { apiClient.cycle.deletePeriod(id).then(() => load(true)) }

  if (phase === 'loading') {
    return <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}><ActivityIndicator color={t.color.identity.primary} /><Text spec={text(t, { role: 'body', tone: 'muted' })}>Carregando…</Text></View>
  }
  if (phase === 'error') {
    return <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}><Text spec={text(t, { role: 'body' })} style={{ color: t.color.badge.error.text, textAlign: 'center' }}>{error}</Text><Button label="Tentar novamente" variant="secondary" onPress={() => load(false)} /></View>
  }

  const card = { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }
  const nature = contraceptiveNature(kind)
  const active = methods.filter(m => m.status === 'ativo')
  const past = methods.filter(m => m.status !== 'ativo')
  const stats = cycleStats(periods.map(p => p.started_on))

  const methodCard = (m: ContraceptiveDTO) => (
    <View key={m.id} style={[styles.card, card, { gap: 4, opacity: m.status === 'ativo' ? 1 : 0.6 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text spec={text(t, { role: 'body' })} style={{ flex: 1, paddingRight: 8 }}>{contraceptiveLabel(m.kind)}{m.brand ? ` · ${m.brand}` : ''}</Text>
        <Pressable onPress={() => startEdit(m)}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>Editar</Text></Pressable>
      </View>
      {m.started_on ? <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Início: {fmt(m.started_on)}</Text> : null}
      {m.replace_on ? <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{contraceptiveNature(m.kind) === 'hormonal' ? 'Próxima recompra/aplicação' : 'Troca prevista'}: {fmt(m.replace_on)}</Text> : null}
      {cadenceUsageLabel(m.usage_cadence) ? <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{cadenceUsageLabel(m.usage_cadence)}</Text> : null}
      {m.reminder_enabled ? <Text spec={text(t, { role: 'caption', tone: 'muted' })}>🔔 lembrete ativo</Text> : null}
      {m.notes ? <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{m.notes}</Text> : null}
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
        <Pressable onPress={() => toggle(m)}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>{m.status === 'ativo' ? 'Encerrar' : 'Reativar'}</Text></Pressable>
        <Pressable onPress={() => remove(m)}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.error.text }}>Remover</Text></Pressable>
      </View>
    </View>
  )

  return (
    <ScrollView style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[styles.content, { paddingTop: styles.content.padding + insets.top, paddingBottom: styles.content.padding + insets.bottom }]}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={t.color.identity.primary} />}>
      <View style={styles.headerRow}>
        <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 22 }}>Ciclo e Contracepção</Text>
        {!open ? <Button label="Novo método" onPress={startNew} /> : null}
      </View>
      <Text spec={text(t, { role: 'caption', tone: 'faint' })}>A SINTERA organiza e lembra — não prescreve nem interpreta.</Text>

      {open ? (
        <View style={[styles.card, card, { gap: 12 }]}>
          <Text spec={text(t, { role: 'bodyStrong' })}>{editing ? 'Editar método' : 'Novo método contraceptivo'}</Text>
          <Chips options={CONTRACEPTIVE_KINDS.map(k => ({ id: k.value, label: k.label }))} value={kind} onChange={chooseKind} />
          <Input value={brand} onChangeText={setBrand} placeholder="Marca (ex.: Mirena)" />
          <Input value={startedOn} onChangeText={setStartedOn} placeholder="Início (AAAA-MM-DD)" />
          {nature === 'dispositivo' ? (
            <View>
              <Text spec={text(t, { role: 'label', tone: 'muted' })}>VIDA ÚTIL (MESES)</Text>
              <Input value={duration} onChangeText={setDuration} placeholder="60" keyboardType="number-pad" />
            </View>
          ) : nature === 'hormonal' ? (
            <View style={{ gap: 6 }}>
              <Text spec={text(t, { role: 'label', tone: 'muted' })}>CADÊNCIA DE RECOMPRA/APLICAÇÃO</Text>
              <Chips options={CONTRACEPTIVE_CADENCES.map(c => ({ id: c.value, label: c.label }))} value={cadence} onChange={setCadence} />
            </View>
          ) : null}
          <Input value={notes} onChangeText={setNotes} placeholder="Observações…" multiline style={{ minHeight: 60, textAlignVertical: 'top' }} />
          <View style={styles.switchRow}><Text spec={text(t, { role: 'body' })}>Lembrete de troca/recompra</Text><Switch value={reminder} onValueChange={setReminder} /></View>
          <View style={styles.actions}>
            <Button label="Cancelar" variant="secondary" onPress={() => setOpen(false)} />
            <Button label="Salvar" onPress={save} loading={saving} loadingLabel="Salvando…" />
          </View>
        </View>
      ) : null}

      {active.length > 0 ? <><Text spec={text(t, { role: 'label', tone: 'muted' })}>MÉTODOS ATIVOS</Text>{active.map(methodCard)}</> : null}
      {past.length > 0 ? <><Text spec={text(t, { role: 'label', tone: 'muted' })}>ENCERRADOS</Text>{past.map(methodCard)}</> : null}
      {methods.length === 0 && !open ? <View style={[styles.card, card]}><Text spec={text(t, { role: 'body', tone: 'muted' })} style={{ textAlign: 'center' }}>Nenhum método registrado.</Text></View> : null}

      {/* ── Ciclo menstrual ── */}
      <View style={[styles.card, card, { gap: 10, marginTop: 6 }]}>
        <Text spec={text(t, { role: 'bodyStrong' })}>Ciclo menstrual</Text>
        {stats.avg != null ? (
          <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Duração média: ~{stats.avg} dias · próxima prevista por volta de {fmt(stats.next)}</Text>
        ) : (
          <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Registre ao menos 2 datas para ver a média e a previsão.</Text>
        )}
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Input value={periodDate} onChangeText={setPeriodDate} placeholder="Início (AAAA-MM-DD) — vazio = hoje" style={{ flex: 1 }} />
          <Button label="Registrar" onPress={registerPeriod} loading={savingPeriod} loadingLabel="…" />
        </View>
        {periods.map(p => (
          <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{fmt(p.started_on)}</Text>
            <Pressable onPress={() => removePeriod(p.id)}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.error.text }}>Excluir</Text></Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

function Chips({ options, value, onChange }: { options: readonly { id: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  const t = useTheme()
  return (
    <View style={styles.chips}>
      {options.map(o => {
        const on = value === o.id
        return (
          <Pressable key={o.id} onPress={() => onChange(o.id)} style={[styles.chip, { borderColor: on ? t.color.identity.primary : t.color.border.default, backgroundColor: on ? t.color.badge.info.soft : 'transparent' }]}>
            <Text spec={text(t, { role: 'caption', tone: on ? 'default' : 'muted' })}>{o.label}</Text>
          </Pressable>
        )
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
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
})
