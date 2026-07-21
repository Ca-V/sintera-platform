// HUB-001 — Hub de Registro (ponto único de entrada da SINTERA). TAXONOMIA = SSOT aberta.
//
// Princípio: o usuário escolhe O QUE registrar; a SINTERA decide COMO capturar. As opções organizam-se
// por NATUREZA da informação (documento/cuidado/registro), NUNCA pelo mecanismo. Adicionar um tipo =
// uma entrada aqui (configuração), sem tocar a UI. Camada de domínio: pura, sem IO nem React.

import type { DocumentKind } from './types'

// grupo 'cuidado' = medicamentos/suplementos/recursos; evita "tratamento" (a SINTERA registra/organiza, não trata).
export type IntentGroup = 'documento' | 'cuidado' | 'registro' | 'organizacao'

export const INTENT_GROUPS: { group: IntentGroup; label: string }[] = [
  { group: 'documento',   label: 'Documentos' },
  { group: 'cuidado',     label: 'Cuidados e recursos' },
  { group: 'registro',    label: 'Registros de saúde' },
  { group: 'organizacao', label: 'Organização' },
]

/** COMO a SINTERA captura a intenção escolhida. A intenção declara; o Hub orquestra. */
export type IntentMechanism =
  // Abre o Capture Center já configurado para um tipo de documento (documentKind ausente = deixa classificar).
  | { type: 'capture'; documentKind?: DocumentKind }
  // Leva ao formulário/página completa do domínio (a "página completa" da regra de ouro).
  | { type: 'page'; href: string }
  // Oferece caminhos (ex.: Medicamento → enviar receita OU cadastrar manualmente).
  | { type: 'choice'; captureKind: DocumentKind; captureLabel: string; pageHref: string; pageLabel: string }

export interface RegistrationIntent {
  key: string
  label: string
  icon: string          // nome do ícone lucide (resolvido na UI — mantém esta camada sem React)
  group: IntentGroup
  mechanism: IntentMechanism
}

// Taxonomia aberta. Ordem por grupo = ordem de exibição.
// PRINCÍPIO (fundadora): TODA opção do Hub deve permitir CONCLUIR o registro — nada de "em breve"/desabilitado.
// Intenções cujo fluxo ainda não conclui (ex.: Procedimento, Vacina) só entram quando houver destino que registre.
// Destinos de PÁGINA pré-abrem o formulário do módulo (`?novo=1`), para o Hub concluir o registro (não só navegar).
export const REGISTRATION_INTENTS: RegistrationIntent[] = [
  // ── Documentos → Capture Center ───────────────────────────────────────────
  { key: 'exame',        label: 'Exame / Laudo',      icon: 'FlaskConical',  group: 'documento', mechanism: { type: 'capture', documentKind: 'exam' } },
  // Pedido ≠ resultado (Q1): sem pré-classificar como 'exam' — o Capture Center classifica pelo conteúdo.
  { key: 'pedido_exame', label: 'Pedido de exame',    icon: 'ClipboardList', group: 'documento', mechanism: { type: 'capture' } },
  { key: 'receita',      label: 'Receita médica',     icon: 'FileText',      group: 'documento', mechanism: { type: 'capture', documentKind: 'medication_label' } },
  { key: 'doc_clinico',  label: 'Atestado, relatório ou encaminhamento', icon: 'FileHeart', group: 'documento', mechanism: { type: 'capture' } },
  { key: 'omica',        label: 'Exame ômico',        icon: 'Dna',           group: 'documento', mechanism: { type: 'page', href: '/dashboard/omics' } },

  // ── Cuidados e recursos ───────────────────────────────────────────────────
  { key: 'medicamento',  label: 'Medicamento',        icon: 'Pill',          group: 'cuidado', mechanism: { type: 'choice', captureKind: 'medication_label', captureLabel: 'Enviar receita', pageHref: '/dashboard/medicamentos', pageLabel: 'Cadastrar manualmente' } },
  { key: 'suplemento',   label: 'Suplemento',         icon: 'Leaf',          group: 'cuidado', mechanism: { type: 'choice', captureKind: 'medication_label', captureLabel: 'Enviar receita', pageHref: '/dashboard/suplementos', pageLabel: 'Cadastrar manualmente' } },
  { key: 'recurso',      label: 'Recurso de saúde',   icon: 'Package',       group: 'cuidado', mechanism: { type: 'page', href: '/dashboard/recursos?novo=1' } },
  // Óculos/Lentes = domínio de Recursos (correção visual), que já captura a receita (OCR) — sem artefato paralelo.
  { key: 'oculos',       label: 'Óculos / Lentes',    icon: 'Glasses',       group: 'cuidado', mechanism: { type: 'page', href: '/dashboard/recursos?novo=1&tipo=correcao_visual' } },

  // ── Registros de saúde ────────────────────────────────────────────────────
  { key: 'consulta',     label: 'Consulta',           icon: 'Stethoscope',   group: 'registro', mechanism: { type: 'page', href: '/dashboard/agenda?novo=consulta' } },
  { key: 'condicao',     label: 'Condição de saúde',  icon: 'HeartPulse',    group: 'registro', mechanism: { type: 'page', href: '/dashboard/condicoes?novo=1' } },
  { key: 'medida',       label: 'Composição corporal', icon: 'Ruler',        group: 'registro', mechanism: { type: 'page', href: '/dashboard/medidas?novo=1' } },
  { key: 'habito',       label: 'Hábito',             icon: 'Sparkles',      group: 'registro', mechanism: { type: 'page', href: '/dashboard/habitos?novo=1' } },

  // ── Organização (financeiro) ──────────────────────────────────────────────
  { key: 'nf_comprovante', label: 'Nota fiscal / comprovante', icon: 'Receipt', group: 'organizacao', mechanism: { type: 'page', href: '/dashboard/gastos' } },
]

/** Intenções de um grupo, na ordem declarada. */
export function intentsByGroup(group: IntentGroup): RegistrationIntent[] {
  return REGISTRATION_INTENTS.filter(i => i.group === group)
}
