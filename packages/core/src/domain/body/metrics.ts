// @sintera/core — taxonomia PURA das medidas de Composição Corporal (BOD-001). Fonte ÚNICA (Web + Mobile).
// Registro FACTUAL autorrelatado (peso/altura/circunferência/bioimpedância). Sem juízo clínico (RDC 657/2022).

export type BodyMetric =
  | 'peso' | 'altura' | 'circunferencia_cintura'
  | 'imc' | 'gordura_corporal' | 'massa_muscular' | 'massa_magra' | 'agua_corporal' | 'gordura_visceral' | 'massa_ossea' | 'taxa_metabolica'
  | 'outro'
  // Sinais vitais (Monitoramento) — mesma tabela body_metrics, taxonomia separada. Ver isVital/VITAL_SIGNS.
  | 'pressao_arterial' | 'frequencia_cardiaca' | 'glicemia' | 'saturacao' | 'temperatura' | 'outro_sinal'

export const BODY_METRICS: { value: BodyMetric; label: string; unit: string; placeholder: string }[] = [
  { value: 'peso', label: 'Peso', unit: 'kg', placeholder: 'Ex.: 72,5' },
  { value: 'altura', label: 'Altura', unit: 'cm', placeholder: 'Ex.: 165' },
  { value: 'circunferencia_cintura', label: 'Circunferência (cintura)', unit: 'cm', placeholder: 'Ex.: 84' },
  { value: 'imc', label: 'IMC', unit: 'kg/m²', placeholder: 'Ex.: 24,2' },
  { value: 'gordura_corporal', label: 'Gordura corporal', unit: '%', placeholder: 'Ex.: 28' },
  { value: 'massa_muscular', label: 'Massa muscular', unit: 'kg', placeholder: 'Ex.: 24' },
  { value: 'massa_magra', label: 'Massa magra', unit: 'kg', placeholder: 'Ex.: 54' },
  { value: 'agua_corporal', label: 'Água corporal', unit: '%', placeholder: 'Ex.: 55' },
  { value: 'gordura_visceral', label: 'Gordura visceral', unit: 'nível', placeholder: 'Ex.: 7' },
  { value: 'massa_ossea', label: 'Massa óssea', unit: 'kg', placeholder: 'Ex.: 2,8' },
  { value: 'taxa_metabolica', label: 'Taxa metabólica basal', unit: 'kcal', placeholder: 'Ex.: 1450' },
  { value: 'outro', label: 'Outra medida', unit: '', placeholder: 'Valor' },
]

/**
 * Ordem em que as medidas de composição corporal são COMPARADAS entre duas datas.
 *
 * Não é ordem alfabética nem a do catálogo: começa pelo peso, que é o que a pessoa acompanha, e segue para a
 * composição. Estava declarada nas DUAS pontas — duplicação achada pela catraca de base única (27/08).
 * Acrescentar uma métrica num lado e esquecer o outro faria ela sumir da comparação numa das telas.
 */
export const BODY_COMPARE_ORDER: readonly BodyMetric[] = [
  'peso', 'gordura_corporal', 'massa_muscular', 'massa_magra', 'agua_corporal',
  'gordura_visceral', 'taxa_metabolica', 'massa_ossea', 'circunferencia_cintura',
]

/** Métricas extraídas de um laudo de bioimpedância (IMC é calculado à parte). */
export const BIO_METRICS: BodyMetric[] = ['peso', 'gordura_corporal', 'massa_muscular', 'massa_magra', 'agua_corporal', 'gordura_visceral', 'massa_ossea', 'taxa_metabolica']

// Sinais vitais (Monitoramento) — série temporal autorrelatada na MESMA tabela body_metrics, taxonomia própria.
export type VitalMetric = 'pressao_arterial' | 'frequencia_cardiaca' | 'glicemia' | 'saturacao' | 'temperatura' | 'outro_sinal'
export const VITAL_SIGNS: { value: VitalMetric; label: string; unit: string; placeholder: string }[] = [
  { value: 'pressao_arterial', label: 'Pressão arterial', unit: 'mmHg', placeholder: 'Ex.: 120/80' },
  { value: 'frequencia_cardiaca', label: 'Frequência cardíaca', unit: 'bpm', placeholder: 'Ex.: 72' },
  { value: 'glicemia', label: 'Glicemia', unit: 'mg/dL', placeholder: 'Ex.: 95' },
  { value: 'saturacao', label: 'Saturação (SpO₂)', unit: '%', placeholder: 'Ex.: 98' },
  { value: 'temperatura', label: 'Temperatura', unit: '°C', placeholder: 'Ex.: 36,5' },
  { value: 'outro_sinal', label: 'Outro sinal', unit: '', placeholder: 'Valor' },
]
const VITAL_KEYS = new Set(VITAL_SIGNS.map(v => v.value as string))
/** Um sinal vital (Monitoramento) vs. medida de Composição Corporal — separa as duas visões da mesma tabela. */
export function isVital(metric: string | null | undefined): boolean { return VITAL_KEYS.has((metric ?? '') as string) }

