// ============================================================
// Sistema de textos — FONTE ÚNICA de frases canônicas da SINTERA
// ============================================================
// Mesmo estado ⇒ mesma frase, em toda a plataforma. Evita que a mesma
// situação apareça como "Documento enviado" numa tela e "Upload concluído"
// noutra. Texto factual, calmo, sem juízo clínico (RDC 657).
// Ver tests/contracts/_invariants.contract.test.ts (texto canônico) e
// Claude/MAPA_DE_ESTADOS.md (Biblioteca de Estados).
// ============================================================

/** Frases canônicas. Use SEMPRE estas — nunca redigite uma variante. */
export const COPY = {
  // sucesso
  documentSent: 'Documento enviado',
  purchaseRegistered: 'Compra registrada',
  linkGenerated: 'Link gerado',
  // erro
  imageUnreadable: 'Não consegui ler a imagem',
  // pendência
  awaitingConfirmation: 'Aguardando confirmação',
} as const

export type CopyKey = keyof typeof COPY

/**
 * Variantes PROIBIDAS por frase canônica — a mesma situação não pode
 * aparecer com nomes diferentes. Validado em copy.test.ts.
 */
export const FORBIDDEN_VARIANTS: Record<CopyKey, readonly string[]> = {
  documentSent: ['Arquivo recebido', 'Upload concluído', 'Arquivo salvo'],
  purchaseRegistered: ['Compra salva', 'Compra concluída'],
  linkGenerated: ['Link criado', 'Compartilhamento concluído'],
  imageUnreadable: ['Falha no OCR', 'Erro de processamento', 'Erro de leitura'],
  awaitingConfirmation: ['Em análise', 'Pendente de revisão'],
}

/** Acesso seguro à frase canônica (use no lugar de string literal). */
export function copy(key: CopyKey): string {
  return COPY[key]
}

/**
 * Avisos regulatórios (RDC 657) CANÔNICOS — fonte única.
 * Consolidam as ~12 redações que estavam espalhadas à mão pelas telas.
 * Substância preservada das versões já vetadas (não reinterpreta a norma);
 * a redação final é decisão regulatória da fundadora. Renderizar via <Disclaimer>.
 */
export const DISCLAIMERS = {
  /** Uso geral (histórico, insights, evolução). */
  geral: 'Não substitui avaliação profissional nem constitui diagnóstico (RDC 657/2022).',
  /** Registros autorrelatados (condições, hábitos, medidas, sinais, recursos). */
  registro: 'Registro seu — a SINTERA não interpreta nem infere. Leve os dados ao seu profissional de saúde.',
  /** Extração/reprodução de laudos laboratoriais (exames, ômica, biomarcadores). */
  laudo: 'Reprodução estruturada dos seus laudos — não constitui diagnóstico nem avaliação clínica.',
  /** Medicamentos e suplementos. */
  medicamento: 'A SINTERA organiza — não é prescrição nem orientação de dose. Quem prescreve é o seu médico.',
  /** Valores calculados/estimados (IMC). */
  estimativa: 'Estimativa calculada a partir dos seus dados — não substitui a avaliação profissional.',
  /** Ciclo menstrual — previsões de data (preserva a ressalva contraceptiva vetada). */
  ciclo: 'Estimativa calculada a partir das suas datas — não é método contraceptivo nem diagnóstico.',
  /** Relatório e compartilhamento. */
  relatorio: 'Documento factual para acompanhamento — não substitui a avaliação profissional (RDC 657/2022).',
} as const

export type DisclaimerVariant = keyof typeof DISCLAIMERS
