// Medicamentos / Suplementos (paridade Web /dashboard/medicamentos e /suplementos — MESMA tabela `medications`,
// `kind='suplemento'` para Suplementos). CRUD clínico + estoque + compra + LEMBRETE de recompra (Evento vinculado
// 'medication', via syncReminder). Reutiliza apiClient.medications + apiClient.agenda + taxonomia @sintera/core.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ScrollView, View, ActivityIndicator, RefreshControl, Pressable, Alert, StyleSheet } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { text } from '@sintera/design-system'
import type { MedicationDTO, MedicationInput, ContraceptiveDTO } from '@sintera/api-client'
import {
  MED_KINDS, MED_STATUSES, MED_FORMS, MED_ROUTES, medKindLabel, medFormLabel, medFormUnit,
  estimatedRunoutDays, parseAmountToCents, centsToAmount,
  type MedKind, type MedStatus, MED_REPURCHASE_FREQUENCIES, repurchaseFreqToRecurrence,
  isHormonalContraceptive, contraceptiveLabel, contraceptiveCategoryLabel, cadenceUsageLabel,
} from '@sintera/core'
import { Text, Button, Input, DatePicker, Disclaimer, AttachmentLink } from '../../primitives'
import { useAssistedCapture } from '../capture/useAssistedCapture'
import { useTheme } from '../../theme'
import type { MinhaSaudeStackParamList } from '../../navigation/types'
import { apiClient } from '../../../infrastructure/apiClient'
import { documentPicker } from '../../../infrastructure/documentPickerAdapter'

type Props = NativeStackScreenProps<MinhaSaudeStackParamList, 'Medications'>

