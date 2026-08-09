// Stack interno da aba "Minha Saúde" (domínio central da IA por modelo mental — MOBILE-036). Reúne, na mesma
// ordem/terminologia da Sidebar Web: menu (Registros/Saúde/Histórico) + as telas de domínio + os EXAMES
// (lista/detalhe/upload/ômica) e os dois Históricos. "Exames" deixou de ser aba: é um Registro daqui. Só navegação.
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { MinhaSaudeMenuScreen } from '../screens/minhasaude/MinhaSaudeMenuScreen'
import { ConditionsScreen } from '../screens/minhasaude/ConditionsScreen'
import { HabitsScreen } from '../screens/minhasaude/HabitsScreen'
import { ResourcesScreen } from '../screens/minhasaude/ResourcesScreen'
import { MedicationsScreen } from '../screens/minhasaude/MedicationsScreen'
import { CicloScreen } from '../screens/minhasaude/CicloScreen'
import { TimelineScreen } from '../screens/agenda/TimelineScreen'
import { ComposicaoScreen } from '../screens/composicao/ComposicaoScreen'
import { MonitoramentoScreen } from '../screens/monitoramento/MonitoramentoScreen'
import { ExamsListScreen } from '../screens/exams/ExamsListScreen'
import { ExamDetailScreen } from '../screens/exams/ExamDetailScreen'
import { ExamUploadScreen } from '../screens/exams/ExamUploadScreen'
import { OmicsListScreen } from '../screens/omics/OmicsListScreen'
import { OmicsPanelScreen } from '../screens/omics/OmicsPanelScreen'
import { HistoricoExamesScreen } from '../screens/agenda/HistoricoExamesScreen'
import { IndicadorDetailScreen } from '../screens/exams/IndicadorDetailScreen'
import { useTheme } from '../theme'
import type { MinhaSaudeStackParamList } from './types'

const Stack = createNativeStackNavigator<MinhaSaudeStackParamList>()

export function MinhaSaudeStack() {
  const t = useTheme()
  const detail = {
    headerShown: true,
    headerStyle: { backgroundColor: t.color.surface.app },
    headerTintColor: t.color.text.default,
    headerTitleStyle: { fontFamily: 'HankenGrotesk_600SemiBold' },
    headerShadowVisible: false,
  } as const
  return (
    <Stack.Navigator>
      <Stack.Screen name="MinhaSaudeMenu" component={MinhaSaudeMenuScreen} options={{ headerShown: false }} />
      {/* Registros */}
      <Stack.Screen name="ExamsList" component={ExamsListScreen} options={{ ...detail, title: 'Exames' }} />
      <Stack.Screen name="ExamDetail" component={ExamDetailScreen} options={{ ...detail, title: 'Exame' }} />
      <Stack.Screen name="ExamUpload" component={ExamUploadScreen} options={{ ...detail, title: 'Adicionar exame' }} />
      <Stack.Screen name="OmicsList" component={OmicsListScreen} options={{ ...detail, title: 'Exames de ômica' }} />
      <Stack.Screen name="OmicsPanel" component={OmicsPanelScreen} options={{ ...detail, title: 'Painel de ômica' }} />
      <Stack.Screen name="Medications" component={MedicationsScreen} options={{ ...detail, title: 'Medicamentos' }} />
      <Stack.Screen name="Resources" component={ResourcesScreen} options={{ ...detail, title: 'Recursos de Saúde' }} />
      {/* Saúde */}
      <Stack.Screen name="Conditions" component={ConditionsScreen} options={{ ...detail, title: 'Condições de Saúde' }} />
      <Stack.Screen name="Composicao" component={ComposicaoScreen} options={{ ...detail, title: 'Composição Corporal' }} />
      <Stack.Screen name="Ciclo" component={CicloScreen} options={{ ...detail, title: 'Ciclo e Contracepção' }} />
      <Stack.Screen name="Monitoramento" component={MonitoramentoScreen} options={{ ...detail, title: 'Monitoramento' }} />
      <Stack.Screen name="Habits" component={HabitsScreen} options={{ ...detail, title: 'Hábitos' }} />
      {/* Histórico */}
      <Stack.Screen name="HistoricoExames" component={HistoricoExamesScreen} options={{ ...detail, title: 'Histórico de Exames' }} />
      <Stack.Screen name="IndicadorDetail" component={IndicadorDetailScreen} options={{ ...detail, title: 'Indicador' }} />
      <Stack.Screen name="Timeline" component={TimelineScreen} options={{ ...detail, title: 'Histórico de Saúde' }} />
    </Stack.Navigator>
  )
}
