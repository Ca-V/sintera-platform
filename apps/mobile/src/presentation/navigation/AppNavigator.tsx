// Incremento 2 · Etapa 2 — AppNavigator (ramo autenticado do gate). Contém apenas a Home (placeholder).
// Nesta etapa é um componente simples; a conversão para navegador e a introdução de Bottom Tabs + stacks
// internos são as Etapas 3–5. Objetivo da Etapa 2: migrar o gate SEM alterar comportamento.
import { HomePlaceholder } from '../screens/HomePlaceholder'

export function AppNavigator() {
  return <HomePlaceholder />
}
