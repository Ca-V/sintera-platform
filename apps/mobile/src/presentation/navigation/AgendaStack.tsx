// Stack interno da aba "Agenda" (domínio Agenda): Agenda (raiz, sem header) + EventForm (detalhe empilhável).
// Só navegação (sem regra de negócio). Histórico de Saúde/Exames, Composição e Monitoramento saíram daqui
// (arquitetura de 5 abas — MOBILE-036): agora vivem em Minha Saúde (histórico/composição/monitoramento) e Exames.
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { AgendaScreen } from '../screens/agenda/AgendaScreen'
import { EventFormScreen } from '../screens/agenda/EventFormScreen'
import type { AgendaStackParamList } from './types'

const Stack = createNativeStackNavigator<AgendaStackParamList>()

export function AgendaStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Agenda" component={AgendaScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EventForm" component={EventFormScreen} options={{ title: 'Evento', headerBackTitle: 'Voltar' }} />
    </Stack.Navigator>
  )
}
