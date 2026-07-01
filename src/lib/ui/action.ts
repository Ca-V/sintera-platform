// ============================================================
// CardAction — contrato ÚNICO de ação de card
// ============================================================
// Uma ação exibível: rótulo + (onClick OU href). Usado por StateView,
// ItemCard, SituationCard — antes cada um definia o seu, idêntico.
// ============================================================

export interface CardAction {
  label: string
  onClick?: () => void
  href?: string
}
