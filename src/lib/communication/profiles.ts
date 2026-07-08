// ============================================================
// Perfis de Comunicação — capacidade da Camada de Comunicação (REL-001 §0.0)
// ============================================================
// NÃO são "configuração salva": são PERFIS DE COMUNICAÇÃO. Arquiteturalmente,
// primeiro existem os PERFIS OFICIAIS da plataforma (abaixo); depois o usuário
// cria os seus próprios (report_templates). Cada perfil apenas marca quais seções
// entram na comunicação — reutilizável por Relatório/PDF/compartilhamento.
// As chaves de seção espelham o menu/UX-001 (mesmas de `sections` no Relatório).
// ============================================================

export interface CommunicationProfile {
  key: string
  label: string
  /** Seções incluídas (as demais ficam desmarcadas). Chaves = módulos do menu. */
  sections: string[]
}

const ALL = ['eventos', 'exames', 'omica', 'medicamentos', 'condicoes', 'visao', 'medidas', 'sinais', 'habitos']

export const COMMUNICATION_PROFILES: CommunicationProfile[] = [
  { key: 'consulta',        label: 'Consulta médica',           sections: ALL },
  { key: 'segunda_opiniao', label: 'Segunda opinião',           sections: ['exames', 'omica', 'condicoes', 'medicamentos', 'eventos'] },
  { key: 'emergencia',      label: 'Emergência',                sections: ['condicoes', 'medicamentos', 'visao'] },
  { key: 'viagem',          label: 'Viagem',                    sections: ['medicamentos', 'condicoes', 'visao'] },
  { key: 'familiar',        label: 'Compartilhamento familiar', sections: ['condicoes', 'medicamentos', 'eventos'] },
  { key: 'seguro',          label: 'Seguro',                    sections: ['exames', 'condicoes', 'eventos'] },
  { key: 'pericia',         label: 'Perícia',                   sections: ALL },
  { key: 'pesquisa',        label: 'Pesquisa clínica',          sections: ['exames', 'omica', 'medicamentos'] },
]
