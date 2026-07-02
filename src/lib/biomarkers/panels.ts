// Rótulos de painel/material dos biomarcadores (material = specimen, painel = category
// do biomarker_catalog) + agrupador puro. Fonte ÚNICA compartilhada entre o detalhe do
// exame e a Evolução (evita duplicar os mapas). Só apresentação — nomenclatura
// científica/médica/laboratorial curada; nenhuma lógica clínica (RDC 657).

export const SPECIMEN_LABEL: Record<string, string> = {
  sangue:    'Exame de sangue',
  urina:     'Exame de urina',
  urina_24h: 'Exame de urina (24 horas)',
}
export const SPECIMEN_ORDER = ['sangue', 'urina', 'urina_24h']

export const CATEGORY_LABEL: Record<string, string> = {
  hematologia_vermelha:          'Série vermelha',
  hematologia_branca_plaquetas:  'Série branca e plaquetas',
  coagulacao:                    'Coagulação',
  metabolismo_ferro:             'Metabolismo do ferro',
  metabolismo_glicose:           'Glicose',
  funcao_tireoidiana:            'Tireoide',
  inflamacao_imunologia:         'Inflamação e imunologia',
  funcao_hepatica_proteinas:     'Fígado e proteínas',
  funcao_renal_eletrolitos:      'Rins e eletrólitos',
  urina_24h:                     'Urina de 24 horas',
  vitaminas_minerais:            'Vitaminas e minerais',
  hormonios_sexuais_reprodutivo: 'Hormônios sexuais e reprodutivos',
  cardiometabolico:              'Perfil lipídico (colesterol e triglicérides)',
  urinalise_eas:                 'Urina tipo I (EAS)',
}

export function specimenLabel(key: string | null | undefined): string {
  return SPECIMEN_LABEL[key ?? ''] ?? 'Outros exames'
}
export function categoryLabel(key: string | null | undefined): string | null {
  return CATEGORY_LABEL[key ?? ''] ?? null
}

export interface PanelGroup<T> {
  key: string
  label: string
  categories: { key: string; label: string | null; items: T[] }[]
}

/** Agrupa itens por material (specimen) → painel (category), preservando a ordem de entrada. */
export function groupBySpecimen<T>(
  items: T[],
  get: (t: T) => { specimen: string | null; category: string | null },
): PanelGroup<T>[] {
  const specs = new Map<string, Map<string, T[]>>()
  for (const it of items) {
    const { specimen, category } = get(it)
    const sk = specimen ?? 'outros'
    const ck = category ?? 'outros'
    if (!specs.has(sk)) specs.set(sk, new Map())
    const cats = specs.get(sk)!
    if (!cats.has(ck)) cats.set(ck, [])
    cats.get(ck)!.push(it)
  }
  const rank = (k: string) => { const i = SPECIMEN_ORDER.indexOf(k); return i < 0 ? 99 : i }
  return [...specs.keys()]
    .sort((a, b) => rank(a) - rank(b))
    .map(sk => ({
      key: sk,
      label: specimenLabel(sk),
      categories: [...specs.get(sk)!.entries()].map(([ck, items]) => ({
        key: ck,
        label: categoryLabel(ck),
        items,
      })),
    }))
}
