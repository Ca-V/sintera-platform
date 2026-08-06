// Stack interno da aba "Exames" (ex-"Documentos"): lista (raiz) + detalhe + upload + ômica + Histórico de Exames.
// O histórico do exame pertence a Exames (arquitetura de 5 abas — MOBILE-036). Só navegação.
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ExamsListScreen } from '../screens/exams/ExamsListScreen'
import { ExamDetailScreen } from '../screens/exams/ExamDetailScreen'
import { ExamUploadScreen } from '../screens/exams/ExamUploadScreen'
import { OmicsListScreen } from '../screens/omics/OmicsListScreen'
import { OmicsPanelScreen } from '../screens/omics/OmicsPanelScreen'
import { HistoricoExamesScreen } from '../screens/agenda/HistoricoExamesScreen'
import { useTheme } from '../theme'
import type { ExamesStackParamList } from './types'

const Stack = createNativeStackNavigator<ExamesStackParamList>()

export function ExamesStack() {
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
      <Stack.Screen name="ExamsList" component={ExamsListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ExamDetail" component={ExamDetailScreen} options={{ ...detail, title: 'Exame' }} />
      <Stack.Screen name="ExamUpload" component={ExamUploadScreen} options={{ ...detail, title: 'Adicionar exame' }} />
      <Stack.Screen name="OmicsList" component={OmicsListScreen} options={{ ...detail, title: 'Exames de ômica' }} />
      <Stack.Screen name="OmicsPanel" component={OmicsPanelScreen} options={{ ...detail, title: 'Painel de ômica' }} />
      <Stack.Screen name="HistoricoExames" component={HistoricoExamesScreen} options={{ ...detail, title: 'Histórico de Exames' }} />
    </Stack.Navigator>
  )
}
