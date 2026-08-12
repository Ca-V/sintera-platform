// Rótulos dos domínios ômicos + formatação de data — espelho client-safe do
// src/lib/omics/domains.ts da Web (o Mobile não importa da árvore da Web).
export const DOMAIN_LABEL: Record<string, string> = {
  metabolomics: 'Metabolômica',
  proteomics: 'Proteômica',
  microbiome: 'Microbioma',
  genetics: 'Genética',
  epigenetics: 'Epigenética',
  exposomics: 'Exposômica',
}

export function fmtOmicsDate(date: string | null | undefined): string {
  if (!date) return ''
  return new Date(date.length <= 10 ? `${date}T00:00:00` : date)
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}
