// Documentos do paciente (paridade Web /dashboard/documentos) — receita · atestado · relatório ·
// encaminhamento · outros. Domínio PRÓPRIO, separado de Exames: criar um documento NUNCA cria exame nem muta o
// registro-alvo (invariante testada no core).
//
// Reutiliza apiClient.documents + taxonomia @sintera/core. As MESMAS funções que a Web usa — rótulos, alvos
// permitidos, formato e limite de anexo — para as duas telas não divergirem. FACTUAL (REG-001, RDC 657): a
// SINTERA transcreve emissor, data e tipo; não interpreta conteúdo clínico.
import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, View, ActivityIndicator, RefreshControl, Pressable, Alert, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { text } from '@sintera/design-system'
import type { PatientDocumentDTO } from '@sintera/api-client'
import {
  DOCUMENT_SUBTYPES, documentSubtypeLabel, allowedTargets, withinAttachmentLimit, MAX_ATTACHMENT_MB,
  type PatientDocumentSubtype,
} from '@sintera/core'
import { Text, Button, Input, AttachmentLink, DatePicker, Disclaimer, Select } from '../../primitives'
import { useTheme } from '../../theme'
import { apiClient } from '../../../infrastructure/apiClient'
import { documentPicker } from '../../../infrastructure/documentPickerAdapter'

const FILTER_ALL = 'todos'

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const [y, m, d] = iso.slice(0, 10).split('-')
  return d && m && y ? `${d}/${m}/${y}` : ''
}