/**
 * A medição precisa registrar a HORA, e não só o dia? (HIP-014 §2/§8.1)
 *
 * Sim para sinais vitais: pressão e glicemia são medidas VÁRIAS VEZES no mesmo dia — o diário de pressão que o
 * médico pede ("meça de manhã e à noite por duas semanas") produz duas linhas na mesma data. Sem hora elas são
 * indistinguíveis e não têm ordem definida entre si; a série deixa de ser série.
 *
 * Não para composição corporal: ninguém se pesa duas vezes no mesmo dia esperando duas leituras distintas — e
 * quando o faz, o dia é a granularidade que importa.
 *
 * DELEGA a `isVital` de propósito: a distinção já existe e é exatamente a mesma fronteira. Existe como função
 * própria porque o motivo é outro (precisar de hora ≠ ser sinal vital), e se um dia divergirem há um só lugar
 * para mudar. `outro_sinal` cai no lado que PRESERVA a informação — o desconhecido degrada, não perde dado.
 */
export function requiresTimeOfDay(metric: string | null | undefined): boolean { return isVital(metric) }

/**
 * Instante ordenável de uma medição. Usa a hora quando existe; cai para o dia quando não existe (linhas
 * anteriores à migração 148, e origens que ainda não gravam hora). Determinístico, UTC (DATE-001).
 *
 * Devolve `null` só quando não há nem hora nem dia — o que a coluna NOT NULL do banco não permite, mas a
 * fronteira de tipo permite.
 */
export function measurementInstant(measuredAt: string | null | undefined, measuredOn: string | null | undefined): string | null {
  const at = (measuredAt ?? '').trim()
  if (at) return at
  const on = (measuredOn ?? '').trim()
  return on ? `${on}T00:00:00.000Z` : null
}

/**
 * A medição tem HORA registrada, ou só o dia?
 *
 * A migração 148 preencheu as linhas antigas com a âncora do dia — meia-noite UTC exata — declarando-a marcador
 * de "hora não registrada", e não afirmação de que se mediu à meia-noite. O mesmo vale para quem grava hoje sem
 * informar hora. Esta função lê esse marcador, para que a tela mostre a hora só quando ela significa algo.
 *
 * Existe no core, e não em cada tela, porque Web e Mobile precisam decidir IGUAL — é o tipo de regra que, deixada
 * na interface, nasce diferente dos dois lados (ver princípio de paridade total).
 */
export function hasTimeOfDay(measuredAt: string | null | undefined): boolean {
  const at = (measuredAt ?? '').trim()
  if (!at) return false
  return !/T00:00:00(\.000)?Z$/.test(at)
}

/** Ordenação cronológica DECRESCENTE (mais recente primeiro) de medições — fonte única Web↔Mobile. */
export function compareMeasurementsDesc(
  a: { measured_at?: string | null; measured_on?: string | null },
  b: { measured_at?: string | null; measured_on?: string | null },
): number {
  const ia = measurementInstant(a.measured_at, a.measured_on) ?? ''
  const ib = measurementInstant(b.measured_at, b.measured_on) ?? ''
  return ia < ib ? 1 : ia > ib ? -1 : 0
}

// FB-003/BOD-001: cada ponto mostra a ORIGEM de onde nasceu.
export const BODY_SOURCE_LABEL: Record<string, string> = {
  bioimpedancia: 'Bioimpedância', dexa: 'DEXA', balanca: 'Balança', wearable: 'Dispositivo', manual: 'Registro manual', outro: 'Outra origem',
}

/**
 * Linha de contexto de uma medição: quando · de onde · observação (HIP-014 §4).
 *
 * A ORDEM e o separador vivem aqui, não em cada tela — senão a Web mostra "data · origem · nota" e o Mobile
 * mostra outra coisa, que é como a paridade se perde sem ninguém decidir. A formatação de data/hora fica na
 * plataforma (depende de locale e de API nativa) e entra pronta em `when`.
 *
 * A ORIGEM aparece SEMPRE que conhecida. Procedência é requisito da plataforma, não enfeite: quando o dado de
 * dispositivo começar a conviver com o manual, a ausência do rótulo seria ambígua em vez de silenciosa.
 */
export function measurementMeta(o: { when: string; source?: string | null; notes?: string | null }): string {
  return [o.when, bodySourceLabel(o.source), o.notes?.trim() || null]
    .filter((p): p is string => !!p && p.length > 0)
    .join(' · ')
}

const M = new Map<string, { label: string; unit: string }>([...BODY_METRICS, ...VITAL_SIGNS].map(m => [m.value, m]))
export function bodyMetricLabel(m: string | null | undefined): string { return M.get(m ?? '')?.label ?? 'Outra medida' }
export function bodyMetricUnit(m: string | null | undefined): string { return M.get(m ?? '')?.unit ?? '' }
export function bodySourceLabel(s: string | null | undefined): string | null { const k = (s ?? '').trim(); return k ? (BODY_SOURCE_LABEL[k] ?? 'Outra origem') : null }
