// Recursos de Saúde (paridade Web /dashboard/recursos) — CRUD + atributos por tipo (prescrição de correção
// visual OD/OE) + LEMBRETE de troca (Evento vinculado 'resource', via syncReminder). Reutiliza apiClient.resources
// + apiClient.agenda + taxonomia @sintera/core. FACTUAL (REG-001).
import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, View, ActivityIndicator, RefreshControl, Pressable, Alert, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { text } from '@sintera/design-system'
import type { ResourceDTO, ResourceInput } from '@sintera/api-client'
import {
  RESOURCE_TYPES, RESOURCE_STATUSES, resourceStatusLabel, visionSummary,
  type ResourceType, type ResourceStatus, type VisionKind,
  FREQUENCY_LABELS, type RecurrenceFrequency, selectByLink, parseRule, type HealthEvent,
  EXPENSE_DOC_TYPES, expenseDocLabel, parseAmountToCents, centsToAmount,
} from '@sintera/core'
import { Text, Button, Input, AttachmentLink } from '../../primitives'
import { useTheme } from '../../theme'
import { apiClient } from '../../../infrastructure/apiClient'
import { documentPicker } from '../../../infrastructure/documentPickerAdapter'

type Eye = { sph: string; cyl: string; axis: string; add: string }
const emptyEye = (): Eye => ({ sph: '', cyl: '', axis: '', add: '' })

