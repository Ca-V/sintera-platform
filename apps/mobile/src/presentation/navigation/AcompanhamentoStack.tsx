// Stack interno da aba "Acompanhamento" (domínio Agenda): Agenda (raiz, sem header — visual das abas) +
// EventForm (detalhe empilhável, com header para voltar). Só navegação (sem regra de negócio).
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { AgendaScreen } from '../screens/agenda/AgendaScreen'
import { TimelineScreen } from '../screens/agenda/TimelineScreen'
import { HistoricoExamesScreen } from '../screens/agenda/HistoricoExamesScreen'
import { ComposicaoScreen } from '../screens/composicao/ComposicaoScreen'
import { MonitoramentoScreen } from '../screens/monitoramento/MonitoramentoScreen'
import { EventFormScreen } from '../screens/agenda/EventFormScreen'
import type { AcompanhamentoStackParamList } from './types'

const Stack = createNativeStackNavigator<AcompanhamentoStackParamList>()

export function AcompanhamentoStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Agenda" component={AgendaScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Timeline" component={TimelineScreen} options={{ title: 'Histórico de Saúde', headerBackTitle: 'Agenda' }} />
      <Stack.Screen name="HistoricoExames" component={HistoricoExamesScreen} options={{ title: 'Histórico de Exames', headerBackTitle: 'Agenda' }} />
      <Stack.Screen name="Composicao" component={ComposicaoScreen} options={{ title: 'Composição Corporal', headerBackTitle: 'Agenda' }} />
      <Stack.Screen name="Monitoramento" component={MonitoramentoScreen} options={{ title: 'Monitoramento', headerBackTitle: 'Agenda' }} />
      <Stack.Screen name="EventForm" component={EventFormScreen} options={{ title: 'Evento', headerBackTitle: 'Voltar' }} />
    </Stack.Navigator>
  )
}
