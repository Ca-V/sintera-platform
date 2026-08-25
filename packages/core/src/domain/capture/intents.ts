// @sintera/core — HUB-001 Hub de Registro: TAXONOMIA de intenções = SSOT aberta e PURA (sem React/rotas).
// Princípio: a pessoa escolhe O QUE registrar; a SINTERA decide COMO capturar. As opções organizam-se por
// NATUREZA da informação (documento/cuidado/registro/despesa), NUNCA pelo mecanismo. Domain-driven: a
// INTENÇÃO é domínio; o ALVO de navegação (href na Web, tela no Mobile) é apresentação — cada plataforma mapeia
// `RegistrationDestination`. Adicionar um tipo = uma entrada aqui, sem tocar UI de nenhuma das pontas.
import type { DocumentKind } from './types'

export type IntentGroup = 'documento' | 'cuidado' | 'registro' | 'organizacao'

export const INTENT_GROUPS: { group: IntentGroup; label: string }[] = [
  { group: 'documento',   label: 'Documentos' },
  { group: 'cuidado',     label: 'Cuidados e recursos' },
  { group: 'registro',    label: 'Registros de saúde' },
  { group: 'organizacao', label: 'Despesas' },
]

/** Destino de domínio (agnóstico de plataforma). Web mapeia para href; Mobile para aba/tela. */
export const REGISTRATION_DESTINATIONS = [
  'omics', 'medications', 'supplements', 'resources', 'resources-vision',
  'consulta', 'conditions', 'body', 'habits', 'expenses', 'documents',
] as const

/** Derivado do catálogo acima — lista em runtime e tipo com UM dono só (ADR-023). */
export type RegistrationDestination = typeof REGISTRATION_DESTINATIONS[number]

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
  // DOC-002 — receita e documento clínico agora TÊM destino, como `omica` tem.
  //
  // `doc_clinico` era `{ type: 'capture' }` sem kind: mandava classificar, e a classificação só oferecia kinds
  // que não eram o que a pessoa havia escolhido. A categoria não se perdia por defeito — nunca teve para onde
  // ir. Agora leva à página de Documentos, onde o subtipo (atestado/relatório/encaminhamento) é escolhido.
  //
  // `receita` é `choice` e não `page` porque as duas coisas são legítimas e a pessoa é quem sabe qual quer:
  // ler a receita para CADASTRAR O MEDICAMENTO é uma capacidade que já funciona (processador `medication_label`
  // → /dashboard/medicamentos) e não pode ser removida em silêncio; guardar a receita como DOCUMENTO é o que
  // faltava. Mesmo mecanismo já usado por Medicamento e Suplemento.
  { key: 'receita',      label: 'Receita médica',     icon: 'FileText',      group: 'documento', mechanism: { type: 'choice', captureKind: 'medication_label', captureLabel: 'Ler receita e cadastrar medicamento', pageDestination: 'documents', pageLabel: 'Guardar como documento' } },
  { key: 'doc_clinico',  label: 'Atestado, relatório ou encaminhamento', icon: 'FileHeart', group: 'documento', mechanism: { type: 'page', destination: 'documents' } },
  { key: 'omica',        label: 'Exame ômico',        icon: 'Dna',           group: 'documento', mechanism: { type: 'page', destination: 'omics' } },

  // ── Cuidados e recursos ───────────────────────────────────────────────────
  { key: 'medicamento',  label: 'Medicamento',        icon: 'Pill',          group: 'cuidado', mechanism: { type: 'choice', captureKind: 'medication_label', captureLabel: 'Enviar receita', pageDestination: 'medications', pageLabel: 'Cadastrar manualmente' } },
  { key: 'suplemento',   label: 'Suplemento',         icon: 'Leaf',          group: 'cuidado', mechanism: { type: 'choice', captureKind: 'medication_label', captureLabel: 'Enviar receita', pageDestination: 'supplements', pageLabel: 'Cadastrar manualmente' } },
  { key: 'recurso',      label: 'Recurso de saúde',   icon: 'Package',       group: 'cuidado', mechanism: { type: 'page', destination: 'resources' } },
  // Óculos/Lentes NÃO têm categoria própria (decisão de produto): são um Recurso de Saúde (tipo `correcao_visual`),
  // registrados via "Recurso de saúde". Não recriar um card/intent dedicado aqui.

  // ── Registros de saúde ────────────────────────────────────────────────────
  { key: 'consulta',     label: 'Consulta',           icon: 'Stethoscope',   group: 'registro', mechanism: { type: 'page', destination: 'consulta' } },
  { key: 'condicao',     label: 'Condição de saúde',  icon: 'HeartPulse',    group: 'registro', mechanism: { type: 'page', destination: 'conditions' } },
  { key: 'medida',       label: 'Composição corporal', icon: 'Ruler',        group: 'registro', mechanism: { type: 'page', destination: 'body' } },
  { key: 'habito',       label: 'Hábito',             icon: 'Sparkles',      group: 'registro', mechanism: { type: 'page', destination: 'habits' } },

  // ── Despesas (financeiro) ─────────────────────────────────────────────────
  { key: 'nf_comprovante', label: 'Nota fiscal / comprovante', icon: 'Receipt', group: 'organizacao', mechanism: { type: 'page', destination: 'expenses' } },
]

/** Intenções de um grupo, na ordem declarada. */
export function intentsByGroup(group: IntentGroup): RegistrationIntent[] {
  return REGISTRATION_INTENTS.filter(i => i.group === group)
}

/**
 * ONDE cada TIPO de documento é registrado. Fonte única Web↔Mobile.
 *
 * DEFEITO QUE ISTO CORRIGE (homologação da fundadora, 25/08): no Mobile, escolher "Receita médica" → "Ler
 * receita e cadastrar medicamento" levava à tela de **Adicionar exame**. O Hub do Mobile ignorava o
 * `documentKind` e mandava tudo para o upload de exame.
 *
 * A causa era dono duplicado: na Web cada processador declarava o seu destino
 * (`medication_label` → /dashboard/medicamentos); no Mobile esse mapa simplesmente não existia. Agora o
 * destino é DOMÍNIO — declarado uma vez aqui — e cada plataforma só o traduz para a sua rota.
 *
 * `exam`, `other` e `unknown` não têm destino próprio: seguem para a captura de exame, que é onde a
 * classificação decide o que fazer com eles.
 */
const CAPTURE_DESTINATION: Partial<Record<DocumentKind, RegistrationDestination>> = {
  medication_label:       'medications',
  eyeglass_prescription:  'resources-vision',
  omics:                  'omics',
}

/** Destino do tipo, ou `null` quando o caminho é a captura de exame. */
export function captureDestinationFor(kind: DocumentKind | undefined): RegistrationDestination | null {
  return (kind && CAPTURE_DESTINATION[kind]) ?? null
}
