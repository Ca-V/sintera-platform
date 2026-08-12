import { View, Text, ScrollView, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '@/lib/auth'
import { colors, spacing, radius, font } from '@/lib/theme'

const QUICK = [
  { label: 'Exames', desc: 'Laudos e extração', route: '/(app)/exams' },
  { label: 'Perfil', desc: 'Seus dados', route: '/(app)/profile' },
] as const

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()
  const name = user?.email?.split('@')[0] ?? 'por aqui'

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
        <View style={{ gap: spacing.xs }}>
          <Text style={{ fontSize: font.size.xxl, fontWeight: font.weight.semibold, color: colors.onyx }}>
            Olá, {name} 👋
          </Text>
          <Text style={{ fontSize: font.size.md, color: colors.mauve }}>
            Sua saúde organizada, no seu bolso.
          </Text>
        </View>

        <View style={{ gap: spacing.md }}>
          {QUICK.map((q) => (
            <Pressable
              key={q.route}
              onPress={() => router.push(q.route)}
              style={{
                backgroundColor: colors.cream,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.lg,
              }}
            >
              <Text style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.onyx }}>{q.label}</Text>
              <Text style={{ fontSize: font.size.sm, color: colors.mauve, marginTop: 2 }}>{q.desc}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
