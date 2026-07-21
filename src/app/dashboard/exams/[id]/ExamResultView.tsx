'use client'
// Resultado de Exame — apresentação migrada para o DS-002 (headless recipes via adaptador Web).
// Presentation-only: recebe os dados já carregados; a busca/mutação permanece na página (Supabase).
import * as ds from '@sintera/design-system'
import * as UI from '@/lib/ui/ds'
import type { LabRow, LabMaterialGroup } from '@/lib/ui/ds/domain'

export interface ExamResultData {
  title: string
  documentType?: string
  lab?: string
  requestedBy?: string
  collectedAt?: string
  material?: string
  indicators: { value: string; label: string; trend?: ds.Trend }[]
  labRows?: LabRow[]
  labGroups?: LabMaterialGroup[] // agrupamento material→exame (fiel ao documento)
  onViewOriginal?: () => void
}

function Inner({ data }: { data: ExamResultData }) {
  const t = UI.useDs()
  const layout = ds.template(t, 'examResult')
  return (
    <div style={{ background: layout.background, minHeight: '100%' }}>
      <div style={{ maxWidth: layout.maxWidth, margin: '0 auto', padding: `${layout.paddingY}px ${layout.paddingX}px`, display: 'flex', flexDirection: 'column', gap: layout.sectionGap }}>
        <UI.Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div>
              {data.documentType && <UI.Badge tone="info">{data.documentType}</UI.Badge>}
              <UI.Heading level="page" style={{ marginTop: 8 }}>{data.title}</UI.Heading>
              <div style={{ marginTop: 6, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {data.lab && <UI.Text tone="muted" role="bodySmall">{data.lab}</UI.Text>}
                {data.requestedBy && <UI.Text tone="muted" role="bodySmall">Solicitante: {data.requestedBy}</UI.Text>}
                {data.collectedAt && <UI.Text tone="muted" role="bodySmall">Coleta: {data.collectedAt}</UI.Text>}
                {data.material && <UI.Text tone="muted" role="bodySmall">Material: {data.material}</UI.Text>}
              </div>
            </div>
            <UI.Button variant="ghost" size="sm" onClick={data.onViewOriginal}>Ver documento original</UI.Button>
          </div>
        </UI.Card>

        {data.indicators.length > 0 && (
          <UI.Card>
            <UI.Heading level="card">Indicadores</UI.Heading>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 20, marginTop: 12 }}>
              {data.indicators.map((ind, i) => <UI.Indicator key={i} value={ind.value} label={ind.label} trend={ind.trend} />)}
            </div>
          </UI.Card>
        )}

        <UI.Card>
          <UI.Heading level="card">Resultados laboratoriais</UI.Heading>
          <div style={{ marginTop: 12, overflowX: 'auto' }}>
            <UI.LaboratoryTable rows={data.labGroups ? undefined : data.labRows} groups={data.labGroups} />
          </div>
        </UI.Card>
      </div>
    </div>
  )
}

export function ExamResultView({ data }: { data: ExamResultData }) {
  return (
    <UI.DsThemeProvider mode="light">
      <Inner data={data} />
    </UI.DsThemeProvider>
  )
}
