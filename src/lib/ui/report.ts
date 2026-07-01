// ============================================================
// ReportSection — modelo de composição do Relatório (sem domínio)
// ============================================================
// O Relatório é uma NARRATIVA composta por seções ordenáveis e ocultáveis.
// Nunca cria conhecimento novo — só organiza/contextualiza/apresenta (RDC 657).
// Mesmo contrato serve web · PDF · impressão · compartilhamento.
// ============================================================

export interface ReportSectionModel {
  id: string
  title: string
  subtitle?: string
  order: number
  visible: boolean
}

/** Seções visíveis, na ordem definida. Puro. */
export function orderedVisible(sections: ReportSectionModel[]): ReportSectionModel[] {
  return sections.filter((s) => s.visible).sort((a, b) => a.order - b.order)
}
