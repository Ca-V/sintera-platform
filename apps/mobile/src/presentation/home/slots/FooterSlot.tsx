// Slot Footer (Rodapé). Contém o logout (lógica EXISTENTE do Incremento 1, com a guarda de reentrância do
// ADR-017 — não é lógica de domínio nova). Colocado já na Etapa 1 para que o logout NUNCA fique ausente
// entre as etapas (preserva o critério 11 / não-regressão de autenticação).
import { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { Button } from '../../primitives'
import { useAuth } from '../../../state/AuthProvider'

export function FooterSlot() {
  const { signOut } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function handleSignOut() {
    if (isSigningOut) return
    setIsSigningOut(true)
    try {
      await signOut()
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <View style={styles.footer}>
      <Button label="Sair" variant="secondary" onPress={handleSignOut} loading={isSigningOut} loadingLabel="Saindo…" />
    </View>
  )
}

const styles = StyleSheet.create({
  footer: { marginTop: 8, alignItems: 'center' },
})
