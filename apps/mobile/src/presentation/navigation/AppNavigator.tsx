// Incremento 2 · Etapa 4 — AppNavigator como Bottom Tabs, projetando os grupos da taxonomia SSOT
// (MOBILE-009 D3/D6). A tab "Início" mantém a HomePlaceholder do Incremento 1 (com o logout intacto —
// preserva o critério 11); as demais são placeholders projetando os itens do SSOT. Cores/tipografia via
// tokens do DS (identidade DS-002). Stacks internos por tab (native-stack) são a Etapa 5.
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { HomePlaceholder } from '../screens/HomePlaceholder'
import { PlaceholderScreen } from './PlaceholderScreen'
import { SSOT_TABS } from './ssotTabs'
import { useTheme } from '../theme'

export type AppTabParamList = {
  Inicio: undefined
  Acompanhamento: undefined
  Documentos: undefined
  MinhaSaude: undefined
  Mais: undefined
}

const Tab = createBottomTabNavigator<AppTabParamList>()

// Componentes de tela ESTÁVEIS (definidos uma vez, no nível de módulo — evita remontagem por render).
// "Início" reusa a HomePlaceholder (logout); os demais projetam os itens do grupo SSOT.
const TAB_SCREENS = SSOT_TABS.map((tab) => ({
  name: tab.name as keyof AppTabParamList,
  label: tab.label,
  Component: tab.name === 'Inicio' ? HomePlaceholder : function TabPlaceholder() {
    return <PlaceholderScreen tab={tab} />
  },
}))

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
