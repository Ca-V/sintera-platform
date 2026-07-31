// Stack interno da aba "Documentos" (Inc.5). Segue o padrão do MaisStack: lista (raiz, sem header) + detalhe
// do exame (empilhável, com header nativo temático que provê o "voltar"). Só navegação.
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ExamsListScreen } from '../screens/exams/ExamsListScreen'
import { ExamDetailScreen } from '../screens/exams/ExamDetailScreen'
import { ExamUploadScreen } from '../screens/exams/ExamUploadScreen'
import { useTheme } from '../theme'
import type { DocumentosStackParamList } from './types'

const Stack = createNativeStackNavigator<DocumentosStackParamList>()

export function DocumentosStack() {
  const t = useTheme()
  return (
    <Stack.Navigator>
      <Stack.Screen name="ExamsList" component={ExamsListScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="ExamDetail"
        component={ExamDetailScreen}
        options={{
          headerShown: true,
          title: 'Exame',
          headerStyle: { backgroundColor: t.color.surface.app },
          headerTintColor: t.color.text.default,
          headerTitleStyle: { fontFamily: 'HankenGrotesk_600SemiBold' },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="ExamUpload"
        component={ExamUploadScreen}
        options={{
          headerShown: true,
          title: 'Adicionar exame',
          headerStyle: { backgroundColor: t.color.surface.app },
          headerTintColor: t.color.text.default,
          headerTitleStyle: { fontFamily: 'HankenGrotesk_600SemiBold' },
          headerShadowVisible: false,
        }}
      />
    </Stack.Navigator>
  )
}
