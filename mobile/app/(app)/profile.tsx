import { View, Text, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth'
import { colors, spacing, radius, font } from '@/lib/theme'

export default function ProfileScreen() {
  const { user, signOut } = useAuth()
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }} edges={['top']}>
      <View style={{ padding: spacing.xl, gap: spacing.lg }}>
        <Text style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: colors.onyx }}>Perfil</Text>

        <View style={{ backgroundColor: colors.cream, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg }}>
          <Text style={{ fontSize: font.size.xs, color: colors.mauve, textTransform: 'uppercase' }}>E-mail</Text>
          <Text style={{ fontSize: font.size.md, color: colors.onyx, marginTop: 2 }}>{user?.email ?? '—'}</Text>
        </View>

        <Pressable
          onPress={signOut}
          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingVertical: spacing.md, alignItems: 'center' }}
        >
          <Text style={{ color: colors.red, fontSize: font.size.md, fontWeight: font.weight.medium }}>Sair</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