export function ResourcesScreen() {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const [items, setItems] = useState<ResourceDTO[]>([])
  const [events, setEvents] = useState<HealthEvent[]>([])
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const alive = useRef(true)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ResourceDTO | null>(null)
  const [type, setType] = useState<ResourceType>('correcao_visual')
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [prescriber, setPrescriber] = useState('')
  const [startedOn, setStartedOn] = useState('')
  const [untilDate, setUntilDate] = useState('')
  const [status, setStatus] = useState<ResourceStatus>('em_uso')
  const [notes, setNotes] = useState('')
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [visionKind, setVisionKind] = useState<VisionKind>('oculos')
  const [od, setOd] = useState<Eye>(emptyEye())
  const [oe, setOe] = useState<Eye>(emptyEye())
  const [dnp, setDnp] = useState('')
  const [bc, setBc] = useState('')
  const [dia, setDia] = useState('')
  const [reminderFreq, setReminderFreq] = useState<RecurrenceFrequency>('none')
  const [expAmount, setExpAmount] = useState('')
  const [expDocType, setExpDocType] = useState('')
  const [expDocUrl, setExpDocUrl] = useState<string | null>(null)
  const [uploadingExp, setUploadingExp] = useState(false)
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState<'tipo' | 'situacao'>('tipo')

  const load = useCallback((silent: boolean) => {
    if (silent) setRefreshing(true); else setPhase('loading')
    Promise.all([apiClient.resources.listResources(), apiClient.agenda.listEvents()])
      .then(([rs, evs]) => { if (!alive.current) return; setItems(rs); setEvents(evs); setPhase('ready'); setError(null) })
      .catch((e) => { if (alive.current && !silent) { setError(e instanceof Error ? e.message : 'Não foi possível carregar.'); setPhase('error') } })
      .finally(() => { if (alive.current) setRefreshing(false) })
  }, [])
  useEffect(() => { alive.current = true; load(false); return () => { alive.current = false } }, [load])

  const reminderFreqFor = (id: string): RecurrenceFrequency => {
    const ev = selectByLink(events, 'resource', id).find(e => (e.amountCents ?? 0) === 0)
    return ev ? parseRule(ev.recurrenceRule).frequency : 'none'
  }
  // Despesa vinculada ao recurso (FB-004): o evento vinculado COM valor.
  const expenseFor = (id: string): HealthEvent | null => selectByLink(events, 'resource', id).find(e => (e.amountCents ?? 0) > 0) ?? null
  const eyeFrom = (o: unknown): Eye => {
    const r = (o ?? {}) as Record<string, string>
    return { sph: r.sph ?? '', cyl: r.cyl ?? '', axis: r.axis ?? '', add: r.add ?? '' }
  }

  function startNew() {
    setEditing(null); setType('correcao_visual'); setName(''); setBrand(''); setPrescriber(''); setStartedOn(''); setUntilDate('')
    setStatus('em_uso'); setNotes(''); setFileUrl(null); setVisionKind('oculos'); setOd(emptyEye()); setOe(emptyEye())
    setDnp(''); setBc(''); setDia(''); setReminderFreq('none')
    setExpAmount(''); setExpDocType(''); setExpDocUrl(null); setOpen(true)
  }
  function startEdit(r: ResourceDTO) {
    const exp = expenseFor(r.id)
    setExpAmount(exp?.amountCents ? centsToAmount(exp.amountCents) : ''); setExpDocType(exp?.expenseDocType ?? ''); setExpDocUrl(exp?.attachmentUrl ?? null)
    setEditing(r); setType(r.resource_type); setName(r.name); setBrand(r.brand ?? ''); setPrescriber(r.prescriber ?? '')
    setStartedOn(r.started_on ?? ''); setUntilDate(r.until_date ?? ''); setStatus(r.status); setNotes(r.notes ?? ''); setFileUrl(r.file_url)
    const a = r.attributes ?? {}
    setVisionKind(((a.vision_kind as VisionKind) ?? 'oculos'))
    setOd(eyeFrom(a.od)); setOe(eyeFrom(a.oe)); setDnp((a.dnp as string) ?? ''); setBc((a.bc as string) ?? ''); setDia((a.dia as string) ?? '')
    setReminderFreq(reminderFreqFor(r.id)); setOpen(true)
  }
  async function pickFile() {
    setUploading(true)
    try {
      const file = await documentPicker.pickDocument()
      if (!file) return
      const { data, error: err } = await apiClient.exams.uploadExam({ uri: file.uri, mimeType: file.mimeType ?? 'application/octet-stream', sizeBytes: file.sizeBytes })
      if (!err && data) setFileUrl(data.url)
    } finally { setUploading(false) }
  }

  async function pickExpDoc() {
    setUploadingExp(true)
    try {
      const file = await documentPicker.pickDocument()
      if (!file) return
      const { data, error: err } = await apiClient.exams.uploadExam({ uri: file.uri, mimeType: file.mimeType ?? 'application/octet-stream', sizeBytes: file.sizeBytes })
      if (!err && data) setExpDocUrl(data.url)
    } finally { setUploadingExp(false) }
  }

  function buildAttributes(): Record<string, unknown> {
    if (type !== 'correcao_visual') return editing?.attributes ?? {}
    const clean = (e: Eye) => Object.fromEntries(Object.entries({ sph: e.sph, cyl: e.cyl, axis: e.axis, add: e.add }).filter(([, v]) => v.trim()).map(([k, v]) => [k, v.trim()]))
    const attrs: Record<string, unknown> = { vision_kind: visionKind, od: clean(od), oe: clean(oe) }
    if (visionKind === 'oculos' && dnp.trim()) attrs.dnp = dnp.trim()
    if (visionKind === 'lentes_contato') { if (bc.trim()) attrs.bc = bc.trim(); if (dia.trim()) attrs.dia = dia.trim() }
    return attrs
  }

  async function save() {
    if (!name.trim()) { Alert.alert('Nome obrigatório', 'Informe o nome do recurso.'); return }
    setSaving(true)
    try {
      const input: ResourceInput = {
        id: editing?.id, resource_type: type, name, brand, prescriber, started_on: startedOn, until_date: untilDate,
        status, notes, file_url: fileUrl, attributes: buildAttributes(),
      }
      const { data, error: err } = await apiClient.resources.saveResource(input)
      if (err) { Alert.alert('Não foi possível salvar', err.message || 'Tente novamente.'); return }
      const id = data?.id
      if (id) {
        await apiClient.agenda.syncReminder({ type: 'resource', id }, { enabled: reminderFreq !== 'none', frequency: reminderFreq, title: `Trocar: ${name.trim()}`, notes: `Troca do recurso: ${name.trim()}`, date: untilDate || undefined })
        // Despesa vinculada (FB-004) → Gastos. Valor vazio remove.
        await apiClient.agenda.syncExpense({ type: 'resource', id }, { amountCents: parseAmountToCents(expAmount), docType: expDocType || null, docUrl: expDocUrl, title: `Compra: ${name.trim()}`, eventType: 'outro' })
      }
      setOpen(false); load(true)
    } finally { setSaving(false) }
  }
  function remove(r: ResourceDTO) {
    Alert.alert('Excluir recurso', `Excluir "${r.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        await apiClient.agenda.syncReminder({ type: 'resource', id: r.id }, { enabled: false, frequency: 'none', title: '' })
        const { error: err } = await apiClient.resources.deleteResource(r.id)
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
  const eyeRow = (label: string, e: Eye, set: (e: Eye) => void) => (
    <View style={{ gap: 4 }}>
      <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <Input value={e.sph} onChangeText={(v) => set({ ...e, sph: v })} placeholder="Esf" style={{ flex: 1 }} />
        <Input value={e.cyl} onChangeText={(v) => set({ ...e, cyl: v })} placeholder="Cil" style={{ flex: 1 }} />
        <Input value={e.axis} onChangeText={(v) => set({ ...e, axis: v })} placeholder="Eixo" style={{ flex: 1 }} />
        <Input value={e.add} onChangeText={(v) => set({ ...e, add: v })} placeholder="Adição" style={{ flex: 1 }} />
      </View>
    </View>
  )

  return (
    <ScrollView style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[styles.content, { paddingTop: styles.content.padding + insets.top, paddingBottom: styles.content.padding + insets.bottom }]}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={t.color.identity.primary} />}>
      <View style={styles.headerRow}>
        <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 22 }}>Recursos de Saúde</Text>
        {!open ? <Button label="Adicionar" onPress={startNew} /> : null}
      </View>

      {open ? (
        <View style={[styles.card, card, { gap: 12 }]}>
          <Text spec={text(t, { role: 'bodyStrong' })}>{editing ? 'Editar recurso' : 'Novo recurso'}</Text>
          <Chips options={RESOURCE_TYPES.map(r => ({ id: r.value, label: r.label }))} value={type} onChange={(v) => setType(v as ResourceType)} />
          <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Ex.: {RESOURCE_TYPES.find(r => r.value === type)?.hint}</Text>
          <Input value={name} onChangeText={setName} placeholder="Nome (ex.: Óculos de grau)" />
          <Input value={brand} onChangeText={setBrand} placeholder="Marca / fabricante" />
          <Input value={prescriber} onChangeText={setPrescriber} placeholder="Prescritor" />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Input value={startedOn} onChangeText={setStartedOn} placeholder="Início (AAAA-MM-DD)" style={{ flex: 1 }} />
            <Input value={untilDate} onChangeText={setUntilDate} placeholder="Validade (AAAA-MM-DD)" style={{ flex: 1 }} />
          </View>
          <Chips options={RESOURCE_STATUSES.map(r => ({ id: r.value, label: r.label }))} value={status} onChange={(v) => setStatus(v as ResourceStatus)} />

          {type === 'correcao_visual' ? (
            <View style={[styles.subCard, { borderColor: t.color.border.default }]}>
              <Text spec={text(t, { role: 'label', tone: 'muted' })}>PRESCRIÇÃO</Text>
              <Chips options={[{ id: 'oculos', label: 'Óculos' }, { id: 'lentes_contato', label: 'Lentes de contato' }]} value={visionKind} onChange={(v) => setVisionKind(v as VisionKind)} />
              {eyeRow('Olho direito (OD)', od, setOd)}
              {eyeRow('Olho esquerdo (OE)', oe, setOe)}
              {visionKind === 'oculos' ? <Input value={dnp} onChangeText={setDnp} placeholder="DNP" /> : (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Input value={bc} onChangeText={setBc} placeholder="Curva base (BC)" style={{ flex: 1 }} />
                  <Input value={dia} onChangeText={setDia} placeholder="Diâmetro (DIA)" style={{ flex: 1 }} />
                </View>
              )}
            </View>
          ) : null}

          <Input value={notes} onChangeText={setNotes} placeholder="Observações…" multiline style={{ minHeight: 60, textAlignVertical: 'top' }} />
          <Button label={fileUrl ? 'Anexo ✓ (trocar)' : 'Anexar documento (opcional)'} variant="secondary" onPress={pickFile} loading={uploading} loadingLabel="Enviando…" />

          <View style={[styles.subCard, { borderColor: t.color.border.default }]}>
            <Text spec={text(t, { role: 'label', tone: 'muted' })}>FINANCEIRO (aparece em Despesas)</Text>
            <Input value={expAmount} onChangeText={setExpAmount} placeholder="Valor pago (R$)" keyboardType="decimal-pad" />
            {expAmount.trim() ? (
              <>
                <Chips options={EXPENSE_DOC_TYPES.map(d => ({ id: d.id, label: d.label }))} value={expDocType} onChange={setExpDocType} />
                <Button label={expDocUrl ? 'NF/recibo ✓ (trocar)' : 'Anexar NF/recibo'} variant="secondary" onPress={pickExpDoc} loading={uploadingExp} loadingLabel="Enviando…" />
              </>
            ) : null}
          </View>

          <Text spec={text(t, { role: 'label', tone: 'muted' })}>LEMBRETE DE TROCA</Text>
          <Chips options={freqOptions} value={reminderFreq} onChange={(v) => setReminderFreq(v as RecurrenceFrequency)} />
          <View style={styles.actions}>
            <Button label="Cancelar" variant="secondary" onPress={() => setOpen(false)} />
            <Button label="Salvar" onPress={save} loading={saving} loadingLabel="Salvando…" />
          </View>
        </View>
      ) : null}

      {items.length === 0 && !open ? (
        <View style={[styles.card, card]}><Text spec={text(t, { role: 'body', tone: 'muted' })} style={{ textAlign: 'center' }}>Nenhum recurso registrado. Toque em “Adicionar”.</Text></View>
      ) : null}

      {/* Alternador de visão (paridade Web): Por tipo / Por situação. */}
      {items.length > 0 && !open ? (
        <View style={styles.chips}>
          {([['tipo', 'Por tipo'], ['situacao', 'Por situação']] as const).map(([v, label]) => {
            const on = view === v
            return (
              <Pressable key={v} onPress={() => setView(v)} style={[styles.chip, { borderColor: on ? t.color.identity.primary : t.color.border.default, backgroundColor: on ? t.color.badge.info.soft : 'transparent' }]}>
                <Text spec={text(t, { role: 'caption', tone: on ? 'default' : 'muted' })}>{label}</Text>
              </Pressable>
            )
          })}
        </View>
      ) : null}

      {/* Agrupado por tipo OU situação (paridade Web), com contagem. */}
      {(view === 'tipo'
        ? RESOURCE_TYPES.map(x => ({ key: x.label, items: items.filter(r => r.resource_type === x.value) }))
        : RESOURCE_STATUSES.map(x => ({ key: x.label, items: items.filter(r => r.status === x.value) }))
      ).map(grp => {
        const group = grp.items
        if (group.length === 0) return null
        return (
          <View key={grp.key} style={{ gap: 8 }}>
            <Text spec={text(t, { role: 'label', tone: 'muted' })}>{grp.key.toUpperCase()} ({group.length})</Text>
            {group.map(r => (
              <View key={r.id} style={[styles.card, card, { gap: 4 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text spec={text(t, { role: 'body' })} style={{ flex: 1, paddingRight: 8 }}>{r.name}</Text>
                  <Pressable onPress={() => startEdit(r)}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>Editar</Text></Pressable>
                </View>
                <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{resourceStatusLabel(r.status)}{r.brand ? ` · ${r.brand}` : ''}</Text>
                {r.resource_type === 'correcao_visual' && visionSummary(r.attributes) ? <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{visionSummary(r.attributes)}</Text> : null}
                {reminderFreqFor(r.id) !== 'none' ? <Text spec={text(t, { role: 'caption', tone: 'muted' })}>🔔 troca {FREQUENCY_LABELS[reminderFreqFor(r.id)]}</Text> : null}
                {expenseFor(r.id) ? <Text spec={text(t, { role: 'caption', tone: 'muted' })}>💰 {((expenseFor(r.id)?.amountCents ?? 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}{expenseDocLabel(expenseFor(r.id)?.expenseDocType) ? ` · ${expenseDocLabel(expenseFor(r.id)?.expenseDocType)}` : ''}</Text> : null}
                <AttachmentLink url={r.file_url} variant="inline" label="Documento" />
                <Pressable onPress={() => remove(r)} style={{ alignSelf: 'flex-start', marginTop: 4 }}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.error.text }}>Excluir</Text></Pressable>
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
  subCard: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
})
