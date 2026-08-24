import { isOrderDocumentType } from '@sintera/core'

// INVARIANTE DE INCERTEZA (H-09 · DEV-001 §4b) ────────────────────────────────────────────────────────
// Regra permanente de domínio: quando a evidência NÃO é suficiente para determinar o tipo documental, o
// sistema PRESERVA a incerteza — nunca a converte numa categoria semântica mais específica por fallback.
// O caso que originou isto: uma leitura de imagem (DUE) que FALHOU era promovida a "exame de imagem
// realizado" (document_type='imaging', status='processed'), transformando um PEDIDO em exame realizado.
//
// Estado NÃO-DETERMINADO devolvido por esta função:
//  · document_type = null  → identidade write-once ABERTA (identityEstablished=false) ⇒ o reprocesso
//    reavalia com uma DUE funcionando, em vez de congelar uma classificação errada.
//  · extractor_family = null → não afirma família (não "imaging").
//  · status = 'pending' → NÃO 'processed' ⇒ não é um exame realizado; fica para revisão/reprocessamento.
// A rastreabilidade (understanding_report com a trilha de decisão da falha) é preservada à parte, no
// caminho de persistência — este patch nunca a apaga.

export interface UndeterminedDocumentPatch {
  document_type: null
  document_scope: null
  extractor_family: null
  document_identity_status: 'draft'
  status: 'pending'
}

/** Patch de estado NÃO-DETERMINADO / pending para um documento cuja natureza não pôde ser determinada. */
export function undeterminedDocumentPatch(): UndeterminedDocumentPatch {
  return {
    document_type: null,
    document_scope: null,
    extractor_family: null,
    document_identity_status: 'draft',
    status: 'pending',
  }
}

// GÊNERO DOCUMENTAL vence MODALIDADE clínica (H-09 · camada 2) ─────────────────────────────────────────
// Numa imagem cuja DUE teve SUCESSO, o tipo lido pela DUE prevalece sobre a classificação estrutural por
// conteúdo quando é uma categoria de GÊNERO reconhecida:
//   · modalidade de imagem (imaging/ophthalmology) → document_only nomeado pela imagem (comportamento legado);
//   · GÊNERO de ORDEM (medical_order/insurance_guide) → é um PEDIDO → roteia para "Pedidos de exames".
// Um pedido reconhecido pela DUE NUNCA é materializado como exame realizado: um PEDIDO de Doppler não vira
// "exame de imagem" só porque a modalidade solicitada é de imagem (a modalidade não é o gênero do documento).
// Fora desses casos, mantém o tipo estrutural (comportamento legado inalterado).
export function resolveImageDocumentType(dueDocumentType: string | null | undefined, structureDocumentType: string): string {
  if (dueDocumentType === 'imaging' || dueDocumentType === 'ophthalmology') return dueDocumentType
  if (isOrderDocumentType(dueDocumentType)) return dueDocumentType as string
  return structureDocumentType
}
