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
 * Avisos regulatórios (RDC 657/2022) CANÔNICOS — fonte única.
 * Consolidam as ~12 redações que estavam espalhadas à mão pelas telas.
 * Substância preservada das versões já vetadas (não reinterpreta a norma);
 * a redação final é decisão regulatória da fundadora. Renderizar via <Disclaimer>.
 *
 * FUNDAMENTAÇÃO (rastreabilidade): a SINTERA apenas organiza informações, SEM
 * finalidade clínica, diagnóstica ou terapêutica → não atende à definição de
 * dispositivo médico (RDC 657/2022, Art. 2º, VII) e recai na exclusão do
 * Art. 1º, § 2º, IV (reforçada pelo III) → fora do escopo como SaMD.
 * REDAÇÃO: a referência é INTEGRADA e "observa/está em consonância" com a norma —
 * nunca "em conformidade com o texto" (a RDC não prescreve o texto do aviso).
 * Enquadramento definitivo = matéria de parecer jurídico-regulatório.
 */
export const DISCLAIMERS = {
  /** Uso geral: histórico, insights, agenda, saúde, timeline E registros autorrelatados (condições, hábitos, medidas, sinais, recursos). */
  geral: 'As informações apresentadas têm caráter organizacional e não substituem a avaliação de um profissional de saúde, nem constituem diagnóstico, prescrição ou orientação clínica, observando os limites de atuação definidos pela RDC 657/2022.',
  /** Extração/reprodução de laudos laboratoriais (exames, ômica, biomarcadores). */
  laudo: 'Os dados apresentados correspondem à organização das informações contidas em seus laudos, preservando seu conteúdo original. Não constituem diagnóstico nem avaliação clínica, em consonância com o enquadramento regulatório da plataforma (RDC 657/2022).',
  /** Medicamentos e suplementos. */
  medicamento: 'A SINTERA organiza informações sobre medicamentos e suplementos. Não realiza prescrições nem fornece orientações de tratamento ou dosagem, observando os limites de atuação definidos pela RDC 657/2022.',
  /** Valores calculados/estimados (IMC). */
  estimativa: 'Os valores apresentados são calculados automaticamente a partir dos dados informados pelo usuário e possuem finalidade exclusivamente organizacional. Não substituem a avaliação de um profissional de saúde, em consonância com o enquadramento regulatório da plataforma (RDC 657/2022).',
  /** Ciclo menstrual — PRESERVA a ressalva contraceptiva (requisito regulatório específico; NÃO dobrar em outra variante). */
  ciclo: 'As estimativas são calculadas a partir das informações registradas pelo usuário e possuem finalidade exclusivamente organizacional. Não constituem método contraceptivo, diagnóstico ou orientação médica, observando os limites de atuação definidos pela RDC 657/2022.',
  /** Relatório e compartilhamento (documento que sai da plataforma → texto tailored). */
  relatorio: 'Este relatório organiza informações registradas e documentos enviados pelo usuário para facilitar o acompanhamento da sua saúde. Não substitui avaliação, diagnóstico ou conduta definidos por um profissional de saúde, em consonância com o enquadramento regulatório adotado pela plataforma (RDC 657/2022).',
} as const

export type DisclaimerVariant = keyof typeof DISCLAIMERS
