import { View, Text } from 'react-native'
import { Screen, Card, Button } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { colors, spacing, font } from '@/lib/theme'

export default function ProfileScreen() {
  const { user, signOut } = useAuth()
  return (
    <Screen title="Perfil" back>
      <Card>
        <Text style={{ fontSize: font.size.xs, color: colors.mauve, textTransform: 'uppercase' }}>E-mail</Text>
        <Text style={{ fontSize: font.size.md, color: colors.onyx, marginTop: 2 }}>{user?.email ?? '—'}</Text>
      </Card>
      <View style={{ marginTop: spacing.sm }}>
        <Button label="Sair" variant="ghost" onPress={signOut} />
      </View>
    </Screen>
  )
}
