// @sintera/core — E5: taxonomia ABERTA de categorias de exame (Modelo Aberto). Fonte ÚNICA Web+Mobile.
//
// Decisão da fundadora (14/07/2026): categorias abertas/escaláveis; ÔMICAS é UMA categoria, não um fluxo próprio
// nem conceito privilegiado. A capacidade madura de ômicas permanece como PROCESSADOR/REPRESENTAÇÃO dessa
// categoria — como o laboratório via Laboratory Adapter. Aqui mora só a CLASSIFICAÇÃO aberta.
//
// Modelo Aberto: a taxonomia representa CLASSES, extensível SEM mudança estrutural. Um documentType novo (ou
// desconhecido) NUNCA quebra — cai numa categoria genérica. Adicionar uma categoria é adicionar uma linha.

export interface ExamCategory {
  /** Slug estável e aberto da categoria (não é enum fechado — apenas string). */
  key: string
  /** Rótulo de exibição (pt-BR). */
  label: string
}

// Mapa ABERTO documentType → categoria. Ômicas aparece com a MESMA forma das demais (sem privilégio estrutural).
const CATEGORY_BY_TYPE: Record<string, ExamCategory> = {
  laboratory:       { key: 'laboratory',       label: 'Laboratorial' },
  imaging:          { key: 'imaging',          label: 'Imagem' },
  neurophysiology:  { key: 'neurophysiology',  label: 'Neurofisiologia' },
  ophthalmology:    { key: 'ophthalmology',    label: 'Oftalmologia' },
  cardiology:       { key: 'cardiology',       label: 'Cardiologia' },
  endoscopy:        { key: 'endoscopy',        label: 'Endoscopia' },
  anatomopathology: { key: 'anatomopathology', label: 'Anatomia patológica' },
  omics:            { key: 'omics',            label: 'Ômica' },
}

/** Categoria genérica para tipos ausentes/desconhecidos — a taxonomia nunca quebra (Modelo Aberto). */
export const FALLBACK_CATEGORY: ExamCategory = { key: 'other', label: 'Outros exames' }

/** Deriva a categoria (aberta) a partir do documentType. Determinística; nunca lança. */
export function categoryOf(documentType: string | null | undefined): ExamCategory {
  const t = (documentType ?? '').trim().toLowerCase()
  return CATEGORY_BY_TYPE[t] ?? FALLBACK_CATEGORY
}

/** Categorias conhecidas (para filtros/agrupamento na UI). Ordem = ordem de apresentação. */
export function knownCategories(): ExamCategory[] {
  return Object.values(CATEGORY_BY_TYPE)
}
