// @sintera/core — HUB-001 Hub de Registro: TAXONOMIA de intenções = SSOT aberta e PURA (sem React/rotas).
// Princípio: a pessoa escolhe O QUE registrar; a SINTERA decide COMO capturar. As opções organizam-se por
// NATUREZA da informação (documento/cuidado/registro/organização), NUNCA pelo mecanismo. Domain-driven: a
// INTENÇÃO é domínio; o ALVO de navegação (href na Web, tela no Mobile) é apresentação — cada plataforma mapeia
// `RegistrationDestination`. Adicionar um tipo = uma entrada aqui, sem tocar UI de nenhuma das pontas.
import type { DocumentKind } from './types'

export type IntentGroup = 'documento' | 'cuidado' | 'registro' | 'organizacao'

export const INTENT_GROUPS: { group: IntentGroup; label: string }[] = [
  { group: 'documento',   label: 'Documentos' },
  { group: 'cuidado',     label: 'Cuidados e recursos' },
  { group: 'registro',    label: 'Registros de saúde' },
  { group: 'organizacao', label: 'Organização' },
]

/** Destino de domínio (agnóstico de plataforma). Web mapeia para href; Mobile para aba/tela. */
export type RegistrationDestination =
  | 'omics' | 'medications' | 'supplements' | 'resources' | 'resources-vision'
  | 'consulta' | 'conditions' | 'body' | 'habits' | 'expenses'

/** COMO a SINTERA captura a intenção escolhida. A intenção declara; o Hub orquestra. */
export type IntentMechanism =
  // Abre o Capture Center já configurado para um tipo de documento (documentKind ausente = deixa classificar).
  | { type: 'capture'; documentKind?: DocumentKind }
  // Leva ao formulário/página completa do domínio (destino agnóstico; a plataforma resolve a rota).
  | { type: 'page'; destination: RegistrationDestination }
  // Oferece caminhos (ex.: Medicamento → enviar receita OU cadastrar manualmente).
  | { type: 'choice'; captureKind: DocumentKind; captureLabel: string; pageDestination: RegistrationDestination; pageLabel: string }

export interface RegistrationIntent {
  key: string
  label: string
  icon: string          // nome do ícone lucide (resolvido na UI — mantém esta camada sem React)
  group: IntentGroup
  mechanism: IntentMechanism
}

// Taxonomia aberta. Ordem por grupo = ordem de exibição.
// PRINCÍPIO (fundadora): TODA opção do Hub deve permitir CONCLUIR o registro — nada de "em breve"/desabilitado.
export const REGISTRATION_INTENTS: RegistrationIntent[] = [
  // ── Documentos → Capture Center ───────────────────────────────────────────
  { key: 'exame',        label: 'Exame / Laudo',      icon: 'FlaskConical',  group: 'documento', mechanism: { type: 'capture', documentKind: 'exam' } },
  { key: 'pedido_exame', label: 'Pedido de exame',    icon: 'ClipboardList', group: 'documento', mechanism: { type: 'capture' } },
  { key: 'receita',      label: 'Receita médica',     icon: 'FileText',      group: 'documento', mechanism: { type: 'capture', documentKind: 'medication_label' } },
  { key: 'doc_clinico',  label: 'Atestado, relatório ou encaminhamento', icon: 'FileHeart', group: 'documento', mechanism: { type: 'capture' } },
  { key: 'omica',        label: 'Exame ômico',        icon: 'Dna',           group: 'documento', mechanism: { type: 'page', destination: 'omics' } },

  // ── Cuidados e recursos ───────────────────────────────────────────────────
  { key: 'medicamento',  label: 'Medicamento',        icon: 'Pill',          group: 'cuidado', mechanism: { type: 'choice', captureKind: 'medication_label', captureLabel: 'Enviar receita', pageDestination: 'medications', pageLabel: 'Cadastrar manualmente' } },
  { key: 'suplemento',   label: 'Suplemento',         icon: 'Leaf',          group: 'cuidado', mechanism: { type: 'choice', captureKind: 'medication_label', captureLabel: 'Enviar receita', pageDestination: 'supplements', pageLabel: 'Cadastrar manualmente' } },
  { key: 'recurso',      label: 'Recurso de saúde',   icon: 'Package',       group: 'cuidado', mechanism: { type: 'page', destination: 'resources' } },
  { key: 'oculos',       label: 'Óculos / Lentes',    icon: 'Glasses',       group: 'cuidado', mechanism: { type: 'page', destination: 'resources-vision' } },

  // ── Registros de saúde ────────────────────────────────────────────────────
  { key: 'consulta',     label: 'Consulta',           icon: 'Stethoscope',   group: 'registro', mechanism: { type: 'page', destination: 'consulta' } },
  { key: 'condicao',     label: 'Condição de saúde',  icon: 'HeartPulse',    group: 'registro', mechanism: { type: 'page', destination: 'conditions' } },
  { key: 'medida',       label: 'Composição corporal', icon: 'Ruler',        group: 'registro', mechanism: { type: 'page', destination: 'body' } },
  { key: 'habito',       label: 'Hábito',             icon: 'Sparkles',      group: 'registro', mechanism: { type: 'page', destination: 'habits' } },

  // ── Organização (financeiro) ──────────────────────────────────────────────
  { key: 'nf_comprovante', label: 'Nota fiscal / comprovante', icon: 'Receipt', group: 'organizacao', mechanism: { type: 'page', destination: 'expenses' } },
]

/** Intenções de um grupo, na ordem declarada. */
export function intentsByGroup(group: IntentGroup): RegistrationIntent[] {
  return REGISTRATION_INTENTS.filter(i => i.group === group)
}
