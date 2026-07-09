// Taxonomia ÚNICA de métodos contraceptivos (SSOT). Consumida pelo módulo Ciclo
// (/dashboard/ciclo) e pelo Relatório — nenhuma tela reimplementa a lista.
export const CONTRACEPTIVE_KINDS: { value: string; label: string; months: number | null }[] = [
  { value: 'diu_cobre',    label: 'DIU de cobre',                   months: 120 },
  { value: 'diu_hormonal', label: 'DIU hormonal (Mirena, Kyleena)', months: 60 },
  { value: 'implante',     label: 'Implante (Implanon, Nexplanon)', months: 36 },
  { value: 'injecao',      label: 'Injeção',                        months: 3 },
  { value: 'anel',         label: 'Anel vaginal',                   months: 1 },
  { value: 'adesivo',      label: 'Adesivo',                        months: 1 },
  { value: 'pilula',       label: 'Pílula',                         months: null },
  { value: 'outro',        label: 'Outro',                          months: null },
]

export const contraceptiveLabel = (k: string): string =>
  CONTRACEPTIVE_KINDS.find(x => x.value === k)?.label ?? 'Método'