export function MedicationsScreen({ route, navigation }: Props) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const supplements = route.params?.supplements ?? false
  const title = supplements ? 'Suplementos' : 'Medicamentos'
  useLayoutEffect(() => { navigation.setOptions({ title }) }, [navigation, title])

  const [items, setItems] = useState<MedicationDTO[]>([])
  const [contraceptives, setContraceptives] = useState<ContraceptiveDTO[]>([])
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const alive = useRef(true)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<MedicationDTO | null>(null)
  const [name, setName] = useState('')
  const [kind, setKind] = useState<MedKind>(supplements ? 'suplemento' : 'medicamento')
  const [brand, setBrand] = useState('')
  const [dose, setDose] = useState('')
  const [frequency, setFrequency] = useState('')
  const [form, setForm] = useState('')
  const [adminRoute, setAdminRoute] = useState('')
  const [prescriber, setPrescriber] = useState('')
  const [status, setStatus] = useState<MedStatus>('em_uso')
  const [startedOn, setStartedOn] = useState('')
  const [untilDate, setUntilDate] = useState('')
  const [notes, setNotes] = useState('')
  const [acquiredQty, setAcquiredQty] = useState('')
  const [dailyCons, setDailyCons] = useState('')
  const [purchasedOn, setPurchasedOn] = useState('')
  const [amount, setAmount] = useState('')
  const [purchaseStatus, setPurchaseStatus] = useState('')
  const [packQtyInput, setPackQtyInput] = useState('')
  const [repurchaseFreq, setRepurchaseFreq] = useState('') // valor PT ('' = não repetir)
  const [prescriptionUrl, setPrescriptionUrl] = useState<string | null>(null) // D-13: receita anexada
  const [uploadingRx, setUploadingRx] = useState(false)
  const [saving, setSaving] = useState(false)
  const capture = useAssistedCapture() // T1: lê receita/rótulo e propõe o preenchimento (revisão → salvar)
  const [view, setView] = useState<'situacao' | 'tipo'>('situacao')

  const load = useCallback((silent: boolean) => {
    if (silent) setRefreshing(true); else setPhase('loading')
    // Medicamentos projeta (read-only) os contraceptivos HORMONAIS do Ciclo (CTC-001: o fato pertence ao Ciclo).
    Promise.all([apiClient.medications.listMedications(), supplements ? Promise.resolve([]) : apiClient.cycle.listContraceptives()])
      .then(([ms, cs]) => { if (!alive.current) return; setItems(ms); setContraceptives(cs); setPhase('ready'); setError(null) })
      .catch((e) => { if (alive.current && !silent) { setError(e instanceof Error ? e.message : 'Não foi possível carregar.'); setPhase('error') } })
      .finally(() => { if (alive.current) setRefreshing(false) })
  }, [supplements])
  useEffect(() => { alive.current = true; load(false); return () => { alive.current = false } }, [load])

  const shown = items.filter(m => supplements ? m.kind === 'suplemento' : m.kind !== 'suplemento')
  const repurchaseLabel = (v: string | null): string | null => MED_REPURCHASE_FREQUENCIES.find(m => m.value === (v ?? ''))?.label ?? null
  const num = (s: string): number | null => { const n = Number(s.replace(',', '.')); return s.trim() && Number.isFinite(n) ? n : null }

  function startNew() {
    setEditing(null); setName(''); setKind(supplements ? 'suplemento' : 'medicamento'); setBrand(''); setDose(''); setFrequency('')
    setForm(''); setAdminRoute(''); setPrescriber(''); setStatus('em_uso'); setStartedOn(''); setUntilDate(''); setNotes('')
    setAcquiredQty(''); setPackQtyInput(''); setDailyCons(''); setPurchasedOn(''); setAmount(''); setPurchaseStatus(''); setRepurchaseFreq(''); setPrescriptionUrl(null); setOpen(true)
  }
  // D-13: anexa a RECEITA (documento separado do produto) — mesmo fluxo dos outros anexos.
  async function pickPrescription() {
    setUploadingRx(true)
    try {
      const file = await documentPicker.pickDocument()
      if (!file) return
      const { data, error: err } = await apiClient.exams.uploadExam({ uri: file.uri, mimeType: file.mimeType ?? 'application/octet-stream', sizeBytes: file.sizeBytes })
      if (!err && data) setPrescriptionUrl(data.url)
    } finally { setUploadingRx(false) }
  }
  function startEdit(m: MedicationDTO) {
    setEditing(m); setName(m.name); setKind(m.kind); setBrand(m.brand ?? ''); setDose(m.dose ?? ''); setFrequency(m.frequency ?? '')
    setForm(m.pharmaceutical_form ?? ''); setAdminRoute(m.administration_route ?? ''); setPrescriber(m.prescriber_name ?? '')
    setStatus(m.status); setStartedOn(m.started_on ?? ''); setUntilDate(m.until_date ?? ''); setNotes(m.notes ?? '')
    setAcquiredQty(m.acquired_quantity != null ? String(m.acquired_quantity) : ''); setPackQtyInput(m.pack_quantity != null ? String(m.pack_quantity) : '')
    setDailyCons(m.daily_consumption != null ? String(m.daily_consumption) : ''); setPurchasedOn(m.purchased_on ?? '')
    setAmount(m.amount_cents ? centsToAmount(m.amount_cents) : ''); setPurchaseStatus(m.purchase_status ?? ''); setRepurchaseFreq(m.repurchase_frequency ?? ''); setPrescriptionUrl(m.prescription_url); setOpen(true)
  }

  async function save() {
    if (!name.trim()) { Alert.alert('Nome obrigatório', 'Informe o nome.'); return }
    // Regra de negócio (paridade Web): medicamento/suplemento exige forma farmacêutica.
    if ((kind === 'medicamento' || kind === 'suplemento') && !form) { Alert.alert('Forma obrigatória', 'Selecione a forma farmacêutica.'); return }
    setSaving(true)
    try {
      const wantsReminder = !!repurchaseFreq
      const input: MedicationInput = {
        id: editing?.id, name, kind, status, brand, dose, frequency,
        pharmaceutical_form: form || null, administration_route: adminRoute || null, prescriber_name: prescriber,
        started_on: startedOn, until_date: untilDate, notes,
        acquired_quantity: num(acquiredQty), pack_quantity: num(packQtyInput), daily_consumption: num(dailyCons),
        pack_unit: medFormUnit(form) || null, purchased_on: purchasedOn, amount_cents: parseAmountToCents(amount),
        purchase_status: purchaseStatus || null,
        repurchase_reminder: wantsReminder, repurchase_frequency: repurchaseFreq || null,
        prescription_url: prescriptionUrl,
      }
      const { data, error: err } = await apiClient.medications.saveMedication(input)
      if (err) { Alert.alert('Não foi possível salvar', err.message || 'Tente novamente.'); return }
      const id = data?.id
      if (id) {
        // Lembrete ativo só quando "em uso" (mesma regra da Web). Frequência do Evento derivada do vocabulário PT.
        await apiClient.agenda.syncReminder({ type: 'medication', id }, {
          enabled: wantsReminder && status === 'em_uso', frequency: repurchaseFreqToRecurrence(repurchaseFreq),
          title: `Recomprar: ${name.trim()}`, notes: `Recompra de ${name.trim()}`,
        })
        // Compra realizada → despesa em Gastos (só quando 'comprado' com valor; 'a comprar' não gera gasto).
        await apiClient.agenda.syncExpense({ type: 'medication', id }, {
          amountCents: purchaseStatus === 'comprado' ? parseAmountToCents(amount) : null,
          title: `Compra: ${name.trim()}`, date: purchasedOn || undefined, eventType: 'outro',
        })
      }
      setOpen(false); load(true)
    } finally { setSaving(false) }
  }
  function remove(m: MedicationDTO) {
    Alert.alert('Excluir', `Excluir "${m.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        await apiClient.agenda.syncReminder({ type: 'medication', id: m.id }, { enabled: false, frequency: 'none', title: '' })
        const { error: err } = await apiClient.medications.deleteMedication(m.id)
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
  const repurchaseOptions = [{ id: '', label: 'Não repetir' }, ...MED_REPURCHASE_FREQUENCIES.map(m => ({ id: m.value, label: m.label }))]

  return (
    <ScrollView style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[styles.content, { paddingTop: styles.content.padding + insets.top, paddingBottom: styles.content.padding + insets.bottom }]}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={t.color.identity.primary} />}>
      <View style={styles.headerRow}>
        <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 22 }}>{title}</Text>
        {!open ? <Button label="Adicionar" onPress={startNew} /> : null}
      </View>

      {open ? (
        <View style={[styles.card, card, { gap: 12 }]}>
          <Text spec={text(t, { role: 'bodyStrong' })}>{editing ? 'Editar' : `Novo ${supplements ? 'suplemento' : 'medicamento'}`}</Text>
          <Button label="Preencher a partir de um documento" variant="secondary" loading={capture.busy} loadingLabel="Lendo…"
            onPress={async () => {
              const items = await capture.run((input) => apiClient.vision.scanMedications(input))
              if (!items || items.length === 0) return
              const m = items[0]
              setName(m.name)
              if (m.dose) setDose(m.dose)
              if (m.frequency) setFrequency(m.frequency)
              if (m.form) setForm(m.form)
              if (m.route) setAdminRoute(m.route)
              if (m.prescriber) setPrescriber(m.prescriber)
              if (m.startedOn) setStartedOn(m.startedOn)
            }} />
          <Input value={name} onChangeText={setName} placeholder="Nome" />
          <Chips options={MED_KINDS.map(k => ({ id: k.value, label: k.label }))} value={kind} onChange={(v) => setKind(v as MedKind)} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Input value={brand} onChangeText={setBrand} placeholder="Marca" style={{ flex: 1 }} />
            <Input value={dose} onChangeText={setDose} placeholder="Dose (ex.: 50 mg)" style={{ flex: 1 }} />
          </View>
          <Input value={frequency} onChangeText={setFrequency} placeholder="Frequência (ex.: 1x ao dia)" />
          <Text spec={text(t, { role: 'label', tone: 'muted' })}>FORMA FARMACÊUTICA</Text>
          <Chips options={MED_FORMS.map(f => ({ id: f.value, label: f.label }))} value={form} onChange={setForm} />
          <Text spec={text(t, { role: 'label', tone: 'muted' })}>VIA</Text>
          <Chips options={MED_ROUTES.map(r => ({ id: r, label: r }))} value={adminRoute} onChange={setAdminRoute} />
          <Input value={prescriber} onChangeText={setPrescriber} placeholder="Prescritor" />
          {/* D-13: receita anexada (documento separado do produto). */}
          <Text spec={text(t, { role: 'label', tone: 'muted' })}>RECEITA</Text>
          {prescriptionUrl ? <AttachmentLink url={prescriptionUrl} label="Ver receita anexada" /> : null}
          <Button label={uploadingRx ? 'Anexando…' : prescriptionUrl ? 'Trocar receita' : 'Anexar receita'} variant="secondary" onPress={pickPrescription} loading={uploadingRx} />
          <Chips options={MED_STATUSES.map(s => ({ id: s.value, label: s.label }))} value={status} onChange={(v) => setStatus(v as MedStatus)} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <DatePicker value={startedOn} onChange={setStartedOn} placeholder="Início" style={{ flex: 1 }} />
            <DatePicker value={untilDate} onChange={setUntilDate} placeholder="Até" style={{ flex: 1 }} />
          </View>

          <View style={[styles.subCard, { borderColor: t.color.border.default }]}>
            <Text spec={text(t, { role: 'label', tone: 'muted' })}>ESTOQUE E COMPRA</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Input value={acquiredQty} onChangeText={setAcquiredQty} placeholder="Qtde (embalagens)" keyboardType="decimal-pad" style={{ flex: 1 }} />
              <Input value={packQtyInput} onChangeText={setPackQtyInput} placeholder={`Conteúdo (${medFormUnit(form) || 'un'}/emb.)`} keyboardType="decimal-pad" style={{ flex: 1 }} />
              <Input value={dailyCons} onChangeText={setDailyCons} placeholder="Consumo/dia" keyboardType="decimal-pad" style={{ flex: 1 }} />
            </View>
            {(() => {
              const total = (num(acquiredQty) ?? 0) * (num(packQtyInput) ?? 1) || num(acquiredQty)
              const days = estimatedRunoutDays(total, num(dailyCons))
              if (days == null) return null
              const base = purchasedOn || startedOn || new Date().toISOString().slice(0, 10)
              const d = new Date(`${base}T00:00:00`); d.setDate(d.getDate() + days)
              const dateStr = /^\d{4}-\d{2}-\d{2}$/.test(base) ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : null
              return <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Estimativa: ~{days} dias de estoque{dateStr ? ` · acaba por volta de ${dateStr}` : ''}</Text>
            })()}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <DatePicker value={purchasedOn} onChange={setPurchasedOn} placeholder="Compra" style={{ flex: 1 }} />
              <Input value={amount} onChangeText={setAmount} placeholder="Valor (R$)" keyboardType="decimal-pad" style={{ flex: 1 }} />
            </View>
            <Chips options={[{ id: 'a_comprar', label: 'A comprar' }, { id: 'comprado', label: 'Comprado' }]} value={purchaseStatus} onChange={setPurchaseStatus} />
            {purchaseStatus === 'comprado' && amount.trim() ? <Text spec={text(t, { role: 'caption', tone: 'faint' })}>O valor pago aparece em Despesas.</Text> : null}
          </View>

          <Input value={notes} onChangeText={setNotes} placeholder="Observações…" multiline style={{ minHeight: 60, textAlignVertical: 'top' }} />
          <Text spec={text(t, { role: 'label', tone: 'muted' })}>LEMBRETE DE RECOMPRA</Text>
          <Chips options={repurchaseOptions} value={repurchaseFreq} onChange={setRepurchaseFreq} />
          {repurchaseFreq && status !== 'em_uso' ? <Text spec={text(t, { role: 'caption', tone: 'faint' })}>O lembrete só fica ativo com o status “Em uso”.</Text> : null}
          <View style={styles.actions}>
            <Button label="Cancelar" variant="secondary" onPress={() => setOpen(false)} />
            <Button label="Salvar" onPress={save} loading={saving} loadingLabel="Salvando…" />
          </View>
        </View>
      ) : null}

      {shown.length === 0 && !open ? (
        <View style={[styles.card, card]}><Text spec={text(t, { role: 'body', tone: 'muted' })} style={{ textAlign: 'center' }}>Nenhum registro. Toque em “Adicionar”.</Text></View>
      ) : null}

      {/* Alternador de visão (paridade Web): Por situação / Por tipo. */}
      {shown.length > 0 && !open ? (
        <View style={styles.chips}>
          {([['situacao', 'Por situação'], ['tipo', 'Por tipo']] as const).map(([v, label]) => {
            const on = view === v
            return (
              <Pressable key={v} onPress={() => setView(v)} style={[styles.chip, { borderColor: on ? t.color.identity.primary : t.color.border.default, backgroundColor: on ? t.color.badge.info.soft : 'transparent' }]}>
                <Text spec={text(t, { role: 'caption', tone: on ? 'default' : 'muted' })}>{label}</Text>
              </Pressable>
            )
          })}
        </View>
      ) : null}

      {/* Agrupado por situação OU tipo (paridade Web), com contagem; esmaece suspenso/encerrado na visão situação. */}
      {(view === 'situacao'
        ? MED_STATUSES.map(x => ({ key: x.label, dim: x.value === 'suspenso' || x.value === 'encerrado', items: shown.filter(m => m.status === x.value) }))
        : MED_KINDS.map(x => ({ key: x.label, dim: false, items: shown.filter(m => m.kind === x.value) }))
      ).map(grp => {
        const group = grp.items
        if (group.length === 0) return null
        const dim = grp.dim
        return (
          <View key={grp.key} style={{ gap: 8 }}>
            <Text spec={text(t, { role: 'label', tone: 'muted' })}>{grp.key.toUpperCase()} ({group.length})</Text>
            {group.map(m => (
              <View key={m.id} style={[styles.card, card, { gap: 4, opacity: dim ? 0.6 : 1 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text spec={text(t, { role: 'body' })} style={{ flex: 1, paddingRight: 8 }}>{m.name}</Text>
                  <Pressable onPress={() => startEdit(m)}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>Editar</Text></Pressable>
                </View>
                <Text spec={text(t, { role: 'caption', tone: 'muted' })}>
                  {medKindLabel(m.kind)}{m.dose ? ` · ${m.dose}` : ''}{m.frequency ? ` · ${m.frequency}` : ''}{medFormLabel(m.pharmaceutical_form) ? ` · ${medFormLabel(m.pharmaceutical_form)}` : ''}
                </Text>
                {m.purchase_status === 'a_comprar' ? <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.attention.text }}>A comprar</Text> : null}
                {repurchaseLabel(m.repurchase_frequency) ? <Text spec={text(t, { role: 'caption', tone: 'muted' })}>🔔 recompra {repurchaseLabel(m.repurchase_frequency)}</Text> : null}
                {m.prescription_url ? <Text spec={text(t, { role: 'caption', tone: 'muted' })}>📎 Receita anexada</Text> : null}
                {m.notes ? <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{m.notes}</Text> : null}
                <Pressable onPress={() => remove(m)} style={{ alignSelf: 'flex-start', marginTop: 4 }}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.error.text }}>Excluir</Text></Pressable>
              </View>
            ))}
          </View>
        )
      })}

      {/* Projeção read-only dos contraceptivos HORMONAIS (CTC-001): o fato pertence ao Ciclo; aqui só referência. */}
      {!supplements && contraceptives.some(c => isHormonalContraceptive(c.kind) && c.status === 'ativo') ? (
        <View style={{ gap: 8 }}>
          <Text spec={text(t, { role: 'label', tone: 'muted' })}>CONTRACEPÇÃO (GERENCIADO NO CICLO)</Text>
          {contraceptives.filter(c => isHormonalContraceptive(c.kind) && c.status === 'ativo').map(c => (
            <Pressable key={c.id} onPress={() => navigation.navigate('Ciclo')} style={[styles.card, card, { gap: 4, opacity: 0.85 }]}>
              <Text spec={text(t, { role: 'body' })}>{contraceptiveLabel(c.kind)}{c.brand ? ` · ${c.brand}` : ''}</Text>
              <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{contraceptiveCategoryLabel(c.kind)}{cadenceUsageLabel(c.usage_cadence) ? ` · ${cadenceUsageLabel(c.usage_cadence)}` : ''}</Text>
              <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>Gerenciar no Ciclo →</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <Disclaimer variant="medicamento" />
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
