// Slot Welcome — bloco de IDENTIDADE + saudação (UX-002): wordmark SINTERA (cor-âncora, já que no Mobile não há
// sidebar) + saudação calorosa (Bom dia/Boa tarde/Boa noite + primeiro nome) + data. Apresentação PURA: o nome
// chega por INJEÇÃO (prop, do HomeContainer) — sem sessão/rede aqui (INV-HOME-001). Sem navegação.
import { View } from 'react-native'
import { heading, text } from '@sintera/design-system'
import { Text } from '../../primitives'
import { useTheme } from '../../theme'

const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

function greetingNow(): string {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}
function dateNow(): string {
  const d = new Date()
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`
}

export function WelcomeSlot({ name }: { name?: string | null }) {
  const t = useTheme()
  const first = name?.trim().split(' ')[0]
  return (
    <View style={{ gap: 4 }}>
      <Text spec={text(t, { role: 'label' })} style={{ color: t.color.identity.primary, letterSpacing: 3, fontSize: 14 }}>SINTERA</Text>
      <Text spec={heading(t, { level: 'page' })}>{greetingNow()}{first ? `, ${first}` : ''} 👋</Text>
      <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{dateNow()}</Text>
    </View>
  )
}
