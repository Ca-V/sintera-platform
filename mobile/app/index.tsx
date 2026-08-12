import { Redirect } from 'expo-router'

// Entrada: manda para a área autenticada; a guarda (root _layout) desvia para o login
// se não houver sessão.
export default function Index() {
  return <Redirect href="/(app)" />
}
