// Formulário de EVENTO (criar/editar) — paridade com o AgendarModal da Web. Captura os campos e MAPEIA para o
// rascunho de domínio (EventDraft), persistindo via `apiClient.agenda.saveEvent` (upsert canônico). Regras puras
// (tipos/status/prioridade/recorrência/valor) vêm do @sintera/core. Excluir via `deleteEvent`.
import { useState } from 'react'
import { ScrollView, View, Pressable, Alert, Linking, StyleSheet } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { text } from '@sintera/design-system'
import type { EventDraft } from '@sintera/api-client'
import {
  EVENT_TYPE_DEFS, EVENT_STATUS_UI, PROFESSIONAL_KIND_DEFS, EXPENSE_DOC_TYPES,
  serializeRule, parseRule, parseAmountToCents, centsToAmount, googleCalendarUrl,
  CADENCE_PRESETS, cadenceIdFor, cadenceById, eventPriorityOptions, eventModalityOptions, type EventStatus,
} from '@sintera/core'
import { Text, Button, Input, Switch, DatePicker, Select } from '../../primitives'
import { useTheme } from '../../theme'
import type { AgendaStackParamList } from '../../navigation/types'
import { apiClient } from '../../../infrastructure/apiClient'
import { documentPicker } from '../../../infrastructure/documentPickerAdapter'

type Props = NativeStackScreenProps<AgendaStackParamList, 'EventForm'>

// Catálogos do core — rótulos e ordem são os MESMOS da Web (base única). O Chips pede {id,label}; o mapeamento
// abaixo é adaptação de MECANISMO, não uma segunda decisão sobre quais opções existem.
const MODALITIES = eventModalityOptions().map(o => ({ id: o.value, label: o.label }))
const PRIORITIES = eventPriorityOptions().map(o => ({ id: o.value, label: o.label }))

