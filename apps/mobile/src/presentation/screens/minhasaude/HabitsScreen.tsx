// Hábitos (paridade Web /dashboard/habitos) — CRUD do estado permanente + meta divisível + LEMBRETE recorrente
// (Evento Assistencial vinculado 'habit', via infra única syncReminder). Reutiliza apiClient.habits + apiClient.agenda
// + taxonomia/regra do @sintera/core. FACTUAL (REG-001).
import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, View, ActivityIndicator, RefreshControl, Pressable, Alert, Linking, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { text } from '@sintera/design-system'
import type { HabitDTO, HabitInput } from '@sintera/api-client'
import {
  HABIT_CATEGORIES, habitGoalSummary, type HabitCategory,
  FREQUENCY_LABELS, type RecurrenceFrequency, selectByLink, parseRule, type HealthEvent,
} from '@sintera/core'
import { Text, Button, Input } from '../../primitives'
import { useTheme } from '../../theme'
import { apiClient } from '../../../infrastructure/apiClient'
import { documentPicker } from '../../../infrastructure/documentPickerAdapter'

export function HabitsScreen() {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const [items, setItems] = useState<HabitDTO[]>([])
  const [events, setEvents] = useState<HealthEvent[]>([])
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const alive = useRef(true)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<HabitDTO | null>(null)
  const [category, setCategory] = useState<HabitCategory>('atividade_fisica')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState('')
  const [goalAmount, setGoalAmount] = useState('')
  const [goalUnit, setGoalUnit] = useState('')
  const [goalDivisions, setGoalDivisions] = useState('')
  const [notes, setNotes] = useState('')
  const [reminderFreq, setReminderFreq] = useState<RecurrenceFrequency>('none')
  const [planUrl, setPlanUrl] = useState<string | null>(null)
  const [planName, setPlanName] = useState<string | null>(null)
  const [uploadingPlan, setUploadingPlan] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback((silent: boolean) => {
    if (silent) setRefreshing(true); else setPhase('loading')
    Promise.all([apiClient.habits.listHabits(), apiClient.agenda.listEvents()])
      .then(([hs, evs]) => { if (!alive.current) return; setItems(hs); setEvents(evs); setPhase('ready'); setError(null) })
      .catch((e) => { if (alive.current && !silent) { setError(e instanceof Error ? e.message : 'Não foi possível carregar.'); setPhase('error') } })
      .finally(() => { if (alive.current) setRefreshing(false) })
  }, [])
  useEffect(() => { alive.current = true; load(false); return () => { alive.current = false } }, [load])

  const reminderFreqFor = (habitId: string): RecurrenceFrequency => {
    const ev = selectByLink(events, 'habit', habitId)[0]
    return ev ? parseRule(ev.recurrenceRule).frequency : 'none'
  }

  function startNew() {
    setEditing(null); setCategory('atividade_fisica'); setDescription(''); setFrequency('')
    setGoalAmount(''); setGoalUnit(''); setGoalDivisions(''); setNotes(''); setReminderFreq('none')
    setPlanUrl(null); setPlanName(null); setOpen(true)
  }
  function startEdit(h: HabitDTO) {
    setEditing(h); setCategory(h.category); setDescription(h.description); setFrequency(h.frequency ?? '')
    setGoalAmount(h.goal_amount != null ? String(h.goal_amount) : ''); setGoalUnit(h.goal_unit ?? '')
    setGoalDivisions(h.goal_divisions != null ? String(h.goal_divisions) : ''); setNotes(h.notes ?? '')
    setReminderFreq(reminderFreqFor(h.id)); setPlanUrl(h.plan_url); setPlanName(h.plan_name); setOpen(true)
  }
  async function pickPlan() {
    setUploadingPlan(true)
    try {
      const file = await documentPicker.pickDocument()
      if (!file) return
      const { data, error: err } = await apiClient.exams.uploadExam({ uri: file.uri, mimeType: file.mimeType ?? 'application/octet-stream', sizeBytes: file.sizeBytes })
      if (!err && data) { setPlanUrl(data.url); setPlanName(file.name) }
    } finally { setUploadingPlan(false) }
  }

  async function save() {
    if (!description.trim()) { Alert.alert('Descrição obrigatória', 'Descreva o hábito.'); return }
    setSaving(true)
    try {
      const amount = goalAmount.trim() ? Number(goalAmount.replace(',', '.')) : null
      const div = goalDivisions.trim() ? Number(goalDivisions) : null
      const input: HabitInput = {
        id: editing?.id, category, description, frequency,
        goal_amount: amount != null && Number.isFinite(amount) ? amount : null,
        goal_unit: goalUnit, goal_divisions: div != null && Number.isFinite(div) && div > 0 ? div : null, notes,
        plan_url: planUrl, plan_name: planName,
      }
      const { data, error: err } = await apiClient.habits.saveHabit(input)
      if (err) { Alert.alert('Não foi possível salvar', err.message || 'Tente novamente.'); return }
      const habitId = data?.id
      if (habitId) {
        await apiClient.agenda.syncReminder({ type: 'habit', id: habitId }, {
          enabled: reminderFreq !== 'none', frequency: reminderFreq, title: `Hábito: ${description.trim()}`,
          notes: `Lembrete do hábito: ${description.trim()}`,
        })
      }
      setOpen(false); load(true)
    } finally { setSaving(false) }
  }
  function remove(h: HabitDTO) {
    Alert.alert('Excluir hábito', `Excluir "${h.description}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        await apiClient.agenda.syncReminder({ type: 'habit', id: h.id }, { enabled: false, frequency: 'none', title: '' })
        const { error: err } = await apiClient.habits.deleteHabit(h.id)
        if (err) { Alert.alert('Não foi possível excluir', 'Tente novamente.'); return }
        load(true)
      } },
    ])
  }

  if (phase === 'loading') {
    return <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}><ActivityIndicator color={t.color.identity.primary} /><Text spec={text(t, { role: 'body', tone: 'muted' })}>Carregando…</Text></View>
  }
  if (phase === 'error') {
    return <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}><Text spec={text(t, { role: 'body' })} style={{ color: t.color.badge.error.text, textAlign: 'center' }}>{error}</Text><Button label="Tentar novamente" variant="secondary" onPress={() => load(false)} /></View>
  }

  const card = { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }
  const freqOptions = (Object.keys(FREQUENCY_LABELS) as RecurrenceFrequency[]).map(f => ({ id: f, label: FREQUENCY_LABELS[f] }))

  return (
    <ScrollView style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[styles.content, { paddingTop: styles.content.padding + insets.top, paddingBottom: styles.content.padding + insets.bottom }]}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={t.color.identity.primary} />}>
      <View style={styles.headerRow}>
        <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 22 }}>Hábitos</Text>
        {!open ? <Button label="Adicionar" onPress={startNew} /> : null}
      </View>

      {open ? (
        <View style={[styles.card, card, { gap: 12 }]}>
          <Text spec={text(t, { role: 'bodyStrong' })}>{editing ? 'Editar hábito' : 'Novo hábito'}</Text>
          <Chips options={HABIT_CATEGORIES.map(c => ({ id: c.value, label: c.label }))} value={category} onChange={(v) => setCategory(v as HabitCategory)} />
          <Input value={description} onChangeText={setDescription} placeholder="Descrição (ex.: Caminhar 30 min)" />
          <Input value={frequency} onChangeText={setFrequency} placeholder="Frequência (ex.: 3x por semana)" />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Input value={goalAmount} onChangeText={setGoalAmount} placeholder="Meta (nº)" keyboardType="decimal-pad" style={{ flex: 1 }} />
            <Input value={goalUnit} onChangeText={setGoalUnit} placeholder="Unidade (ml)" style={{ flex: 1 }} />
            <Input value={goalDivisions} onChangeText={setGoalDivisions} placeholder="Partes" keyboardType="number-pad" style={{ flex: 1 }} />
          </View>
          <Input value={notes} onChangeText={setNotes} placeholder="Observações…" multiline style={{ minHeight: 60, textAlignVertical: 'top' }} />
          <Button label={planUrl ? `Plano anexado${planName ? `: ${planName}` : ''}` : 'Anexar plano (opcional)'} variant="secondary" onPress={pickPlan} loading={uploadingPlan} loadingLabel="Enviando…" />
          <Text spec={text(t, { role: 'label', tone: 'muted' })}>LEMBRETE</Text>
          <Chips options={freqOptions} value={reminderFreq} onChange={(v) => setReminderFreq(v as RecurrenceFrequency)} />
          <View style={styles.actions}>
            <Button label="Cancelar" variant="secondary" onPress={() => setOpen(false)} />
            <Button label="Salvar" onPress={save} loading={saving} loadingLabel="Salvando…" />
          </View>
        </View>
      ) : null}

      {items.length === 0 && !open ? (
        <View style={[styles.card, card]}><Text spec={text(t, { role: 'body', tone: 'muted' })} style={{ textAlign: 'center' }}>Nenhum hábito registrado. Toque em “Adicionar”.</Text></View>
      ) : null}

      {/* Agrupado por categoria (paridade Web) na ordem de HABIT_CATEGORIES, com cabeçalho + contagem. */}
      {HABIT_CATEGORIES.map(cat => {
        const group = items.filter(h => h.category === cat.value)
        if (group.length === 0) return null
        return (
          <View key={cat.value} style={{ gap: 8 }}>
            <Text spec={text(t, { role: 'label', tone: 'muted' })}>{cat.label.toUpperCase()} ({group.length})</Text>
            {group.map(h => (
              <View key={h.id} style={[styles.card, card, { gap: 4 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text spec={text(t, { role: 'body' })} style={{ flex: 1, paddingRight: 8 }}>{h.description}</Text>
                  <Pressable onPress={() => startEdit(h)}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>Editar</Text></Pressable>
                </View>
                <Text spec={text(t, { role: 'caption', tone: 'muted' })}>
                  {h.frequency ? h.frequency : 'Sem frequência definida'}{habitGoalSummary(h.goal_amount, h.goal_unit, h.goal_divisions) ? ` · ${habitGoalSummary(h.goal_amount, h.goal_unit, h.goal_divisions)}` : ''}
                </Text>
                {reminderFreqFor(h.id) !== 'none' ? <Text spec={text(t, { role: 'caption', tone: 'muted' })}>🔔 {FREQUENCY_LABELS[reminderFreqFor(h.id)]}</Text> : null}
                {h.plan_url ? (
                  <Pressable onPress={() => Linking.openURL(h.plan_url as string)}>
                    <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>{h.plan_name || 'Plano'} →</Text>
                  </Pressable>
                ) : null}
                {h.notes ? <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{h.notes}</Text> : null}
                <Pressable onPress={() => remove(h)} style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                  <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.error.text }}>Excluir</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )
      })}
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
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
})
