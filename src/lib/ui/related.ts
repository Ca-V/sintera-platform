// ============================================================
// RelatedItems — modelo de apresentação (sem domínio/Estado 2)
// ============================================================
// O componente NÃO conhece exame/medicamento/dispositivo/programa/profissional/
// condição/protocolo/documento/indicador. Recebe sempre um RelatedItem genérico.
// `type` é apenas um RÓTULO de exibição (string livre), não uma união de domínio.
// Materializa o "Relacionado" (EventLink) de qualquer tela, sem acoplamento.
// ============================================================

export interface RelatedItem {
  /** rótulo de exibição, ex.: "Exame", "Documento" — string livre, não domínio */
  type?: string
  title: string
  description?: string
  onOpen?: () => void
  href?: string
}
