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
  // O que a busca alcanca neste documento (migracao 154) — mesma regra e mesma frase da Web.
  buscavel, statusFrase, type StatusDaTranscricao,
  documentPrimaryName, parsePrescribedItems, prescribedItemsToText,
  findExistingDocument, existingDocumentMessage, DOCUMENT_DUPLICATE_CHOICES,
  itensParaRegistrar, destinoDaPlataforma, DESTINOS_PRESCRITOS, convitePrescricao, AVISO_PRESCRICAO,
  type ItemPrescrito, type DestinoPrescrito,
  type PatientDocumentSubtype, type AttachedFile,
} from '@sintera/core'
import { Text, Button, Input, AttachmentLink, DatePicker, Disclaimer, Select, AnexoDocumento } from '../../primitives'
import { useTheme } from '../../theme'
import { apiClient } from '../../../infrastructure/apiClient'


// Rótulos das ações OBRIGATÓRIAS, do contrato no núcleo — a mesma redação em toda categoria e nas duas pontas.
const ACOES = Object.fromEntries(DOCUMENT_BASE_ACTIONS.map(a => [a.kind, a.label])) as Record<'view' | 'edit' | 'delete', string>

// As três saídas do aviso de repetição, com a redação do núcleo — a Web oferece exatamente as mesmas.
const OPC = {
  substituir: DOCUMENT_DUPLICATE_CHOICES.find(o => o.id === 'substituir')!,
  guardar: DOCUMENT_DUPLICATE_CHOICES.find(o => o.id === 'guardar-as-duas')!,
  cancelar: DOCUMENT_DUPLICATE_CHOICES.find(o => o.id === 'cancelar')!,
}

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
  /**
   * O formulário abre ACIMA da lista. Sem rolar até ele, quem toca em "Editar" num cartão lá embaixo vê a
   * tela não mudar — o formulário abriu fora da vista. Achado na homologação de 30/08: "a opção para editar
   * uma receita que já estava adicionada não funcionou". Funcionava; era invisível.
   */
  const scroller = useRef<ScrollView>(null)

  const [filter, setFilter] = useState<string>(DOCUMENT_FILTER_ALL)
  const [open, setOpen] = useState(false)
  // EDITAR: o cartão passou a ter a ação obrigatória do contrato. Ela não existia em NENHUMA tela do Mobile,
  // e `updateDocument` estava no api-client sem consumidor nenhum.
  const [editando, setEditando] = useState<PatientDocumentDTO | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  /** Documento sendo lido agora. `null` = nenhum. */
  const [lendo, setLendo] = useState<string | null>(null)

  const [subtype, setSubtype] = useState<PatientDocumentSubtype>('receita')
  // ANEXO-001: o formulário guarda um CONJUNTO de páginas, não um arquivo.
  const [files, setFiles] = useState<AttachedFile[]>([])
  const [issuer, setIssuer] = useState('')
  // PROFISSIONAL e INSTITUIÇÃO são campos separados desde a migração 151. Antes havia um só ("Emitido por"), e
  // ele obrigava a escolher: num atestado da homologação de 30/08 a leitura gravou a clínica e o médico se
  // perdeu. São dois fatos, e a pessoa procura o documento tanto por um quanto pelo outro.
  const [professional, setProfessional] = useState('')
  const [institution, setInstitution] = useState('')
  /**
   * O que a receita prescreve — um item por linha.
   *
   * "Não aparece o nome do medicamento, que é o item mais importante" (fundadora, 30/08). Um campo de texto
   * com uma linha por item é o editor mais simples que serve: a leitura preenche sozinha, e corrigir é apagar
   * uma letra — não navegar por uma lista de campos.
   */
  const [itensTexto, setItensTexto] = useState('')
  /**
   * A proposta de registrar o que a receita prescreve. Presente = a folha de confirmação está na tela.
   *
   * `marcados` é paralelo a `itens`: tudo começa marcado, porque o caminho comum é aceitar tudo — e desmarcar
   * um é mais rápido do que marcar três.
   */
  const [proposta, setProposta] = useState<{
    documentoId: string; itens: ItemPrescrito[]; marcados: boolean[]
  } | null>(null)
  /** Prescritor e arquivo da receita recém-salva, guardados antes de o formulário ser limpo. */
  const professionalDaReceita = useRef('')
  const fileDaReceita = useRef('')
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

  /**
   * Manda ler o documento — a MESMA rota que a Web chama e que o salvamento usa.
   *
   * Existe porque a leitura só acontecia ao SALVAR: documento que falhou ficava preso, e documento anterior
   * à funcionalidade nunca teria como ser lido. Recarrega a lista em vez de presumir o resultado.
   */
  const lerDocumento = useCallback(async (id: string) => {
    setLendo(id)
    try {
      const { data, error: err } = await apiClient.documents.transcribeDocument(id)
      // A frase vem do núcleo, pelo servidor — a mesma que a Web mostra. Nunca redigida aqui.
      if (err) Alert.alert('Não foi possível ler', err.message)
      else if (data?.mensagem) Alert.alert('Leitura do documento', data.mensagem)
      load(true)
    } finally {
      setLendo(null)
    }
  }, [load])

  function resetForm() {
    setSubtype('receita'); setFiles([]); setIssuer(''); setProfessional(''); setInstitution('')
    setItensTexto(''); setDocDate(''); setNotes(''); setFormError(null)
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
    setProfessional(d.professional_name ?? ''); setInstitution(d.institution_name ?? '')
    setItensTexto(prescribedItemsToText(d.prescribed_items))
    setFiles([]); setFormError(null); setOpen(true)
    // SOBE ATÉ O FORMULÁRIO. Sem esta linha, tocar em "Editar" num cartão lá embaixo abre o formulário acima
    // da lista, fora da tela, e a pessoa vê a tela não mudar. Foi assim que a fundadora concluiu que "editar
    // não funcionou" — e a correção anterior declarou a ref sem nunca a usar. Um conserto que não foi ligado
    // é indistinguível de conserto nenhum.
    scroller.current?.scrollTo({ y: 0, animated: true })
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

  /**
   * `issuer` continua sendo gravado, com o mesmo nome que a regra do núcleo escolheria.
   *
   * Não é duplicação por descuido: é o campo que TODO documento anterior à migração 151 usa, e que outras
   * telas ainda leem. Mantê-lo em dia custa uma linha; deixá-lo apodrecer faria a mesma receita aparecer com
   * nome numa tela e sem nome noutra.
   */
  function nomePrincipal(): string {
    return documentPrimaryName({
      professional_name: professional, institution_name: institution, issuer,
    }) ?? ''
  }

  async function save() {
    // EDITANDO: corrige os fatos do documento; o arquivo permanece. Só a criação exige anexo.
    if (editando) {
      setSaving(true)
      try {
        const { error: err } = await apiClient.documents.updateDocument(editando.id, {
          subtype,
          issuer: nomePrincipal() || null,
          professional_name: professional.trim() || null,
          institution_name: institution.trim() || null,
          prescribed_items: parsePrescribedItems(itensTexto),
          doc_date: docDate || null,
          notes: notes.trim() || null,
        })
        if (err) { setFormError('Não foi possível salvar as alterações.'); return }
        setOpen(false); resetForm(); load(true)
      } finally { setSaving(false) }
      return
    }

    if (!isReadyToSave(files)) { setFormError('Anexe o documento.'); return }

    // JÁ ESTÁ GUARDADO? A regra permanente da fundadora (28/08): toda informação que entra é conferida contra
    // o que já existe, e havendo correspondência a plataforma INFORMA e PERGUNTA. Ela adicionou a mesma receita
    // duas vezes, na semana passada e hoje, e a plataforma não disse nada — as duas ficaram na lista.
    //
    // A conferência acontece ANTES de gravar, porque depois já não é aviso: é limpeza.
    const existente = findExistingDocument(
      { id: '', createdAt: '', subtype, issuer: nomePrincipal(), docDate: docDate || null },
      items.map(d => ({
        id: d.id, createdAt: d.created_at, subtype: d.subtype,
        issuer: documentPrimaryName(d), docDate: d.doc_date,
      })),
    )
    if (existente) {
      Alert.alert(
        'Este documento já está guardado',
        `${existingDocumentMessage(existente, documentSubtypeLabel(subtype))}\n\nO que você quer fazer?`,
        [
          { text: OPC.cancelar.label, style: 'cancel' },
          { text: OPC.guardar.label, onPress: () => { void gravar(null) } },
          { text: OPC.substituir.label, onPress: () => { void gravar(existente.id) } },
        ],
      )
      return
    }
    await gravar(null)
  }

  /**
   * Grava o documento. `substituirId` presente = a pessoa escolheu substituir o que já estava guardado.
   *
   * Separada de `save()` porque o aviso de repetição é assíncrono e por escolha da pessoa — sem esta divisão, a
   * gravação teria de acontecer dentro do callback de um alerta, longe da validação que a precede.
   */
  async function gravar(substituirId: string | null) {
    setSaving(true)
    try {
      const entrada = {
        subtype,
        // A primeira página também vai em `file_url` — é o que os documentos anteriores ao ANEXO-001 usam.
        file_url: files[0].url!,
        issuer: nomePrincipal() || null,
        professional_name: professional.trim() || null,
        institution_name: institution.trim() || null,
        prescribed_items: parsePrescribedItems(itensTexto),
        doc_date: docDate || null,
        notes: notes.trim() || null,
        pages: files.map(f => ({
          file_url: f.url!, file_name: f.name, mime_type: f.mime, size_bytes: f.sizeBytes,
        })),
      }
      // SUBSTITUIR atualiza o registro guardado em vez de apagar e recriar: ele pode já estar vinculado a um
      // medicamento ou a uma consulta, e apagá-lo levaria os vínculos junto.
      // Guardados ANTES de limpar o formulário: a proposta de registrar os itens vem logo a seguir e precisa
      // do prescritor e do arquivo desta receita, que já não estarão nos campos.
      professionalDaReceita.current = professional.trim()
      fileDaReceita.current = files[0].url!

      const resultado = substituirId
        ? { data: null, error: (await apiClient.documents.replaceDocument(substituirId, entrada)).error }
        : await apiClient.documents.saveDocument(entrada)
      const { error: err } = resultado
      const criado = resultado.data
      if (err) { setFormError('Não foi possível salvar o documento.'); return }

      // A RECEITA DIRECIONA PARA O QUE ELA PRESCREVE (regra da fundadora, 30/08). Os itens já foram
      // transcritos e já estão classificados; falta um toque. Não se cria nada sozinho: criar registro clínico
      // a partir de leitura automática seria a plataforma PRODUZINDO conteúdo, não organizando.
      const propostos = subtype === 'receita' ? itensParaRegistrar(parsePrescribedItems(itensTexto)) : []
      const docId = substituirId ?? criado?.id ?? null

      // ─────────────────────────────────────────────────────────────────────────────────────────────────
      // MANDA LER O DOCUMENTO (decisão da fundadora, 01/09/2026): "todos os documentos que são adicionados
      // precisam ser lidos e transcritos". Até aqui, a leitura assistida abria a foto, tirava profissional,
      // data e itens — e DESCARTAVA o texto. Procurar uma palavra dentro de uma receita nunca funcionou.
      //
      // NÃO BLOQUEIA E NÃO DESFAZ NADA: o documento já está salvo e o arquivo é a fonte da verdade. Falhar a
      // leitura adia a busca alcançar o conteúdo, e o estado 'falhou' fica gravado para tentar de novo.
      // ─────────────────────────────────────────────────────────────────────────────────────────────────
      if (docId) {
        apiClient.documents.transcribeDocument(docId)
          .then(({ error }) => { if (error) console.warn('[documento] leitura adiada:', error.message) })
          .catch(() => { /* já registrado como "falhou" no servidor; a tela não trava por isso */ })
      }
      if (propostos.length > 0 && docId) {
        setProposta({ documentoId: docId, itens: propostos, marcados: propostos.map(() => true) })
      }
      setOpen(false); resetForm(); load(true)
    } finally { setSaving(false) }
  }

  /**
   * Registra os itens marcados, cada um no domínio a que pertence, já ligado à receita.
   *
   * Medicamento e suplemento vão para Medicamentos (distinguidos por `kind`); dispositivo e produto vão para
   * RECURSOS DE SAÚDE, que é o domínio deles — é lá que a pessoa vai procurá-los.
   *
   * Um item que falhe não derruba os outros: cada um é um registro independente, e perder três porque o
   * segundo falhou seria transformar um problema pequeno num grande.
   */
  async function registrarPrescritos() {
    if (!proposta) return
    setSaving(true)
    let feitos = 0
    const falharam: string[] = []
    try {
      for (let i = 0; i < proposta.itens.length; i++) {
        if (!proposta.marcados[i]) continue
        const item = proposta.itens[i]
        const destino = destinoDaPlataforma(item.destino)
        const prescritor = professionalDaReceita.current || null

        const r = destino.medKind
          ? await apiClient.medications.saveMedication({
              name: item.texto, kind: destino.medKind, status: 'em_uso',
              prescriber_name: prescritor, prescription_url: fileDaReceita.current,
            })
          : await apiClient.resources.saveResource({
              name: item.texto, resource_type: destino.resourceType!, status: 'em_uso',
              prescriber: prescritor, file_url: fileDaReceita.current,
            })

        // NÃO ENGOLIR A FALHA. Este `continue` já esteve mudo, e um item que some sem explicação é
        // indistinguível de item que a pessoa desmarcou — ela contaria três na tela e acharia dois na lista,
        // sem saber onde perguntar. É o mesmo defeito que matou três domínios da busca em silêncio.
        if (r.error || !r.data?.id) { falharam.push(item.texto); continue }

        // O VÍNCULO é o que fecha o ciclo: abrir o medicamento mostra a receita, abrir a receita mostra o que
        // ela gerou. Falhar aqui deixa o registro criado e sem o vínculo — incompleto, nunca errado, e por
        // isso não conta como falha do item.
        await apiClient.documents.linkDocumentToTarget(proposta.documentoId, 'receita', destino.dominio, r.data.id)
        feitos++
      }
      setProposta(null)

      const parte = feitos === 1 ? '1 item foi registrado' : `${feitos} itens foram registrados`
      if (falharam.length > 0) {
        Alert.alert(
          'Nem tudo foi registrado',
          `${feitos > 0 ? `${parte} a partir da receita.\n\n` : ''}` +
          `Não foi possível registrar: ${falharam.join(', ')}. ` +
          'Você pode adicioná-los à mão, e a receita continua guardada com os itens transcritos.',
        )
      } else if (feitos > 0) {
        Alert.alert('Registrado', `${parte} a partir da receita.`)
      }
      load(true)
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
      ref={scroller}
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
                  const preenchido = autofillFrom(leitura, {
                    issuer, docDate, professional, institution,
                    items: parsePrescribedItems(itensTexto) ?? [],
                  })
                  setIssuer(preenchido.issuer)
                  setDocDate(preenchido.docDate)
                  setProfessional(preenchido.professional)
                  setInstitution(preenchido.institution)
                  setItensTexto(prescribedItemsToText(preenchido.items))
                },
              }}
            />
          ) : null}

          {/* O QUE FOI PRESCRITO — só na receita, porque só ela prescreve. A leitura preenche; a pessoa
              confere contra o papel. É transcrição, não interpretação: o nome e a concentração como estão
              escritos, sem posologia (RDC 657). */}
          {subtype === 'receita' && (
            <View style={{ gap: 6 }}>
              <Text spec={text(t, { role: 'label', tone: 'muted' })} style={{ color: t.color.text.muted }}>O que foi prescrito</Text>
              <Input
                value={itensTexto} onChangeText={setItensTexto} multiline
                placeholder={'Um por linha\nEx.: Losartana 50mg'}
              />
              <Text spec={text(t, { role: 'caption', tone: 'faint' })}>
                Um item por linha, como está escrito na receita — medicamento, suplemento, dispositivo ou produto.
              </Text>
            </View>
          )}

          {/* MÉDICO E CLÍNICA SEPARADOS. Um campo só obrigava a escolher, e a escolha se perdia: num atestado
              a leitura gravou a clínica e o médico ficou de fora. São dois fatos, e busca-se por ambos. */}
          <View style={{ gap: 6 }}>
            <Text spec={text(t, { role: 'label', tone: 'muted' })} style={{ color: t.color.text.muted }}>Profissional</Text>
            <Input value={professional} onChangeText={setProfessional} placeholder="Quem assinou o documento" />
          </View>

          <View style={{ gap: 6 }}>
            <Text spec={text(t, { role: 'label', tone: 'muted' })} style={{ color: t.color.text.muted }}>Clínica, laboratório ou hospital</Text>
            <Input value={institution} onChangeText={setInstitution} placeholder="Onde foi emitido" />
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
              {/* O QUE A BUSCA ALCANÇA NESTE DOCUMENTO — mesma regra e mesma frase da Web, vindas do núcleo.
                  Só aparece quando há o que avisar: documento lido por inteiro não ganha aviso.
                  Sem isto, a pessoa procura uma palavra da receita, não acha, e conclui que não está lá —
                  foi exatamente o que aconteceu com os exames. */}
              {/* LER O DOCUMENTO — a ação que faltava nas duas pontas. A leitura só era disparada ao
                  SALVAR, então documento que falhasse ficava preso, e os que existiam antes desta
                  funcionalidade nunca teriam como ser lidos. */}
              {!d.transcricao_status || d.transcricao_status === 'falhou' ? (
                <Pressable onPress={() => lerDocumento(d.id)} disabled={lendo === d.id} hitSlop={8} style={{ alignSelf: 'flex-start' }}>
                  <Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>
                    {lendo === d.id ? 'Lendo…' : d.transcricao_status === 'falhou' ? 'Tentar ler de novo' : 'Ler documento'}
                  </Text>
                </Pressable>
              ) : null}
              {d.transcricao_status && d.transcricao_status !== 'ok' ? (
                <Text
                  spec={text(t, { role: 'caption' })}
                  style={{ color: buscavel(d.transcricao_status as StatusDaTranscricao)
                    ? t.color.text.muted
                    : t.color.badge.attention.text }}
                >
                  {statusFrase(d.transcricao_status as StatusDaTranscricao)}
                </Text>
              ) : null}
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

      {/* A RECEITA DIRECIONA PARA O QUE ELA PRESCREVE.
          Tudo já vem marcado e com destino escolhido: o caminho comum é aceitar, e um toque conclui. O destino
          é um botão — classificação que se mostra e se corrige é diferente de classificação que decide calada.
          Nada é criado sem esta confirmação: o toque é o que separa transcrever de prescrever. */}
      {proposta && (
        <View style={[s.card, { backgroundColor: t.color.surface.base, borderColor: t.color.identity.primary, gap: 12 }]}>
          <Text spec={text(t, { role: 'bodyStrong' })}>{convitePrescricao(proposta.itens.length)}</Text>
          <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{AVISO_PRESCRICAO}</Text>

          {proposta.itens.map((item, i) => (
            <View key={`${item.texto}-${i}`} style={[s.itemPrescrito, { borderColor: t.color.border.default }]}>
              <Pressable
                onPress={() => setProposta(p => p && {
                  ...p, marcados: p.marcados.map((m, j) => (j === i ? !m : m)),
                })}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: proposta.marcados[i] }}
                accessibilityLabel={item.texto}
                hitSlop={8}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
              >
                <Text spec={text(t, { role: 'body' })} style={{ color: t.color.identity.primary }}>
                  {proposta.marcados[i] ? '☑' : '☐'}
                </Text>
                <Text spec={text(t, { role: 'body' })} style={{ flex: 1 }}>{item.texto}</Text>
              </Pressable>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {DESTINOS_PRESCRITOS.map(d => {
                  const ativo = item.destino === d.id
                  return (
                    <Pressable
                      key={d.id}
                      onPress={() => setProposta(p => p && {
                        ...p,
                        itens: p.itens.map((it, j) => (j === i ? { ...it, destino: d.id as DestinoPrescrito } : it)),
                      })}
                      accessibilityRole="button"
                      accessibilityState={{ selected: ativo }}
                      style={[
                        s.destino,
                        { borderColor: ativo ? t.color.identity.primary : t.color.border.default },
                        ativo && { backgroundColor: t.color.identity.soft },
                      ]}
                    >
                      <Text
                        spec={text(t, { role: 'caption' })}
                        style={{ color: ativo ? t.color.identity.primary : t.color.text.muted }}
                      >
                        {d.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>

              {/* O PALPITE SE ANUNCIA. Um destino que a plataforma não reconheceu vem avisado — palpite
                  silencioso é o que corrói a confiança. */}
              {!item.reconhecido && (
                <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Confira o destino deste item.</Text>
              )}
            </View>
          ))}

          <Button
            label={`Registrar ${proposta.marcados.filter(Boolean).length === 1 ? 'o item' : `os ${proposta.marcados.filter(Boolean).length}`}`}
            onPress={registrarPrescritos}
            loading={saving}
            disabled={proposta.marcados.every(m => !m)}
          />
          {/* "Agora não" não perde nada: os itens continuam guardados na receita, e o cartão dela os mostra. */}
          <Button label="Agora não" onPress={() => setProposta(null)} variant="ghost" />
        </View>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 },
  itemPrescrito: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 10 },
  destino: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
})
