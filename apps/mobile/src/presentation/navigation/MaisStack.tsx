// Stack interno da aba "Mais" (Inc.4). Segue o padrão do AppNavigator (cada tab é um native-stack próprio),
// mas com DUAS telas: o menu (raiz, sem header — visual das outras abas) e o Perfil (detalhe empilhável, com
// header nativo temático que provê o "voltar"). É só navegação — sem regra de negócio.
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { MaisMenuScreen } from '../screens/mais/MaisMenuScreen'
import { ProfileScreen } from '../screens/profile/ProfileScreen'
import { DespesasScreen } from '../screens/despesas/DespesasScreen'
import { ConfiguracoesScreen } from '../screens/mais/ConfiguracoesScreen'
// CARE-003 — o lado de quem RECEBE o convite (o segundo perfil da mesma conta).
import { PainelProfissionalScreen } from '../screens/profissional/PainelProfissionalScreen'
import { PerfilProfissionalScreen } from '../screens/profissional/PerfilProfissionalScreen'
import { ConviteRecebidoScreen } from '../screens/profissional/ConviteRecebidoScreen'
import { PacienteDoProfissionalScreen } from '../screens/profissional/PacienteDoProfissionalScreen'
import { useTheme } from '../theme'
import type { MaisStackParamList } from './types'

const Stack = createNativeStackNavigator<MaisStackParamList>()

export function MaisStack() {
  const t = useTheme()
  return (
    <Stack.Navigator>
      <Stack.Screen name="MaisMenu" component={MaisMenuScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          headerShown: true,
          title: 'Perfil',
          headerStyle: { backgroundColor: t.color.surface.app },
          headerTintColor: t.color.text.default,
          headerTitleStyle: { fontFamily: 'HankenGrotesk_600SemiBold' },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="Despesas"
        component={DespesasScreen}
        options={{
          headerShown: true,
          title: 'Despesas',
          headerStyle: { backgroundColor: t.color.surface.app },
          headerTintColor: t.color.text.default,
          headerTitleStyle: { fontFamily: 'HankenGrotesk_600SemiBold' },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="Configuracoes"
        component={ConfiguracoesScreen}
        options={{
          headerShown: true,
          title: 'Configurações',
          headerStyle: { backgroundColor: t.color.surface.app },
          headerTintColor: t.color.text.default,
          headerTitleStyle: { fontFamily: 'HankenGrotesk_600SemiBold' },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="PainelProfissional"
        component={PainelProfissionalScreen}
        options={{
          headerShown: true,
          title: 'Pessoas que acompanho',
          headerStyle: { backgroundColor: t.color.surface.app },
          headerTintColor: t.color.text.default,
          headerTitleStyle: { fontFamily: 'HankenGrotesk_600SemiBold' },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="PerfilProfissional"
        component={PerfilProfissionalScreen}
        options={{
          headerShown: true,
          title: 'Perfil profissional',
          headerStyle: { backgroundColor: t.color.surface.app },
          headerTintColor: t.color.text.default,
          headerTitleStyle: { fontFamily: 'HankenGrotesk_600SemiBold' },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="ConviteRecebido"
        component={ConviteRecebidoScreen}
        options={{
          headerShown: true,
          title: 'Convite',
          headerStyle: { backgroundColor: t.color.surface.app },
          headerTintColor: t.color.text.default,
          headerTitleStyle: { fontFamily: 'HankenGrotesk_600SemiBold' },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="PacienteDoProfissional"
        component={PacienteDoProfissionalScreen}
        options={{
          headerShown: true,
          // Sem nome no cabeçalho, de propósito: o título ficaria no histórico de navegação e na troca de
          // aplicativos do sistema. Quem a pessoa acompanha não precisa aparecer por cima do app.
          title: 'Pessoa',
          headerStyle: { backgroundColor: t.color.surface.app },
          headerTintColor: t.color.text.default,
          headerTitleStyle: { fontFamily: 'HankenGrotesk_600SemiBold' },
          headerShadowVisible: false,
        }}
      />
    </Stack.Navigator>
  )
}
