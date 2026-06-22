// Rótulos dos domínios ômicos (client-safe — sem imports de servidor).
export type OmicsDomain =
  | 'metabolomics' | 'proteomics' | 'microbiome' | 'genetics' | 'epigenetics' | 'exposomics'

export const DOMAIN_LABEL: Record<OmicsDomain, string> = {
  metabolomics: 'Metabolômica', proteomics: 'Proteômica', microbiome: 'Microbioma',
  genetics: 'Genética', epigenetics: 'Epigenética', exposomics: 'Exposômica',
}

export const DOMAINS = Object.keys(DOMAIN_LABEL) as OmicsDomain[]

export function fmtOmicsDate(date: string | null | undefined): string {
  if (!date) return ''
  return new Date(date.length <= 10 ? `${date}T00:00:00` : date)
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}
