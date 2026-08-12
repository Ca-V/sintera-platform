import { Screen } from '@/components/ui'
import { BiomarkerList } from '@/components/BiomarkerList'

// Saúde / Indicadores — biomarcadores de toda a pessoa (scope=user). Rendering e
// carregamento no BiomarkerList (reutilizado também no detalhe de exame).
export default function SaudeScreen() {
  return (
    <Screen title="Indicadores" back scroll={false}>
      <BiomarkerList emptyText="Envie um exame para ver seus indicadores." />
    </Screen>
  )
}
