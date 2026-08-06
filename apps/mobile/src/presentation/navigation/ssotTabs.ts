// Projeção da taxonomia SSOT (fonte única: src/components/layout/Sidebar.tsx da Web) para os bottom tabs.
//
// PRINCÍPIO (MOBILE-009 D7): a navegação é uma PROJEÇÃO da taxonomia SSOT, não sua representação literal.
// A arquitetura de informação é única (mesma organização conceitual da Web); a apresentação pode variar
// conforme a plataforma.
//
// Arquitetura CONFIRMADA (2026-08-06, ADR-021 / MOBILE-036): 5 abas idiomáticas.
// - Exames absorve os Documentos (exames + ômica) e o Histórico de Exames.
// - Minha Saúde absorve Histórico de Saúde, Composição Corporal e Monitoramento.
// - Mais agrega Despesas + Relatórios (Compartilhamento) + Configurações.
//
// CRITÉRIO 10 (MOBILE-009): esta camada NÃO contém conhecimento de domínio — apenas rótulos da taxonomia.

export type SsotTab = {
  /** Nome da rota (estável, sem espaços/acentos). */
  readonly name: string
  /** Rótulo exibido (derivado do SSOT). */
  readonly label: string
  /** Itens do(s) grupo(s) SSOT que este destino projetará (apenas rótulos — sem lógica). */
  readonly items: readonly string[]
}

export const SSOT_TABS: readonly SsotTab[] = [
  { name: 'Inicio', label: 'Início', items: ['Painel Inicial'] },
  { name: 'Agenda', label: 'Agenda', items: ['Agenda'] },
  { name: 'Exames', label: 'Exames', items: ['Exames', 'Exames de ômica', 'Histórico de Exames'] },
  {
    name: 'MinhaSaude',
    label: 'Minha Saúde',
    items: ['Condições de Saúde', 'Medicamentos', 'Suplementos', 'Recursos de Saúde', 'Hábitos', 'Ciclo e Contracepção', 'Composição Corporal', 'Monitoramento', 'Histórico de Saúde'],
  },
  { name: 'Mais', label: 'Mais', items: ['Despesas', 'Relatórios', 'Configurações'] },
]
