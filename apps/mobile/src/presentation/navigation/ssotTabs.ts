// Projeção da taxonomia SSOT (fonte única: src/components/layout/Sidebar.tsx da Web) para os bottom tabs.
//
// PRINCÍPIO (MOBILE-009 D7): a navegação é uma PROJEÇÃO da taxonomia SSOT, não sua representação literal.
// A arquitetura de informação é ÚNICA (mesma organização/sequência/terminologia da Web); a apresentação varia por
// plataforma.
//
// IA CONFIRMADA (2026-08-06, ADR-021 / MOBILE-036 — modelo mental do usuário): 5 abas.
// - Minha Saúde é o domínio central: Registros (Exames, Medicamentos, Suplementos, Recursos) · Saúde (Condições,
//   Composição, Ciclo, Monitoramento, Hábitos) · Histórico (Hist. de Exames, Hist. de Saúde). "Exames" não é aba.
// - Rede de Cuidado (entidade): Relatórios hoje; Profissionais/Compartilhamentos na CARE-002.
// - Mais: funções secundárias (Despesas · Configurações · Perfil).
//
// CRITÉRIO 10 (MOBILE-009): esta camada NÃO contém conhecimento de domínio — apenas os rótulos das ABAS.
//
// A lista de itens de cada aba MORAVA aqui, escrita à mão. Era a terceira cópia da taxonomia (com a Sidebar
// e o menu de Minha Saúde) e ninguém a lia de verdade — só uma tela placeholder já inalcançável. Cópia que
// ninguém lê é a que diverge primeiro. O catálogo é PLATFORM_NAV, em @sintera/core (base única, 27/08).

export type SsotTab = {
  /** Nome da rota (estável, sem espaços/acentos). */
  readonly name: string
  /** Rótulo exibido (derivado do SSOT). */
  readonly label: string
}

export const SSOT_TABS: readonly SsotTab[] = [
  { name: 'Inicio', label: 'Início' },
  { name: 'Agenda', label: 'Agenda' },
  { name: 'MinhaSaude', label: 'Minha Saúde' },
  { name: 'RedeCuidado', label: 'Rede de Cuidado' },
  { name: 'Mais', label: 'Mais' },
]