export function EventFormScreen({ route, navigation }: Props) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const ev = route.params?.event ?? null
  const prefill = route.params?.prefill ?? null
  const editing = !!ev
  const rec = parseRule(ev?.recurrenceRule)

  // Cirurgia é subtipo de Procedimento (event_type 'cirurgia'): no form aparece como Procedimento + flag.
  const [type, setType] = useState(ev?.type === 'cirurgia' ? 'procedimento' : (ev?.type ?? prefill?.type ?? 'consulta'))
  const [isSurgery, setIsSurgery] = useState(ev?.type === 'cirurgia')
  const [title, setTitle] = useState(ev?.title ?? prefill?.title ?? '')
  const [date, setDate] = useState(ev?.date ?? prefill?.date ?? new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState(ev?.time ?? '')
  const [status, setStatus] = useState<EventStatus>(ev?.status ?? 'planejado')
  const [isReturn, setIsReturn] = useState(ev?.isReturn ?? false)
  const [profKind, setProfKind] = useState(ev?.professionalKind ?? '')
  const [profName, setProfName] = useState(ev?.professionalName ?? '')
  const [establishment, setEstablishment] = useState(ev?.establishment ?? '')
  const [location, setLocation] = useState(ev?.location ?? '')
  const [modality, setModality] = useState(ev?.modality ?? '')
  const [preparation, setPreparation] = useState(ev?.preparation ?? '')
  const [notes, setNotes] = useState(ev?.notes ?? '')
  const [amount, setAmount] = useState(ev?.amountCents ? centsToAmount(ev.amountCents) : '')
  const [docType, setDocType] = useState(ev?.expenseDocType ?? '')
  const [directExpense, setDirectExpense] = useState(ev?.directExpense ?? false)
  const [cadence, setCadence] = useState<string>(prefill?.recurrence ? 'monthly' : cadenceIdFor(rec.frequency, rec.interval))
  const [until, setUntil] = useState(rec.until ?? '')
  const [priority, setPriority] = useState(ev?.priority ?? '')
  const [reminder, setReminder] = useState(ev?.reminderEnabled ?? true)
  const [outcome, setOutcome] = useState(ev?.outcome?.summary ?? '')
  const [docUrl, setDocUrl] = useState<string | null>(ev?.attachmentUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const isPlano = type === 'plano'

  async function pickDoc() {
    setUploading(true)
    try {
      const file = await documentPicker.pickDocument()
      if (!file) return
      const { data, error } = await apiClient.exams.uploadExam({ uri: file.uri, mimeType: file.mimeType ?? 'application/octet-stream', sizeBytes: file.sizeBytes })
      if (!error && data) setDocUrl(data.url)
    } finally { setUploading(false) }
  }

  async function save() {
    if (!title.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('Campos obrigatórios', 'Informe um título e uma data válida (AAAA-MM-DD).')
      return
    }
    setSaving(true)
    try {
      // Regra de negócio (paridade Web/serviço): nascer/virar "realizado" carimba completed_at (entra no
      // Histórico/Gastos); sair de realizado limpa. completed_at é MARCADOR (as projeções usam o status).
      const completedAt = status === 'realizado' ? (ev?.completedAt ?? new Date().toISOString()) : null
      const draft: EventDraft = {
        ...(ev ?? {}),
        type: type === 'procedimento' && isSurgery ? 'cirurgia' : type,
        title: title.trim(), date, time: time.trim() || null,
        status, completedAt, isReturn, source: ev?.source ?? 'manual',
        professionalKind: profKind || null, professionalName: profName.trim() || null,
        establishment: (isPlano ? establishment : establishment).trim() || null,
        location: location.trim() || null,
        modality: (modality || null) as EventDraft['modality'],
        preparation: preparation.trim() || null, notes: notes.trim() || null,
        amountCents: parseAmountToCents(amount), expenseDocType: docType || null,
        directExpense, attachmentUrl: docUrl,
        recurrenceRule: serializeRule({ frequency: cadenceById(cadence).frequency, interval: cadenceById(cadence).interval, until: until || null, count: null }),
        priority: (priority || null) as EventDraft['priority'],
        reminderEnabled: reminder,
        outcome: outcome.trim() ? { summary: outcome.trim() } : null,
        links: ev?.links ?? (prefill?.examId ? [{ type: 'exam', id: prefill.examId, relationship: 'generated_from' }] : []),
      }
      const { error } = await apiClient.agenda.saveEvent(draft)
      if (error) { Alert.alert('Não foi possível salvar', error.message || 'Tente novamente.'); return }
      navigation.goBack()
    } finally { setSaving(false) }
  }

  function onDelete() {
    if (!ev) return
    Alert.alert('Excluir evento', 'Esta ação é irreversível.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        const { error } = await apiClient.agenda.deleteEvent(ev.id)
        if (error) { Alert.alert('Não foi possível excluir', 'Tente novamente.'); return }
        navigation.goBack()
      } },
    ])
  }

  return (
    <ScrollView style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[styles.content, { paddingTop: styles.content.padding + insets.top, paddingBottom: styles.content.padding + insets.bottom }]}
      keyboardShouldPersistTaps="handled">
      <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 20 }}>{editing ? 'Editar evento' : 'Novo evento'}</Text>

      <Field label="Tipo">
        <Chips options={EVENT_TYPE_DEFS.map(d => ({ id: d.id, label: `${d.emoji} ${d.label}` }))} value={type} onChange={setType} />
      </Field>
      {type === 'consulta' ? (
        <Row><Text spec={text(t, { role: 'body' })}>É retorno</Text><Switch value={isReturn} onValueChange={setIsReturn} /></Row>
      ) : null}
      {type === 'procedimento' ? (
        <Row><Text spec={text(t, { role: 'body' })}>É uma cirurgia</Text><Switch value={isSurgery} onValueChange={setIsSurgery} /></Row>
      ) : null}

      <Field label="Título"><Input value={title} onChangeText={setTitle} placeholder="Ex.: Cardiologista" /></Field>
      <Field label="Data">
        <DatePicker value={date} onChange={(v) => {
          setDate(v)
          // Automação (paridade Web): data no passado com status "Agendado" → passa a "Realizado".
          if (/^\d{4}-\d{2}-\d{2}$/.test(v) && v < new Date().toISOString().slice(0, 10) && status === 'planejado') setStatus('realizado')
        }} placeholder="Selecionar data…" />
        {/^\d{4}-\d{2}-\d{2}$/.test(date) && date < new Date().toISOString().slice(0, 10) && status === 'realizado' ? (
          <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Data no passado — marcado como Realizado (entra no Histórico e nas Despesas, se tiver valor).</Text>
        ) : null}
      </Field>
      <Field label="Horário (opcional)"><Input value={time} onChangeText={setTime} placeholder="14:30" /></Field>

      <Field label="Situação"><Chips options={EVENT_STATUS_UI} value={status} onChange={(v) => setStatus(v as EventStatus)} /></Field>

      <Field label={isPlano ? 'Operadora' : 'Estabelecimento'}><Input value={establishment} onChangeText={setEstablishment} placeholder={isPlano ? 'Ex.: Unimed' : 'Clínica / hospital'} /></Field>
      <Field label={isPlano ? 'Carteirinha' : 'Local'}><Input value={location} onChangeText={setLocation} placeholder={isPlano ? 'Número' : 'Endereço / sala'} /></Field>

      {!isPlano ? (
        <>
          <Field label="Profissional"><Chips options={PROFESSIONAL_KIND_DEFS.map(d => ({ id: d.id, label: d.label }))} value={profKind} onChange={setProfKind} clearable /></Field>
          <Field label="Nome do profissional"><Input value={profName} onChangeText={setProfName} placeholder="Dra. Fulana" /></Field>
          <Field label="Modalidade"><Chips options={MODALITIES} value={modality} onChange={setModality} clearable /></Field>
          <Field label="Preparo (opcional)"><Input value={preparation} onChangeText={setPreparation} placeholder="Ex.: jejum de 8h" /></Field>
        </>
      ) : null}

      <Field label="Recorrência"><Select options={CADENCE_PRESETS.map(p => ({ id: p.id, label: p.label }))} value={cadence} onChange={setCadence} title="Recorrência" /></Field>
      {cadence !== 'none' ? <Field label="Repetir até (opcional)"><Input value={until} onChangeText={setUntil} placeholder="2026-12-31" /></Field> : null}

      <Field label="Valor pago (R$)"><Input value={amount} onChangeText={setAmount} placeholder="250,00" keyboardType="decimal-pad" /></Field>
      {amount.trim() ? (
        <>
          <Field label="Documento fiscal"><Chips options={EXPENSE_DOC_TYPES.map(d => ({ id: d.id, label: d.label }))} value={docType} onChange={setDocType} clearable /></Field>
          <Row><Text spec={text(t, { role: 'body' })}>Despesa direta (conta sem “realizado”)</Text><Switch value={directExpense} onValueChange={setDirectExpense} /></Row>
        </>
      ) : null}
      <Field label="Anexo (NF/recibo/comprovante)">
        <Button label={docUrl ? 'Trocar anexo' : 'Anexar documento'} variant="secondary" onPress={pickDoc} loading={uploading} loadingLabel="Enviando…" />
      </Field>

      <Field label="Prioridade"><Chips options={PRIORITIES} value={priority} onChange={setPriority} clearable /></Field>
      <Row><Text spec={text(t, { role: 'body' })}>Receber lembrete no dia anterior</Text><Switch value={reminder} onValueChange={setReminder} /></Row>
      {reminder ? <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Enviado no dia anterior por e-mail e/ou WhatsApp, conforme suas preferências de notificação.</Text> : null}
      {status === 'realizado' ? <Field label="Desfecho (resumo)"><Input value={outcome} onChangeText={setOutcome} placeholder="Resumo / conduta" multiline style={{ minHeight: 70, textAlignVertical: 'top' }} /></Field> : null}
      <Field label="Observações"><Input value={notes} onChangeText={setNotes} placeholder="Notas…" multiline style={{ minHeight: 70, textAlignVertical: 'top' }} /></Field>

      <Button label="Salvar" onPress={save} loading={saving} loadingLabel="Salvando…" />
      {/* D-07: exportar para o calendário do dispositivo (mesmo mecanismo da Web — Google Calendar). */}
      {title.trim() && date ? (
        <Button label="Adicionar ao calendário" variant="secondary"
          onPress={() => { void Linking.openURL(googleCalendarUrl({ title, date, time: time || null, durationMin: null, notes: notes || null, establishment: establishment || null, location: location || null })) }} />
      ) : null}
      {editing ? <Button label="Excluir evento" variant="secondary" onPress={onDelete} /> : null}
    </ScrollView>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const t = useTheme()
  return (
    <View style={{ gap: 6 }}>
      <Text spec={text(t, { role: 'label', tone: 'muted' })}>{label.toUpperCase()}</Text>
      {children}
    </View>
  )
}
function Row({ children }: { children: React.ReactNode }) {
  return <View style={styles.switchRow}>{children}</View>
}
function Chips({ options, value, onChange, clearable }: {
  options: readonly { id: string; label: string }[]; value: string; onChange: (v: string) => void; clearable?: boolean
}) {
  const t = useTheme()
  return (
    <View style={styles.chips}>
      {options.map(o => {
        const on = value === o.id
        return (
          <Pressable key={o.id} onPress={() => onChange(clearable && on ? '' : o.id)}
            style={[styles.chip, { borderColor: on ? t.color.identity.primary : t.color.border.default, backgroundColor: on ? t.color.badge.info.soft : 'transparent' }]}>
            <Text spec={text(t, { role: 'caption', tone: on ? 'default' : 'muted' })}>{o.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
})
