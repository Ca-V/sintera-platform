// Tipos de navegação (ParamLists) — módulo de tipos dedicado, para que consumidores (ex.: slots da Home)
// não precisem importar de arquivos de componente (evita acoplamento a `AppNavigator`).
//
// IA CONFIRMADA (2026-08-06, ADR-021 / MOBILE-036 — modelo mental do usuário): 5 abas —
// Início · Agenda · Minha Saúde · Rede de Cuidado · Mais. "Exames" DEIXA de ser aba: vira um REGISTRO dentro de
// Minha Saúde (Registros/Saúde/Histórico). "Compartilhamento" (ação) → "Rede de Cuidado" (entidade). Espelha a Sidebar Web.

/** Abas de topo do AppNavigator (5 grupos — modelo mental). */
export type AppTabParamList = {
  Inicio: undefined
  Agenda: undefined
  MinhaSaude: undefined
  RedeCuidado: undefined
  Mais: undefined
}

/** Stack interno da aba "Mais": funções secundárias (Perfil, Despesas, Configurações). Só navegação. */
export type MaisStackParamList = {
  MaisMenu: undefined
  Perfil: undefined
  Despesas: undefined
  Configuracoes: undefined
}

/** Stack interno da aba "Rede de Cuidado" (entidade — CARE-002 futura): hoje Relatórios. Só navegação. */
export type RedeCuidadoStackParamList = {
  RedeMenu: undefined
  Relatorio: undefined
}

/** Stack interno da aba "Minha Saúde" (domínio central): menu (Registros/Saúde/Histórico) + telas de domínio +
 *  os EXAMES (lista/detalhe/upload/ômica/Histórico de Exames), que passaram a viver aqui como "Registros". Só navegação. */
export type MinhaSaudeStackParamList = {
  MinhaSaudeMenu: undefined
  // Registros
  ExamsList: { tab?: 'orders' } | undefined
  ExamDetail: { id: string }
  // context='order' = usuário escolheu "Pedido de exame" (sub-tipo do mesmo domínio Exames): só ajusta
  // o cabeçalho/expectativa (pedido ≠ resultado). A persistência segue REG-001 (document_type derivado).
  ExamUpload: { context?: 'exam' | 'order' } | undefined
  OmicsList: undefined
  OmicsPanel: { id: string; domain?: string }
  Medications: { supplements?: boolean } | undefined
  Resources: undefined
  Documents: undefined
  Conexoes: undefined
  /** O que entrou pelas conexões, com origem e possíveis repetições. Alcançada por Conexões. */
  DadosRecebidos: undefined
  // Saúde
  Conditions: undefined
  Composicao: undefined
  Ciclo: undefined
  Monitoramento: undefined
  Habits: undefined
  // Histórico
  HistoricoExames: undefined
  IndicadorDetail: { name: string } // página longitudinal de UM indicador (paridade Web /dashboard/saude/[slug])
  Timeline: undefined
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