export function DocumentsScreen() {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const [items, setItems] = useState<PatientDocumentDTO[]>([])
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const alive = useRef(true)

  const [filter, setFilter] = useState<string>(FILTER_ALL)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [subtype, setSubtype] = useState<PatientDocumentSubtype>('receita')
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [issuer, setIssuer] = useState('')
  const [docDate, setDocDate] = useState('')
  const [notes, setNotes] = useState('')

  const load = useCallback((silent: boolean) => {
    if (silent) setRefreshing(true); else setPhase('loading')
    apiClient.documents.listDocuments()
      .then((ds) => { if (!alive.current) return; setItems(ds); setPhase('ready'); setError(null) })
      .catch((e) => {
        if (alive.current && !silent) {
          setError(e instanceof Error ? e.message : 'Não foi possível carregar.')
          setPhase('error')
        }
      })
      .finally(() => { if (alive.current) setRefreshing(false) })
  }, [])
  useEffect(() => { alive.current = true; load(false); return () => { alive.current = false } }, [load])

  function resetForm() {
    setSubtype('receita'); setFileUrl(null); setIssuer(''); setDocDate(''); setNotes(''); setFormError(null)
  }

  async function pickFile() {
    setFormError(null)
    setUploading(true)
    try {
      const file = await documentPicker.pickDocument()
      if (!file) return
      // Limite ÚNICO da plataforma (ANEXO-001) — o mesmo número que a Web aplica.
      if (file.sizeBytes != null && !withinAttachmentLimit(file.sizeBytes)) {
        setFormError(`O arquivo passa de ${MAX_ATTACHMENT_MB} MB.`)
        return
      }
      const { data, error: err } = await apiClient.exams.uploadExam({
        uri: file.uri,
        mimeType: file.mimeType ?? 'application/octet-stream',
        sizeBytes: file.sizeBytes,
      })
      if (err || !data) { setFormError('Não foi possível enviar o arquivo.'); return }
      setFileUrl(data.url)
    } finally { setUploading(false) }
  }

  async function save() {
    if (!fileUrl) { setFormError('Anexe o documento.'); return }
    setSaving(true)
    try {
      const { error: err } = await apiClient.documents.saveDocument({
        subtype,
        file_url: fileUrl,
        issuer: issuer.trim() || null,
        doc_date: docDate || null,
        notes: notes.trim() || null,
      })
      if (err) { setFormError('Não foi possível salvar o documento.'); return }
      setOpen(false); resetForm(); load(true)
    } finally { setSaving(false) }
  }

  function confirmDelete(doc: PatientDocumentDTO) {
    Alert.alert(
      'Excluir documento',
      'O documento será removido da sua conta. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            const { error: err } = await apiClient.documents.deleteDocument(doc.id)
            if (err) Alert.alert('Não foi possível excluir', err.message)
            else load(true)
          },
        },
      ],
    )
  }

  const visible = filter === FILTER_ALL ? items : items.filter(d => d.subtype === filter)

  const counts = items.reduce<Record<string, number>>((acc, d) => {
    acc[d.subtype] = (acc[d.subtype] ?? 0) + 1
    return acc
  }, {})

  const filterOptions = [
    { id: FILTER_ALL, label: `Todos (${items.length})` },
    ...DOCUMENT_SUBTYPES.map(s => ({ id: s.value, label: `${s.label} (${counts[s.value] ?? 0})` })),
  ]

  if (phase === 'loading') {
    return <View style={s.center}><ActivityIndicator color={t.color.identity.primary} /></View>
  }
  if (phase === 'error') {
    return (
      <View style={s.center}>
        <Text spec={text(t, { role: 'body' })} style={{ color: t.color.text.muted, textAlign: 'center' }}>{error}</Text>
        <View style={{ height: 12 }} />
        <Button label="Tentar de novo" onPress={() => load(false)} variant="secondary" />
      </View>
    )
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 12 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={t.color.identity.primary} />}
    >
      <Text spec={text(t, { role: 'body' })} style={{ color: t.color.text.muted }}>
        Receitas, atestados, relatórios e encaminhamentos — guardados com emissor e data.
      </Text>

      <Disclaimer />

      {!open && (
        <Button label="Adicionar documento" onPress={() => { resetForm(); setOpen(true) }} />
      )}

      {open && (
        <View style={[s.card, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }]}>
          <Text spec={text(t, { role: 'bodyStrong' })}>Adicionar documento</Text>

          <View style={{ gap: 6 }}>
            <Text spec={text(t, { role: 'label', tone: 'muted' })} style={{ color: t.color.text.muted }}>Tipo de documento</Text>
            <Select
              value={subtype}
              onChange={v => setSubtype(v as PatientDocumentSubtype)}
              options={DOCUMENT_SUBTYPES.map(x => ({ id: x.value, label: x.label }))}
              title="Tipo de documento"
            />
            {/* Alvos vindos do domínio: a Receita alimenta 7 contextos; atestado/relatório/encaminhamento
                ligam-se ao encontro. Mesmo texto da Web, mesma fonte. */}
            {allowedTargets(subtype).length > 0 && (
              <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.text.muted }}>
                Pode ser associado a: {allowedTargets(subtype).join(' · ')}
              </Text>
            )}
          </View>

          <View style={{ gap: 6 }}>
            <Text spec={text(t, { role: 'label', tone: 'muted' })} style={{ color: t.color.text.muted }}>Documento</Text>
            <Button
              label={fileUrl ? 'Arquivo anexado — trocar' : 'Anexar arquivo (PDF ou imagem)'}
              onPress={pickFile}
              variant="secondary"
              loading={uploading}
              loadingLabel="Enviando…"
            />
          </View>

          <View style={{ gap: 6 }}>
            <Text spec={text(t, { role: 'label', tone: 'muted' })} style={{ color: t.color.text.muted }}>Emitido por</Text>
            <Input value={issuer} onChangeText={setIssuer} placeholder="Profissional ou instituição" />
          </View>

          <View style={{ gap: 6 }}>
            <Text spec={text(t, { role: 'label', tone: 'muted' })} style={{ color: t.color.text.muted }}>Data do documento</Text>
            <DatePicker value={docDate} onChange={setDocDate} placeholder="Selecionar data" />
          </View>

          <View style={{ gap: 6 }}>
            <Text spec={text(t, { role: 'label', tone: 'muted' })} style={{ color: t.color.text.muted }}>Observação</Text>
            <Input value={notes} onChangeText={setNotes} multiline />
          </View>

          {formError && (
            <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.error.text }}>{formError}</Text>
          )}

          <Button label="Salvar documento" onPress={save} loading={saving} disabled={uploading || !fileUrl} />
          <Button label="Cancelar" onPress={() => { setOpen(false); resetForm() }} variant="ghost" />
        </View>
      )}

      {items.length > 0 && (
        <Select value={filter} onChange={setFilter} options={filterOptions} title="Filtrar por tipo" />
      )}

      {visible.length === 0 ? (
        <Text spec={text(t, { role: 'body' })} style={{ color: t.color.text.muted, textAlign: 'center', paddingVertical: 24 }}>
          {items.length === 0
            ? 'Nenhum documento ainda. Guarde aqui receitas, atestados, relatórios e encaminhamentos — o documento original fica sempre acessível.'
            : 'Nenhum documento deste tipo. Troque o filtro para ver os outros.'}
        </Text>
      ) : (
        visible.map(d => {
          const meta = [d.issuer, formatDate(d.doc_date)].filter(Boolean).join(' · ')
          return (
            <View key={d.id} style={[s.card, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default, gap: 8 }]}>
              <Text spec={text(t, { role: 'bodyStrong' })}>{documentSubtypeLabel(d.subtype)}</Text>
              <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.text.muted }}>
                {meta || 'Sem emissor informado'}
              </Text>
              <AttachmentLink url={d.file_url} label="Ver documento" />
              <Pressable onPress={() => confirmDelete(d)} hitSlop={8}>
                <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.error.text }}>Excluir</Text>
              </Pressable>
            </View>
          )
        })
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 },
})
