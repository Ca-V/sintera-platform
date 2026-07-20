// Raiz do app — Passo 1 (fundação). Placeholder: os provedores (estado, navegação, DS)
// entram nos passos seguintes da Etapa B. Sem funcionalidade de negócio ainda.
import { StatusBar } from 'expo-status-bar'
import { Text, View } from 'react-native'

export function App() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', textAlign: 'center' }}>
        SINTERA — fundação da plataforma móvel
      </Text>
      <StatusBar style="auto" />
    </View>
  )
}
