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
