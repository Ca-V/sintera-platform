// E5 — taxonomia ABERTA de categorias de exame. FONTE ÚNICA movida para `@sintera/core`
// (domain/exams/categories) para paridade Web+Mobile. Este módulo só re-exporta, mantendo o
// caminho de import estável na Web (@/lib/capture/exam-categories).
export { categoryOf, knownCategories, FALLBACK_CATEGORY, type ExamCategory } from '@sintera/core'
