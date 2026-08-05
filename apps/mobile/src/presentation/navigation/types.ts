// Tipos de navegação (ParamLists) — módulo de tipos dedicado, para que consumidores (ex.: slots da Home)
// não precisem importar de arquivos de componente (evita acoplamento a `AppNavigator`).

/** Abas de topo do AppNavigator (grupos projetados do SSOT — MOBILE-009 §3.1). */
export type AppTabParamList = {
  Inicio: undefined
  Acompanhamento: undefined
  Documentos: undefined
  MinhaSaude: undefined
  Mais: undefined
}

/** Stack interno da aba "Mais" (Inc.4): menu do grupo + telas de detalhe empilháveis (ex.: Perfil).
 *  Como a Web consolidou (Mais → Perfil) — MOBILE-016 §5. É só navegação (sem regra de negócio). */
export type MaisStackParamList = {
  MaisMenu: undefined
  Perfil: undefined
  Despesas: undefined
  Relatorio: undefined
  Configuracoes: undefined
}

/** Stack interno da aba "Documentos" (Inc.5/6): lista + detalhe + upload de exame. Só navegação. */
export type DocumentosStackParamList = {
  ExamsList: undefined
  ExamDetail: { id: string }
  ExamUpload: undefined
  OmicsList: undefined
  OmicsPanel: { id: string; domain?: string }
}

/** Stack interno da aba "Minha Saúde": menu do grupo + telas de domínio (Condições, …). Só navegação. */
export type MinhaSaudeStackParamList = {
  MinhaSaudeMenu: undefined
  Conditions: undefined
  Habits: undefined
  Resources: undefined
  Medications: { supplements?: boolean } | undefined
  Ciclo: undefined
}

/** Stack interno da aba "Acompanhamento" (domínio Agenda): agenda + formulário de evento. Só navegação.
 *  `EventForm` recebe o evento para EDITAR ou um `prefill` para CRIAR (ex.: lembrete a partir de um exame). */
export type AcompanhamentoStackParamList = {
  Agenda: undefined
  Timeline: undefined
  HistoricoExames: undefined
  Composicao: undefined
  Monitoramento: undefined
  EventForm: {
    event?: import('@sintera/core').HealthEvent
    prefill?: { type?: string; title?: string; date?: string; examId?: string; recurrence?: boolean }
  }
}
