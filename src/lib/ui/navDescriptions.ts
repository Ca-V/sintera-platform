// SSOT das DESCRIÇÕES SEMÂNTICAS de cada área da plataforma (fundadora 18/07). Uma só fonte para a
// Sidebar (tooltip por categoria) E os cards de Acesso Rápido do Painel — nunca divergem, voz única.
//
// PRINCÍPIO (fundadora): cada texto é a descrição SEMÂNTICA da FINALIDADE do módulo — INDEPENDENTE do
// contexto de exibição. Não é copy de um tooltip nem de um card; é "o que este módulo É/faz". Por isso o
// mesmo texto poderá, no futuro, alimentar a BUSCA GLOBAL, um ASSISTENTE inteligente, o ONBOARDING
// contextual e RECOMENDAÇÕES — quanto mais agnóstico do componente, maior o reaproveitamento. (Evolução
// natural: promover este arquivo a um CATÁLOGO ÚNICO de navegação — ver docs/HUB/DS quando decidido.)
//
// Padrão do texto (DS-001 §9): responde "O QUE EU CONSIGO FAZER AQUI?" (ação, não inventário) · começa com
// verbo · BENEFÍCIO/propósito antes da funcionalidade · exemplos quando agregam · linguagem simples ·
// máx. 2 linhas · reforça o acompanhamento longitudinal / continuidade do cuidado quando couber ·
// NUNCA usar "tratamento" (a SINTERA registra/organiza o cuidado, não acompanha tratamentos).
export const NAV_DESCRIPTION: Record<string, string> = {
  '/dashboard':               'Veja o que precisa da sua atenção e comece qualquer registro de saúde num só lugar.',
  '/dashboard/agenda':        'Organize consultas, exames, procedimentos e lembretes para não perder nenhum compromisso importante.',
  '/dashboard/timeline':      'Registre consultas, procedimentos, vacinas e outros eventos e acompanhe todo o histórico da sua jornada de saúde.',
  '/dashboard/saude':         'Consulte seus exames e acompanhe a evolução dos resultados ao longo do tempo.',
  '/dashboard/medidas':       'Acompanhe peso, IMC, gordura e massa muscular e veja como seu corpo muda ao longo do tempo.',
  '/dashboard/sinais-vitais': 'Registre pressão, glicemia e frequência cardíaca e acompanhe seus sinais vitais ao longo do tempo.',
  '/dashboard/exams':         'Centralize seus laudos e documentos de exames, com o original sempre preservado.',
  '/dashboard/condicoes':     'Registre suas condições e diagnósticos, seus e da família, e acompanhe cada um ao longo do tempo.',
  '/dashboard/medicamentos':  'Registre seus medicamentos, acompanhe o uso e receba lembretes de dose e recompra.',
  '/dashboard/suplementos':   'Registre seus suplementos, acompanhe o uso e receba lembretes na hora certa.',
  '/dashboard/recursos':      'Organize óculos, lentes, dispositivos e outros recursos que fazem parte do seu cuidado.',
  '/dashboard/habitos':       'Acompanhe seus hábitos e mantenha a continuidade do seu cuidado no dia a dia.',
  '/dashboard/ciclo':         'Registre seu ciclo menstrual e seus métodos contraceptivos e receba lembretes de troca e recompra.',
  '/dashboard/gastos':        'Registre despesas com sua saúde, acompanhe seus gastos e mantenha notas fiscais e comprovantes organizados.',
  '/dashboard/relatorio':     'Gere relatórios personalizados para compartilhar seu histórico de saúde com profissionais e instituições.',
  '/dashboard/configuracoes': 'Ajuste sua conta, seu perfil e suas preferências de notificação.',
}

/** Descrição de uma rota (vazio se não houver — degrada, não quebra). */
export const navDescription = (href: string): string => NAV_DESCRIPTION[href] ?? ''
