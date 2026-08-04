// Seção FINANCEIRO do exame (FB-008 — paridade Web): valor pago + tipo de documento fiscal + UPLOAD do anexo
// (NF/recibo) + visualização. O financeiro é ATRIBUTO do próprio exame (colunas expense_*), não Evento separado.
// Reutiliza contratos: documentPicker (upload nativo) + apiClient.exams.uploadExam + updateExam. Regras puras
// (tipos fiscais, parse de valor) vêm do @sintera/core (fonte única com a Web).
import { useState } from 'react'
import { View, Pressable, Linking, StyleSheet } from 'react-native'
import { text } from '@sintera/design-system'
import type { ExamDetailDTO, ExamFieldsPatch } from '@sintera/api-client'
import { EXPENSE_DOC_TYPES, expenseDocLabel, parseAmountToCents, centsToAmount } from '@sintera/core'
import { Text, Button, Input } from '../../primitives'
import { useTheme } from '../../theme'
import { apiClient } from '../../../infrastructure/apiClient'
import { documentPicker } from '../../../infrastructure/documentPickerAdapter'

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function FinancialSection({ exam, onSave }: {
  exam: ExamDetailDTO
  onSave: (patch: ExamFieldsPatch) => Promise<{ error: Error | null }>
}) {
  const t = useTheme()
  const [editing, setEditing] = useState(false)
  const [amount, setAmount] = useState('')
  const [docType, setDocType] = useState('')
  const [docUrl, setDocUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const hasValue = (exam.expense_amount_cents ?? 0) > 0
  const card = { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }

  function startEdit() {
    setAmount(exam.expense_amount_cents ? centsToAmount(exam.expense_amount_cents) : '')
    setDocType(exam.expense_doc_type ?? '')
    setDocUrl(exam.expense_doc_url ?? null)
    setEditing(true)
  }

  async function pickDoc() {
    setUploading(true)
    try {
      const file = await documentPicker.pickDocument()
      if (!file) return
      const { data, error } = await apiClient.exams.uploadExam({
        uri: file.uri, mimeType: file.mimeType ?? 'application/octet-stream', sizeBytes: file.sizeBytes,
      })
      if (!error && data) setDocUrl(data.url)
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    setSaving(true)
    try {
      await onSave({
        expense_amount_cents: parseAmountToCents(amount),
        expense_doc_type: docType || null,
        expense_doc_url: docUrl,
      })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={[styles.card, card]}>
      <Text spec={text(t, { role: 'bodyStrong' })}>Financeiro e acompanhamento</Text>

      {editing ? (
        <View style={{ gap: 12, marginTop: 8 }}>
          <View>
            <Text spec={text(t, { role: 'label', tone: 'muted' })}>VALOR PAGO — R$</Text>
            <Input value={amount} onChangeText={setAmount} placeholder="250,00" keyboardType="decimal-pad" />
          </View>
          <View>
            <Text spec={text(t, { role: 'label', tone: 'muted' })}>TIPO DE DOCUMENTO</Text>
            <View style={styles.chips}>
              {EXPENSE_DOC_TYPES.map(d => {
                const on = docType === d.id
                return (
                  <Pressable key={d.id} onPress={() => setDocType(on ? '' : d.id)}
                    style={[styles.chip, { borderColor: on ? t.color.identity.primary : t.color.border.default,
                      backgroundColor: on ? t.color.badge.info.soft : 'transparent' }]}>
                    <Text spec={text(t, { role: 'caption', tone: on ? 'default' : 'muted' })}>{d.label}</Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
          <View>
            <Text spec={text(t, { role: 'label', tone: 'muted' })}>ANEXO (NF/RECIBO/COMPROVANTE)</Text>
            <Button label={docUrl ? 'Trocar anexo' : 'Anexar documento'} variant="secondary"
              onPress={pickDoc} loading={uploading} loadingLabel="Enviando…" />
            {docUrl ? <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Documento anexado ✓</Text> : null}
          </View>
          <View style={styles.actions}>
            <Button label="Cancelar" variant="secondary" onPress={() => setEditing(false)} />
            <Button label="Salvar" onPress={save} loading={saving} loadingLabel="Salvando…" />
          </View>
        </View>
      ) : hasValue ? (
        <View style={{ marginTop: 8, gap: 4 }}>
          <Text spec={text(t, { role: 'label', tone: 'muted' })}>VALOR PAGO</Text>
          <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 20 }}>{formatBRL(exam.expense_amount_cents ?? 0)}</Text>
          {exam.expense_doc_url ? (
            <Pressable onPress={() => Linking.openURL(exam.expense_doc_url as string)}>
              <Text spec={text(t, { role: 'bodySmall' })} style={{ color: t.color.identity.primary }}>
                {expenseDocLabel(exam.expense_doc_type) ?? 'Documento'} →
              </Text>
            </Pressable>
          ) : null}
          <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Aparece em Despesas e Relatórios.</Text>
          <View style={{ marginTop: 6 }}><Button label="Editar" variant="secondary" onPress={startEdit} /></View>
        </View>
      ) : (
        <View style={{ marginTop: 8, gap: 8 }}>
          <Text spec={text(t, { role: 'bodySmall', tone: 'muted' })}>
            Registre o valor pago e anexe a nota fiscal, recibo ou comprovante — fica no próprio exame e aparece
            em Despesas e Relatórios.
          </Text>
          <Button label="Registrar valor / NF" onPress={startEdit} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
})
