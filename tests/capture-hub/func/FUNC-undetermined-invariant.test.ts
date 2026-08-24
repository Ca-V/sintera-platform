// INVARIANTE DE DOMÍNIO (H-09 · DEV-001 §4b) — Preservação da incerteza.
// Regra permanente: quando a evidência NÃO é suficiente para determinar o tipo documental, o sistema
// PRESERVA a incerteza (não-determinado / pending) e NUNCA a converte numa categoria semântica mais
// específica por fallback. Em particular: uma leitura de imagem (DUE) que FALHOU não pode virar
// "exame de imagem realizado". Regressão original: pedido de Doppler (ab5b5816) foi promovido a
// document_type='imaging', status='processed' → apareceu em Exames como exame realizado.

import { describe, it, expect } from 'vitest'
import { undeterminedDocumentPatch } from '@/lib/capture/undetermined'
import { isOrderDocumentType } from '@/lib/exams/classification'

describe('Invariante de incerteza — falha de compreensão NÃO vira categoria específica', () => {
  const patch = undeterminedDocumentPatch()

  it('NUNCA promove a "imaging" (nem a qualquer tipo específico) — document_type é null', () => {
    expect(patch.document_type).toBeNull()
    expect(patch.document_type).not.toBe('imaging')
    expect(patch.document_type).not.toBe('laboratory')
  })

  it('NÃO afirma família de extrator (era "imaging" por fallback) — extractor_family é null', () => {
    expect(patch.extractor_family).toBeNull()
  })

  it('NÃO é um exame realizado — status = "pending" (não "processed")', () => {
    expect(patch.status).toBe('pending')
    expect(patch.status).not.toBe('processed')
  })

  it('mantém a identidade write-once ABERTA (draft) para o reprocesso reavaliar', () => {
    // document_type null ⇒ identityEstablished=false na rota (exam.document_type != null).
    expect(patch.document_type).toBeNull()
    expect(patch.document_identity_status).toBe('draft')
  })

  it('um documento não-determinado NÃO é classificado como pedido nem como exame realizado', () => {
    // Não é pedido (não inventa medical_order)…
    expect(isOrderDocumentType(patch.document_type)).toBe(false)
    // …e não é um resultado realizado (document_type null + status pending).
    expect(patch.document_type).toBeNull()
    expect(patch.status).toBe('pending')
  })
})
