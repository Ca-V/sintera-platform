// Incremento 2 · Etapa 5 — AppNavigator = Bottom Tabs (grupos do SSOT, MOBILE-009 D3/D6), e CADA tab
// envolve sua tela num native-stack próprio (Bottom Tabs + Stacks internos). Isso permite, no futuro,
// empilhar telas de detalhe dentro de cada grupo sem alterar a estrutura de tabs. `headerShown: false`
// mantém o visual idêntico à Etapa 4. A tab "Início" renderiza a HomeShell (Incremento 3), que mantém o
// logout no FooterSlot (preserva o critério 11). Cores/tipografia via tokens do DS (identidade DS-002).
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { ComponentType } from 'react'
import { HomeContainer } from '../screens/home/HomeContainer'
import { RedeCuidadoStack } from './RedeCuidadoStack'
import { AgendaStack } from './AgendaStack'
import { MinhaSaudeStack } from './MinhaSaudeStack'
import { MaisStack } from './MaisStack'
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
  // "Início" = HomeShell; "Mais" = MaisStack (menu do grupo + Perfil, Inc.4 — já é um stack, não reembrulha);
  // demais = placeholder do grupo. Cada tab é a raiz de um native-stack próprio (Etapa 5).
  const Component: ComponentType =
    tab.name === 'Inicio'
      ? makeTabStack(HomeContainer)
      : tab.name === 'Mais'
        ? MaisStack
        : tab.name === 'RedeCuidado'
          ? RedeCuidadoStack
          : tab.name === 'Agenda'
            ? AgendaStack
            : tab.name === 'MinhaSaude'
              ? MinhaSaudeStack
              : makeTabStack(function TabPlaceholder() {
                  return <PlaceholderScreen tab={tab} />
                })
  return { name: tab.name as keyof AppTabParamList, label: tab.label, Component }
})

/**
 * A tela RAIZ de cada aba — para onde tocar na aba sempre leva.
 *
 * "Início" fica de fora porque não tem stack interno: já é a raiz. Declarado aqui, e não deduzido da primeira
 * tela do navegador, porque deduzir amarraria o comportamento à ordem de declaração das telas — que muda quando
 * alguém acrescenta uma, sem que ninguém perceba a consequência.
 */
const RAIZ_DA_ABA: Record<string, string | undefined> = {
  Agenda: 'Agenda',
  MinhaSaude: 'MinhaSaudeMenu',
  RedeCuidado: 'RedeMenu',
  Mais: 'MaisMenu',
}

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
        <Tab.Screen
          key={s.name}
          name={s.name}
          component={s.Component}
          options={{ title: s.label }}
          // TOCAR NA ABA VOLTA AO COMEÇO DA CATEGORIA (achado da fundadora, 30/08).
          //
          // O comportamento padrão preserva onde a pessoa parou dentro de cada aba. Faz sentido para uma aba que
          // é um CONTEÚDO — voltar para o que se estava lendo. Não faz para uma que é um MENU: quem entrou em
          // Pedidos de exame, foi ao Início e tocou em "Minha Saúde" espera o menu de Minha Saúde, não a tela
          // onde parou. A aba passa a se comportar como o rótulo promete.
          listeners={({ navigation }) => ({
            tabPress: () => {
              // Navega explicitamente para a RAIZ daquela aba. Cada uma declara a sua em `RAIZ_DA_ABA` — depender
              // de "a primeira tela do stack" seria depender de ordem de declaração, que muda sem aviso.
              const raiz = RAIZ_DA_ABA[s.name]
              if (!raiz) return
              ;(navigation as unknown as { navigate: (n: string, p?: unknown) => void })
                .navigate(s.name, { screen: raiz })
            },
          })}
        />
      ))}
    </Tab.Navigator>
  )
}
