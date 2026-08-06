// Tipos de navegação (ParamLists) — módulo de tipos dedicado, para que consumidores (ex.: slots da Home)
// não precisem importar de arquivos de componente (evita acoplamento a `AppNavigator`).
//
// Arquitetura de navegação CONFIRMADA (2026-08-06, ADR-021 / MOBILE-036): 5 abas —
// Início · Agenda · Exames · Minha Saúde · Mais. "Acompanhamento" e "Documentos" deixaram de existir:
// Histórico de Exames → Exames; Histórico de Saúde + Composição + Monitoramento → Minha Saúde.

/** Abas de topo do AppNavigator (5 grupos — MOBILE-036). */
export type AppTabParamList = {
  Inicio: undefined
  Agenda: undefined
  Exames: undefined
  MinhaSaude: undefined
  Mais: undefined
}

/** Stack interno da aba "Mais": menu do grupo + telas de detalhe empilháveis. Só navegação. */
export type MaisStackParamList = {
  MaisMenu: undefined
  Perfil: undefined
  Despesas: undefined
  Relatorio: undefined
  Configuracoes: undefined
}

/** Stack interno da aba "Exames" (ex-"Documentos"): exames + ômica + Histórico de Exames. Só navegação. */
export type ExamesStackParamList = {
  ExamsList: undefined
  ExamDetail: { id: string }
  ExamUpload: undefined
  OmicsList: undefined
  OmicsPanel: { id: string; domain?: string }
  HistoricoExames: undefined
}

/** Stack interno da aba "Minha Saúde": Dados de Saúde + Histórico de Saúde + Composição + Monitoramento. */
export type MinhaSaudeStackParamList = {
  MinhaSaudeMenu: undefined
  Conditions: undefined
  Habits: undefined
  Resources: undefined
  Medications: { supplements?: boolean } | undefined
  Ciclo: undefined
  Timeline: undefined
  Composicao: undefined
  Monitoramento: undefined
}

/** Stack interno da aba "Agenda" (domínio Agenda): agenda + formulário de evento. Só navegação.
 *  `EventForm` recebe o evento para EDITAR ou um `prefill` para CRIAR (ex.: lembrete a partir de um exame). */
export type AgendaStackParamList = {
  Agenda: undefined
  EventForm: {
    event?: import('@sintera/core').HealthEvent
    prefill?: { type?: string; title?: string; date?: string; examId?: string; recurrence?: boolean }
  }
}
