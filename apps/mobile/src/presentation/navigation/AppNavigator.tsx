// Incremento 2 · Etapa 5 — AppNavigator = Bottom Tabs (grupos do SSOT, MOBILE-009 D3/D6), e CADA tab
// envolve sua tela num native-stack próprio (Bottom Tabs + Stacks internos). Isso permite, no futuro,
// empilhar telas de detalhe dentro de cada grupo sem alterar a estrutura de tabs. `headerShown: false`
// mantém o visual idêntico à Etapa 4. A tab "Início" renderiza a HomeShell (Incremento 3), que mantém o
// logout no FooterSlot (preserva o critério 11). Cores/tipografia via tokens do DS (identidade DS-002).
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { ComponentType } from 'react'
import { HomeShell } from '../home/HomeShell'
import { PlaceholderScreen } from './PlaceholderScreen'
import { SSOT_TABS } from './ssotTabs'
import { useTheme } from '../theme'
import type { AppTabParamList } from './types'

const Tab = createBottomTabNavigator<AppTabParamList>()

/** Envolve a tela-raiz de uma tab num native-stack próprio (permite push de detalhes por grupo no futuro). */
function makeTabStack(RootComponent: ComponentType): ComponentType {
  const Stack = createNativeStackNavigator<{ Root: undefined }>()
  return function TabStack() {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Root" component={RootComponent} />
      </Stack.Navigator>
    )
  }
}

// Componentes de tela ESTÁVEIS (definidos uma vez, no nível de módulo — evita remontagem por render).
// "Início" renderiza a HomeShell (Incremento 3); os demais projetam os itens do grupo SSOT. Cada um é a raiz
// de um native-stack (Etapa 5).
const TAB_SCREENS = SSOT_TABS.map((tab) => {
  const Root: ComponentType =
    tab.name === 'Inicio' ? HomeShell : function TabPlaceholder() {
      return <PlaceholderScreen tab={tab} />
    }
  return { name: tab.name as keyof AppTabParamList, label: tab.label, Component: makeTabStack(Root) }
})

export function AppNavigator() {
  const t = useTheme()
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.color.identity.primary,
        tabBarInactiveTintColor: t.color.text.faint,
        tabBarStyle: { backgroundColor: t.color.surface.base, borderTopColor: t.color.border.default },
        tabBarLabelStyle: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 11 },
        // Sem biblioteca de ícones nesta etapa: barra apenas com rótulos (remove o espaço do ícone).
        tabBarIconStyle: { display: 'none' },
      }}
    >
      {TAB_SCREENS.map((s) => (
        <Tab.Screen key={s.name} name={s.name} component={s.Component} options={{ title: s.label }} />
      ))}
    </Tab.Navigator>
  )
}
