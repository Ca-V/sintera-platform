// Registro de MODELOS CLÍNICOS — a ESTRUTURA clínica de cada modalidade (CONHECIMENTO médico), separada da
// IMPLEMENTAÇÃO (processador). Fundadora (14/07): o Modelo descreve a estrutura; o processador só preenche.
//
// GRANULARIDADE = MODALIDADE, não FAMÍLIA. "Laboratório" é família; os modelos são Hemograma, Perfil
// Lipídico, Glicemia… Assim a maturidade da plataforma é medida por modelo real, não por agrupamento.
//
// Declarativo/puro. Cresce puxado pelo CRC. Os `fields` descrevem O QUE a modalidade contém (nomes/unidades/
// se é por região); COMO extrair é responsabilidade do processador correspondente.

import type { ClinicalModel } from './types'

export const CLINICAL_MODELS: ClinicalModel[] = [
  // ── Oftalmologia (parametric) ──
  {
    id: 'corneal-tomography', label: 'Tomografia de córnea', family: 'Oftalmologia',
    resultKind: 'parametric', contractVersion: 'v1',
    fields: [
      { name: 'K1', unit: 'D', regionAware: true },
      { name: 'K2', unit: 'D', regionAware: true },
      { name: 'Kmax', unit: 'D', regionAware: true },
      { name: 'Espessura mínima', unit: 'µm', regionAware: true },
      { name: 'BAD-D', regionAware: true },
      { name: 'Elevação anterior', unit: 'µm', regionAware: true },
      { name: 'Elevação posterior', unit: 'µm', regionAware: true },
    ],
  },
  { id: 'oct', label: 'OCT (tomografia de coerência óptica)', family: 'Oftalmologia', resultKind: 'parametric', contractVersion: 'v1', fields: [] },

  // ── Imagem / neurofisiologia / patologia (narrative — a estrutura é achados/conclusão) ──
  { id: 'mammography', label: 'Mamografia',                 family: 'Imagem — mama',          resultKind: 'narrative', contractVersion: 'v1', fields: [] },
  { id: 'ultrasound',  label: 'Ultrassonografia',           family: 'Imagem — ultrassom',     resultKind: 'narrative', contractVersion: 'v1', fields: [] },
  { id: 'mri',         label: 'Ressonância magnética',      family: 'Imagem — RM',            resultKind: 'narrative', contractVersion: 'v1', fields: [] },
  { id: 'ct',          label: 'Tomografia computadorizada', family: 'Imagem — TC',            resultKind: 'narrative', contractVersion: 'v1', fields: [] },
  { id: 'pathology',   label: 'Anatomopatológico',          family: 'Anatomia patológica',    resultKind: 'narrative', contractVersion: 'v1', fields: [] },
  { id: 'eeg',         label: 'Eletroencefalograma',        family: 'Neurofisiologia',        resultKind: 'narrative', contractVersion: 'v1', fields: [] },

  // ── Cardiologia / densitometria (parametric) ──
  {
    id: 'ecg', label: 'Eletrocardiograma', family: 'Cardiologia', resultKind: 'parametric', contractVersion: 'v1',
    fields: [
      { name: 'Frequência cardíaca', unit: 'bpm' }, { name: 'Intervalo PR', unit: 'ms' },
      { name: 'Intervalo QT', unit: 'ms' }, { name: 'Duração QRS', unit: 'ms' }, { name: 'Eixo elétrico', unit: '°' },
    ],
  },
  {
    id: 'echocardiography', label: 'Ecocardiograma', family: 'Cardiologia', resultKind: 'parametric', contractVersion: 'v1',
    fields: [
      { name: 'Fração de ejeção', unit: '%' }, { name: 'Átrio esquerdo', unit: 'mm' },
      { name: 'Ventrículo esquerdo (diástole)', unit: 'mm' }, { name: 'Septo interventricular', unit: 'mm' },
    ],
  },
  { id: 'holter', label: 'Holter 24h', family: 'Cardiologia', resultKind: 'parametric', contractVersion: 'v1', fields: [] },
  {
    id: 'densitometry', label: 'Densitometria óssea', family: 'Imagem — densitometria', resultKind: 'parametric', contractVersion: 'v1',
    fields: [{ name: 'T-score', regionAware: true }, { name: 'Z-score', regionAware: true }],
  },

  // ── Laboratório: "Laboratório" é FAMÍLIA. Os MODELOS são os painéis. `laboratory` é TRANSITÓRIO enquanto
  //    a identificação não distingue o painel específico (rota genérica atual). Painéis abaixo = alvo real.
  { id: 'laboratory', label: 'Laboratório (painel não granularizado)', family: 'Laboratório', resultKind: 'structured', contractVersion: 'v1', fields: [] },
  {
    id: 'hemogram', label: 'Hemograma', family: 'Laboratório', resultKind: 'structured', contractVersion: 'v1',
    fields: [
      { name: 'Hemoglobina', unit: 'g/dL' }, { name: 'Hematócrito', unit: '%' }, { name: 'Eritrócitos', unit: 'milhões/mm³' },
      { name: 'Leucócitos', unit: '/mm³' }, { name: 'Plaquetas', unit: '/mm³' },
    ],
  },
  {
    id: 'lipid-panel', label: 'Perfil lipídico', family: 'Laboratório', resultKind: 'structured', contractVersion: 'v1',
    fields: [
      { name: 'Colesterol total', unit: 'mg/dL' }, { name: 'HDL', unit: 'mg/dL' }, { name: 'LDL', unit: 'mg/dL' },
      { name: 'Triglicerídeos', unit: 'mg/dL' }, { name: 'VLDL', unit: 'mg/dL' },
    ],
  },
  {
    id: 'glucose', label: 'Glicemia', family: 'Laboratório', resultKind: 'structured', contractVersion: 'v1',
    fields: [{ name: 'Glicose', unit: 'mg/dL' }, { name: 'Hemoglobina glicada', unit: '%' }],
  },
  {
    id: 'thyroid-panel', label: 'Função tireoidiana', family: 'Laboratório', resultKind: 'structured', contractVersion: 'v1',
    fields: [{ name: 'TSH', unit: 'µUI/mL' }, { name: 'T4 livre', unit: 'ng/dL' }, { name: 'T3', unit: 'ng/dL' }],
  },
  {
    id: 'renal-panel', label: 'Função renal', family: 'Laboratório', resultKind: 'structured', contractVersion: 'v1',
    fields: [{ name: 'Creatinina', unit: 'mg/dL' }, { name: 'Ureia', unit: 'mg/dL' }, { name: 'Taxa de filtração glomerular', unit: 'mL/min' }],
  },
  {
    id: 'hepatic-panel', label: 'Função hepática', family: 'Laboratório', resultKind: 'structured', contractVersion: 'v1',
    fields: [{ name: 'TGO/AST', unit: 'U/L' }, { name: 'TGP/ALT', unit: 'U/L' }, { name: 'GGT', unit: 'U/L' }, { name: 'Bilirrubina total', unit: 'mg/dL' }],
  },
  {
    id: 'vitamin-d', label: 'Vitamina D', family: 'Laboratório', resultKind: 'structured', contractVersion: 'v1',
    fields: [{ name: '25-hidroxivitamina D', unit: 'ng/mL' }],
  },
]

const BY_ID = new Map(CLINICAL_MODELS.map(m => [m.id, m]))

/** Busca a estrutura de um modelo clínico pelo id (ex.: 'corneal-tomography'). */
export function getClinicalModel(id: string | null | undefined): ClinicalModel | null {
  return id ? BY_ID.get(id) ?? null : null
}

export const CLINICAL_MODEL_IDS = CLINICAL_MODELS.map(m => m.id)
