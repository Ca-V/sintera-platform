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
import type { PatientDocumentDTO, PickedFile } from '@sintera/api-client'
import {
  DOCUMENT_SUBTYPES, documentSubtypeLabel, documentSubtitle, isReadyToSave, DOCUMENT_BASE_ACTIONS,
  autofillFrom, deriveDocumentTitle, DOCUMENT_FILTER_ALL,
  type PatientDocumentSubtype, type AttachedFile,
} from '@sintera/core'
import { Text, Button, Input, AttachmentLink, DatePicker, Disclaimer, Select, AnexoDocumento } from '../../primitives'
import { useTheme } from '../../theme'
import { apiClient } from '../../../infrastructure/apiClient'


// Rótulos das ações OBRIGATÓRIAS, do contrato no núcleo — a mesma redação em toda categoria e nas duas pontas.
const ACOES = Object.fromEntries(DOCUMENT_BASE_ACTIONS.map(a => [a.kind, a.label])) as Record<'view' | 'edit' | 'delete', string>

export function DocumentsScreen() {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const [items, setItems] = useState<PatientDocumentDTO[]>([])
  /** document_id → nomes dos registros vinculados. Vazio é normal: nem todo documento tem vínculo. */
  const [alvos, setAlvos] = useState<Record<string, string[]>>({})
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const alive = useRef(true)

  const [filter, setFilter] = useState<string>(DOCUMENT_FILTER_ALL)
  const [open, setOpen] = useState(false)
  // EDITAR: o cartão passou a ter a ação obrigatória do contrato. Ela não existia em NENHUMA tela do Mobile,
  // e `updateDocument` estava no api-client sem consumidor nenhum.
  const [editando, setEditando] = useState<PatientDocumentDTO | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [subtype, setSubtype] = useState<PatientDocumentSubtype>('receita')
  // ANEXO-001: o formulário guarda um CONJUNTO de páginas, não um arquivo.
  const [files, setFiles] = useState<AttachedFile[]>([])
  const [issuer, setIssuer] = useState('')
  const [docDate, setDocDate] = useState('')
  const [notes, setNotes] = useState('')

  const load = useCallback((silent: boolean) => {
    if (silent) setRefreshing(true); else setPhase('loading')
    apiClient.documents.listDocuments()
      .then(async (ds) => {
        if (!alive.current) return
        setItems(ds); setPhase('ready'); setError(null)
        // Nomes dos alvos vinculados, para o card dizer "Receita de paracetamol". Mesma consulta da Web.
        // Depois de mostrar a lista, não antes: o título enriquece, e esperar por ele atrasaria a tela toda.
        const nomes = await apiClient.documents.targetNamesByDocument(ds.map(d => d.id))
        if (alive.current) setAlvos(nomes)
      })
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
    setSubtype('receita'); setFiles([]); setIssuer(''); setDocDate(''); setNotes(''); setFormError(null)
    setEditando(null)
  }

  /**
   * Abre o formulário com os fatos do documento.
   *
   * O ARQUIVO não se troca ao editar: editar corrige o que se REGISTROU sobre o documento — emissor, data,
   * tipo, observação. A evidência em si não se substitui; para outro documento, cria-se outro registro.
   */
  function startEdit(d: PatientDocumentDTO) {
    setEditando(d)
    setSubtype(d.subtype); setIssuer(d.issuer ?? ''); setDocDate(d.doc_date ?? ''); setNotes(d.notes ?? '')
    setFiles([]); setFormError(null); setOpen(true)
  }

  /** Sobe UMA página. O componente cuida da política, da lista e da ordem. */
  const uploadPagina = useCallback(async (file: PickedFile): Promise<string | null> => {
    const { data, error: err } = await apiClient.exams.uploadExam({
      uri: file.uri,
      mimeType: file.mimeType ?? 'application/octet-stream',
      sizeBytes: file.sizeBytes,
    })
    return err || !data ? null : data.url
  }, [])

  async function save() {
    // EDITANDO: corrige os fatos do documento; o arquivo permanece. Só a criação exige anexo.
    if (editando) {
      setSaving(true)
      try {
        const { error: err } = await apiClient.documents.updateDocument(editando.id, {
          subtype,
          issuer: issuer.trim() || null,
          doc_date: docDate || null,
          notes: notes.trim() || null,
        })
        if (err) { setFormError('Não foi possível salvar as alterações.'); return }
        setOpen(false); resetForm(); load(true)
      } finally { setSaving(false) }
      return
    }

    if (!isReadyToSave(files)) { setFormError('Anexe o documento.'); return }
    setSaving(true)
    try {
      const { error: err } = await apiClient.documents.saveDocument({
        subtype,
        // A primeira página também vai em `file_url` — é o que os documentos anteriores ao ANEXO-001 usam.
        file_url: files[0].url!,
        issuer: issuer.trim() || null,
        doc_date: docDate || null,
        notes: notes.trim() || null,
        pages: files.map(f => ({
          file_url: f.url!, file_name: f.name, mime_type: f.mime, size_bytes: f.sizeBytes,
        })),
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

  const visible = filter === DOCUMENT_FILTER_ALL ? items : items.filter(d => d.subtype === filter)

  const counts = items.reduce<Record<string, number>>((acc, d) => {
    acc[d.subtype] = (acc[d.subtype] ?? 0) + 1
    return acc
  }, {})

  const filterOptions = [
    { id: DOCUMENT_FILTER_ALL, label: `Todos (${items.length})` },
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
          <Text spec={text(t, { role: 'bodyStrong' })}>{editando ? 'Editar documento' : 'Adicionar documento'}</Text>

          <View style={{ gap: 6 }}>
            <Text spec={text(t, { role: 'label', tone: 'muted' })} style={{ color: t.color.text.muted }}>Tipo de documento</Text>
            <Select
              value={subtype}
              onChange={v => setSubtype(v as PatientDocumentSubtype)}
              options={DOCUMENT_SUBTYPES.map(x => ({ id: x.value, label: x.label }))}
              title="Tipo de documento"
            />
            {/* NÃO anunciar aqui a que este documento "pode ser associado": este formulário não associa nada.
                O vínculo da receita ao medicamento nasce do outro lado, na tela de Medicamentos. Prometer uma
                capacidade que a tela não tem é pior do que ficar calado. Quando houver seletor de vínculo
                aqui, o texto volta — junto com o campo. */}
          </View>

          {/* Ao EDITAR, o anexo não aparece: corrige-se o que foi registrado sobre o documento, não a evidência. */}
          {/* LEITURA ASSISTIDA (ANEXO-001 · item D) — mesma capacidade da Web, mesma regra: declara o subtipo
              escolhido para que o componente avise se o documento parece outra coisa, e devolva emissor e data
              para REVISÃO. `autofillFrom` não sobrescreve o que já foi digitado. */}
          {!editando ? (
            <AnexoDocumento
              files={files} onChange={setFiles} upload={uploadPagina}
              leituraAssistida={{
                declarado: subtype,
                onLeitura: (leitura) => {
                  const preenchido = autofillFrom(leitura, { issuer, docDate })
                  setIssuer(preenchido.issuer)
                  setDocDate(preenchido.docDate)
                },
              }}
            />
          ) : null}

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

          <Button label={editando ? 'Salvar alterações' : 'Salvar documento'} onPress={save} loading={saving} disabled={!editando && !isReadyToSave(files)} />
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
          const meta = documentSubtitle(d)
          return (
            <View key={d.id} style={[s.card, { backgroundColor: t.color.surface.base, borderColor: t.color.border.default, gap: 8 }]}>
              <Text spec={text(t, { role: 'bodyStrong' })}>{deriveDocumentTitle(d.subtype, alvos[d.id])}</Text>
              <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.text.muted }}>
                {meta}
              </Text>
              {/* AÇÕES do contrato (documentCardActions): ver · editar · excluir, com a redação do núcleo —
                  a mesma em toda categoria e nas duas plataformas. */}
              <AttachmentLink url={d.file_url} label={ACOES.view} variant="inline" />
              <View style={{ flexDirection: 'row', gap: 20 }}>
                <Pressable onPress={() => startEdit(d)} hitSlop={8}>
                  <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>{ACOES.edit}</Text>
                </Pressable>
                <Pressable onPress={() => confirmDelete(d)} hitSlop={8}>
                  <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.error.text }}>{ACOES.delete}</Text>
                </Pressable>
              </View>
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
