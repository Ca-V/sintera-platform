// Projeção da taxonomia SSOT (fonte única: src/components/layout/Sidebar.tsx da Web) para os bottom tabs.
//
// PRINCÍPIO (MOBILE-009 D7): a navegação é uma PROJEÇÃO da taxonomia SSOT, não sua representação literal.
// A arquitetura de informação é única (mesma organização conceitual da Web); a apresentação pode variar
// conforme a plataforma. Aqui os 5 grupos da Web + "Painel Inicial" são projetados em 5 bottom tabs
// idiomáticos, com "Mais" agregando Organização + Configurações (convenção de overflow mobile).
//
// CRITÉRIO 10 (MOBILE-009): esta camada NÃO contém conhecimento de domínio — apenas rótulos da taxonomia
// (o QUE existe), sem regras de negócio, consultas de dados ou lógica clínica.

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
  {
    name: 'Acompanhamento',
    label: 'Acompanhamento',
    items: ['Agenda', 'Histórico de Saúde', 'Histórico de Exames', 'Composição Corporal', 'Monitoramento'],
  },
  { name: 'Documentos', label: 'Documentos', items: ['Exames'] },
  {
    name: 'MinhaSaude',
    label: 'Minha Saúde',
    items: ['Condições de Saúde', 'Medicamentos', 'Suplementos', 'Recursos de Saúde', 'Hábitos', 'Ciclo e Contracepção'],
  },
  { name: 'Mais', label: 'Mais', items: ['Despesas', 'Relatórios', 'Configurações'] },
]
