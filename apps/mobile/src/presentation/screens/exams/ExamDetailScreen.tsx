// Detalhe do Exame — PARIDADE com a Web (src/app/dashboard/exams/[id]). COMPOSIÇÃO de primitivos DS + `useExam`
// (sem rede/domínio aqui). FRONTEIRA REG-001: exibe os campos + resultados + leva ao DOCUMENTO ORIGINAL (fonte
// da verdade); nunca interpreta. Regras puras vêm do @sintera/core (fonte única com a Web).
import { useEffect, useState } from 'react'
import { ScrollView, View, ActivityIndicator, Alert, Share, Pressable, StyleSheet } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { text } from '@sintera/design-system'
import type { ExamDTO, ExamExtractionLog } from '@sintera/api-client'
import { deriveExamIdentity, isOrderDocumentType, careStageFor, CARE_STAGES, compareNames, selectByLink, biomarkerStatusLabel, effectiveOrderStatus, orderStatusLabel } from '@sintera/core'
import { AttachmentLink, Button, Disclaimer, FieldRow, Input, Text, DatePicker } from '../../primitives'
import { useTheme } from '../../theme'
import type { MinhaSaudeStackParamList } from '../../navigation/types'
import { apiClient } from '../../../infrastructure/apiClient'
import { useExam } from './useExam'
import { examStatusLabel, isExamFailed, isExamReady } from './examStatus'
import { formatExamDate } from './examFormat'
import { ResultsSection } from './ResultsSection'
import { FinancialSection } from './FinancialSection'

type Props = NativeStackScreenProps<MinhaSaudeStackParamList, 'ExamDetail'>

