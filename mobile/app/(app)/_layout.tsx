import { Tabs } from 'expo-router'
import { colors } from '@/lib/theme'

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.petal,
        tabBarInactiveTintColor: colors.mauve,
        tabBarStyle: { backgroundColor: colors.cream, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="exams" options={{ title: 'Exames' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  )
}
