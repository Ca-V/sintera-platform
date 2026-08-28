// De QUE seção falamos → COMO se chega nela neste aplicativo.
//
// O catálogo (@sintera/core · PLATFORM_NAV) diz quais seções existem, como se chamam e o que cada uma faz. Ele
// não sabe navegar: a Web usa `href`, aqui é aba + tela do stack. Este arquivo é essa tradução, e só ela —
// MECANISMO de plataforma, que é justamente o que a base única permite divergir.
//
// Trocar o nome de uma rota mexe aqui e em nenhum outro lugar; trocar o NOME DA SEÇÃO mexe no core e vale para
// as duas pontas. É essa separação que impede a Web e o aplicativo de chamarem a mesma coisa por nomes diferentes.
import type { SectionId } from '@sintera/core'
import type { AppTabParamList } from './types'

export interface SectionRoute {
  readonly tab: keyof AppTabParamList
  /** Tela dentro do stack da aba. Ausente = a própria raiz da aba. */
  readonly screen?: string
  readonly params?: Record<string, unknown>
}

export const SECTION_ROUTES: Readonly<Record<SectionId, SectionRoute>> = {
  inicio: { tab: 'Inicio' },
  agenda: { tab: 'Agenda' },

  exames: { tab: 'MinhaSaude', screen: 'ExamsList' },
  // O pedido é a ORIGEM do fluxo (Q1) e se alcança por si — hoje como aba da lista de Exames, como na Web.
  pedidos: { tab: 'MinhaSaude', screen: 'ExamsList', params: { tab: 'orders' } },
  documentos: { tab: 'MinhaSaude', screen: 'Documents' },

  // Medicamentos e Suplementos são a MESMA tela, distinguidos por `kind` — como na Web, que também tem duas
  // entradas para uma tabela só.
  medicamentos: { tab: 'MinhaSaude', screen: 'Medications', params: { supplements: false } },
  suplementos: { tab: 'MinhaSaude', screen: 'Medications', params: { supplements: true } },
  recursos: { tab: 'MinhaSaude', screen: 'Resources' },

  condicoes: { tab: 'MinhaSaude', screen: 'Conditions' },
  medidas: { tab: 'MinhaSaude', screen: 'Composicao' },
  ciclo: { tab: 'MinhaSaude', screen: 'Ciclo' },
  monitoramento: { tab: 'MinhaSaude', screen: 'Monitoramento' },
  habitos: { tab: 'MinhaSaude', screen: 'Habits' },

  'historico-exames': { tab: 'MinhaSaude', screen: 'HistoricoExames' },
  'historico-saude': { tab: 'MinhaSaude', screen: 'Timeline' },

  rede: { tab: 'RedeCuidado' },
  despesas: { tab: 'Mais', screen: 'Despesas' },
  configuracoes: { tab: 'Mais', screen: 'Configuracoes' },
}