export function ExamDetailScreen({ route, navigation }: Props) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const p = useExam(route.params.id)

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [editingDate, setEditingDate] = useState(false)
  const [dateValue, setDateValue] = useState('')
  const [reportOpen, setReportOpen] = useState(false)
  const [reportText, setReportText] = useState('')
  const [reportSent, setReportSent] = useState(false)
  const [orders, setOrders] = useState<ExamDTO[]>([])
  const [pickOrder, setPickOrder] = useState(false)
  const [profileName, setProfileName] = useState<string | null>(null)
  const [linkedStatuses, setLinkedStatuses] = useState<string[]>([])
  const [lastLog, setLastLog] = useState<ExamExtractionLog | null>(null)

  // Nome do perfil — para a conferência de identidade (exame de outra pessoa).
  useEffect(() => {
    let alive = true
    apiClient.profile.getProfile().then(pr => { if (alive) setProfileName(pr?.name ?? null) }).catch(() => {})
    return () => { alive = false }
  }, [])

  // Eventos vinculados a este exame (Agenda) — status para o fluxo assistencial (agendado ≠ realizado).
  useEffect(() => {
    const ex = p.exam
    if (!ex) return
    let alive = true
    apiClient.agenda.listEvents()
      .then(evs => { if (alive) setLinkedStatuses(selectByLink(evs, 'exam', ex.id).map(e => e.status)) })
      .catch(() => {})
    return () => { alive = false }
  }, [p.exam])

  // Última extração bem-sucedida (informativo — paridade Web). Falha silenciosa.
  useEffect(() => {
    const ex = p.exam
    if (!ex) return
    let alive = true
    apiClient.exams.getLastExtractionLog(ex.id)
      .then(l => { if (alive) setLastLog(l) })
      .catch(() => {})
    return () => { alive = false }
  }, [p.exam])

  const exam = p.exam
  const isOrderDoc = isOrderDocumentType(exam?.document_type)

  // Pedidos candidatos a ORIGEM (Q1) — só para RESULTADOS. Reusa listExams (RLS limita ao usuário).
  useEffect(() => {
    if (!exam || isOrderDoc) return
    let alive = true
    apiClient.exams.listExams()
      .then(list => { if (alive) setOrders(list.filter(o => isOrderDocumentType(o.document_type) && o.id !== exam.id)) })
      .catch(() => {})
    return () => { alive = false }
  }, [exam, isOrderDoc])

  const onDelete = () => {
    Alert.alert('Excluir exame', 'Esta ação é irreversível. O documento e os dados extraídos serão apagados. O seu Histórico é recalculado.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        const { error } = await p.remove()
        if (error) { Alert.alert('Não foi possível excluir', 'Tente novamente mais tarde.'); return }
        navigation.goBack()
      } },
    ])
  }

  // Compartilhar nativo COM os dados (equivalente ao "exportar dados/CSV" da Web, pelo mecanismo do dispositivo):
  // além do documento, inclui os resultados estruturados (nome · valor · unidade · situação).
  const onShare = () => {
    if (!exam) return
    // PEDIDO-002: honrar display_title (título clínico do conteúdo; p/ pedido = procedimentos solicitados).
  const { name, lab } = deriveExamIdentity(exam.type, exam.issuer, exam.display_title)
    const results = p.biomarkers.map(b => {
      const v = b.value != null ? String(b.value) : (b.value_text ?? '')
      const situ = biomarkerStatusLabel(b)
      return `• ${b.name}: ${v}${b.unit ? ` ${b.unit}` : ''}${situ ? ` (${situ})` : ''}`
    })
    const parts = [
      `${name}${lab ? ` · ${lab}` : ''}`,
      (() => { const d = formatExamDate(exam.exam_date); return d === 'Sem data' ? 'Data de realização não informada' : `Realizado em ${d}` })(),
      ...(results.length ? ['', 'Resultados:', ...results] : []),
      exam.file_url ?? '',
    ]
    void Share.share({ message: parts.filter(Boolean).join('\n') })
  }

  async function submitReport() {
    if (!reportText.trim()) return
    await p.reportProblem(reportText.trim())
    setReportSent(true); setReportText('')
    setTimeout(() => { setReportOpen(false); setReportSent(false) }, 2000)
  }

  if (p.phase === 'idle' || p.phase === 'loading') {
    return (
      <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}>
        <ActivityIndicator color={t.color.identity.primary} />
        <Text spec={text(t, { role: 'body', tone: 'muted' })}>Carregando o exame…</Text>
      </View>
    )
  }
  if (p.phase === 'error') {
    return (
      <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}>
        <Text spec={text(t, { role: 'body' })} style={{ color: t.color.badge.error.text, textAlign: 'center' }}>
          {p.error ?? 'Não foi possível carregar o exame.'}
        </Text>
        <Button label="Tentar novamente" variant="secondary" onPress={p.retry} />
      </View>
    )
  }
  if (!exam) {
    return (
      <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}>
        <Text spec={text(t, { role: 'body', tone: 'muted' })}>Exame não encontrado.</Text>
      </View>
    )
  }

  // PEDIDO-002: honrar display_title (título clínico do conteúdo; p/ pedido = procedimentos solicitados).
  const { name, lab } = deriveExamIdentity(exam.type, exam.issuer, exam.display_title)
  const hasResults = p.biomarkers.length > 0 || (p.clinical?.items.length ?? 0) > 0
  const stage = careStageFor({ hasResult: hasResults, isOrder: isOrderDoc, linkedEventStatuses: linkedStatuses })
  const isProcessed = isExamReady(exam.status)
  const linkedOrder = orders.find(o => o.id === exam.fulfills_order_id) ?? null
  const card = { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }

  return (
    <ScrollView style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[styles.content, { paddingTop: styles.content.padding + insets.top, paddingBottom: styles.content.padding + insets.bottom }]}
      keyboardShouldPersistTaps="handled">

      {/* Conferência de identidade (paciente no laudo × perfil) */}
      {exam.patient_name ? (
        compareNames(profileName, exam.patient_name) === 'mismatch' ? (
          <View style={[styles.banner, { backgroundColor: t.color.badge.error.soft, borderColor: t.color.badge.error.text }]}>
            <Text spec={text(t, { role: 'bodySmall' })} style={{ color: t.color.badge.error.text }}>
              Confira: este exame parece ser de outra pessoa. Nome no laudo: {exam.patient_name}
              {profileName ? ` · seu perfil: ${profileName}` : ''}. Se não for seu, exclua-o.
            </Text>
          </View>
        ) : (
          <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Paciente no laudo: {exam.patient_name}</Text>
        )
      ) : null}

      {/* Fluxo assistencial */}
      {stage ? (
        <View style={styles.stepper}>
          {CARE_STAGES.map((s, i) => {
            const reached = CARE_STAGES.findIndex(x => x.key === stage) >= i
            return (
              <View key={s.key} style={styles.step}>
                <Text spec={text(t, { role: 'caption', tone: reached ? 'default' : 'faint' })}
                  style={reached ? { color: t.color.identity.primary } : undefined}>{s.label}</Text>
                {i < CARE_STAGES.length - 1 ? <Text spec={text(t, { role: 'caption', tone: 'faint' })}>›</Text> : null}
              </View>
            )
          })}
        </View>
      ) : null}

      {/* Cabeçalho: nome (editável) + lab + solicitante + data (editável) + páginas */}
      <View style={[styles.card, card, { gap: 8 }]}>
        {editingName ? (
          <View style={styles.editRow}>
            <Input value={nameValue} onChangeText={setNameValue} placeholder="Nome do exame" style={{ flex: 1 }} autoFocus />
            <Button label="OK" onPress={async () => { if (nameValue.trim()) await p.updateFields({ type: nameValue.trim() }); setEditingName(false) }} />
            <Button label="Cancelar" variant="secondary" onPress={() => setEditingName(false)} />
          </View>
        ) : (
          <Pressable onLongPress={() => { setNameValue(exam.type ?? name); setEditingName(true) }}>
            <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 20 }}>{name}</Text>
          </Pressable>
        )}
        {lab ? <Text spec={text(t, { role: 'body', tone: 'muted' })}>{lab}</Text> : null}
        {exam.requesting_physician ? <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Solicitante: {exam.requesting_physician}</Text> : null}

        {editingDate ? (
          <View style={styles.editRow}>
            <DatePicker value={dateValue} onChange={setDateValue} placeholder="Data" style={{ flex: 1 }} />
            <Button label="OK" onPress={async () => { if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) await p.updateFields({ exam_date: dateValue }); setEditingDate(false) }} />
            <Button label="Cancelar" variant="secondary" onPress={() => setEditingDate(false)} />
          </View>
        ) : (
          <Pressable onLongPress={() => { setDateValue(exam.exam_date ?? ''); setEditingDate(true) }}>
            <Text spec={text(t, { role: 'caption', tone: 'muted' })}>
              {(() => { const d = formatExamDate(exam.exam_date); const none = isOrderDoc ? 'Data de solicitação não informada' : 'Data de realização não informada'; const feito = isOrderDoc ? 'Solicitado em' : 'Realizado em'; return d === 'Sem data' ? none : `${feito} ${d}` })()}{exam.page_count ? ` · ${exam.page_count} página${exam.page_count > 1 ? 's' : ''}` : ''}
            </Text>
          </Pressable>
        )}
        <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Toque e segure no nome ou na data para editar.</Text>

        {/* Status de EXTRAÇÃO (processando/processado) é semântica de RESULTADO — não exibir em pedido. */}
        {!isOrderDoc && examStatusLabel(exam.status) ? (
          <Text spec={text(t, { role: 'caption', tone: 'muted' })} style={isExamFailed(exam.status) ? { color: t.color.badge.error.text } : undefined}>
            {examStatusLabel(exam.status)}
          </Text>
        ) : null}
        {/* Status do PEDIDO (pendente/realizado/finalizado) — semântica própria de solicitação. */}
        {isOrderDoc ? (
          <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Status: {orderStatusLabel(effectiveOrderStatus(exam.order_status, 0))}</Text>
        ) : null}
      </View>

      {/* Avisos */}
      {exam.text_truncated ? (
        <View style={[styles.banner, { backgroundColor: t.color.badge.attention.soft, borderColor: t.color.badge.attention.text }]}>
          <Text spec={text(t, { role: 'bodySmall' })} style={{ color: t.color.badge.attention.text }}>
            Documento extenso, processado parcialmente. Alguns resultados podem não ter sido extraídos — use "Extrair novamente" ou confira o documento original.
          </Text>
        </View>
      ) : null}
      {p.analyze.error ? (
        <View style={[styles.banner, { backgroundColor: t.color.badge.error.soft, borderColor: t.color.badge.error.text }]}>
          <Text spec={text(t, { role: 'bodySmall' })} style={{ color: t.color.badge.error.text }}>{p.analyze.error}</Text>
        </View>
      ) : null}
      {p.analyze.notice ? (
        <View style={[styles.banner, card]}>
          <Text spec={text(t, { role: 'bodySmall', tone: 'muted' })}>{p.analyze.notice}</Text>
        </View>
      ) : null}

      {/* PEDIDO-002 — SEPARAÇÃO SEMÂNTICA: um PEDIDO (medical_order/insurance_guide) mostra os PROCEDIMENTOS
          SOLICITADOS e NUNCA "Resultados estruturados"/clinical_results. Só RESULTADO renderiza a ResultsSection. */}
      {isOrderDoc ? (
        <View style={[styles.card, card, { gap: 8 }]}>
          <Text spec={text(t, { role: 'bodyStrong' })}>Procedimentos solicitados</Text>
          {p.biomarkers.length > 0 ? (
            p.biomarkers.map((b, i) => (
              <Text key={b.id ?? i} spec={text(t, { role: 'body', tone: 'muted' })}>• {b.source_exam_name ?? b.name}</Text>
            ))
          ) : (
            <Text spec={text(t, { role: 'body', tone: 'muted' })}>Consulte o documento original para os procedimentos solicitados.</Text>
          )}
          <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Isto é um pedido/solicitação — não é um resultado de exame realizado.</Text>
        </View>
      ) : (
        <ResultsSection exam={exam} biomarkers={p.biomarkers} clinical={p.clinical} analyzing={p.analyze.running} />
      )}

      {/* Última extração (informativo — paridade Web) */}
      {lastLog ? (
        <Text spec={text(t, { role: 'caption', tone: 'faint' })}>
          Última extração: {formatExamDate(lastLog.started_at)}{lastLog.parse_repaired ? ' · reparado automaticamente' : ''}{lastLog.extraction_path === 'pdf_native' ? ' · leitura nativa PDF' : ''}
        </Text>
      ) : null}

      {/* Financeiro */}
      <FinancialSection exam={exam} onSave={p.updateFields} />

      {/* Recorrência — cria um Evento Assistencial (lembrete) no domínio Agenda, vinculado a este exame.
          "Repetir este exame" é semântica de RESULTADO — não faz sentido para um pedido. */}
      {!isOrderDoc ? (
      <View style={[styles.card, card, { gap: 8 }]}>
        <Text spec={text(t, { role: 'bodyStrong' })}>Repetir este exame</Text>
        <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Crie um lembrete de repetição periódica — aparece na sua Agenda.</Text>
        <Button label="Criar lembrete de repetição" variant="secondary"
          onPress={() => (navigation.getParent() as { navigate: (n: string, p: unknown) => void } | undefined)?.navigate('Agenda', {
            screen: 'EventForm',
            params: { prefill: { type: 'exame', title: `Repetir ${name}`, examId: exam.id, recurrence: true } },
          })} />
      </View>
      ) : null}

      {/* Pedido de origem (Q1) — só para resultados (não-pedido) */}
      {!isOrderDoc ? (
        <View style={[styles.card, card, { gap: 8 }]}>
          <Text spec={text(t, { role: 'bodyStrong' })}>Pedido de origem</Text>
          {linkedOrder ? (
            <View style={styles.editRow}>
              <Text spec={text(t, { role: 'bodySmall' })} style={{ flex: 1 }}>
                {linkedOrder.type ?? 'Pedido médico'}{linkedOrder.requesting_physician ? ` · ${linkedOrder.requesting_physician}` : ''}
              </Text>
              <Button label="Desvincular" variant="secondary" onPress={() => p.updateFields({ fulfills_order_id: null })} />
            </View>
          ) : orders.length === 0 ? (
            <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Nenhum pedido cadastrado para vincular.</Text>
          ) : pickOrder ? (
            <View style={{ gap: 6 }}>
              {orders.map(o => (
                <Pressable key={o.id} onPress={() => { p.updateFields({ fulfills_order_id: o.id }); setPickOrder(false) }}
                  style={[styles.orderRow, { borderColor: t.color.border.default }]}>
                  <Text spec={text(t, { role: 'bodySmall' })}>
                    {o.type ?? 'Pedido médico'}{o.requesting_physician ? ` — ${o.requesting_physician}` : ''} · {formatExamDate(o.exam_date)}
                  </Text>
                </Pressable>
              ))}
              <Button label="Cancelar" variant="secondary" onPress={() => setPickOrder(false)} />
            </View>
          ) : (
            <>
              <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Vincule este resultado ao pedido que o originou (rastreabilidade).</Text>
              <Button label="Vincular a um pedido" variant="secondary" onPress={() => setPickOrder(true)} />
            </>
          )}
        </View>
      ) : null}

      {/* Ações */}
      <View style={{ gap: 8 }}>
        {exam.file_url ? (
          <Button label={isProcessed ? 'Extrair novamente' : 'Extrair dados'} variant="secondary"
            onPress={p.reanalyze} loading={p.analyze.running} loadingLabel="Extraindo…" />
        ) : null}
        <AttachmentLink url={exam.file_url} />
        <Button label="Compartilhar" variant="secondary" onPress={onShare} />
        <Button label="Reportar problema" variant="secondary" onPress={() => setReportOpen(v => !v)} />
      </View>

      {/* Reportar problema (inline) */}
      {reportOpen ? (
        <View style={[styles.card, card, { gap: 8 }]}>
          {reportSent ? (
            <Text spec={text(t, { role: 'bodySmall' })} style={{ color: t.color.badge.success.text }}>Obrigada pelo relato! Vamos investigar.</Text>
          ) : (
            <>
              <Text spec={text(t, { role: 'bodySmall', tone: 'muted' })}>
                Encontrou um valor incorreto, resultado ausente ou outro problema? Descreva abaixo — ajuda a melhorar a extração.
              </Text>
              <Input value={reportText} onChangeText={setReportText} placeholder="Descreva o problema…" multiline
                style={{ minHeight: 80, textAlignVertical: 'top' }} />
              <View style={styles.actions}>
                <Button label="Cancelar" variant="secondary" onPress={() => setReportOpen(false)} />
                <Button label="Enviar relato" onPress={submitReport} />
              </View>
            </>
          )}
        </View>
      ) : null}

      <Button label="Excluir exame" variant="secondary" onPress={onDelete} />

      <Disclaimer variant="laudo" />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  banner: { borderWidth: 1, borderRadius: 12, padding: 12 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  stepper: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderRow: { borderWidth: 1, borderRadius: 12, padding: 10 },
})
