import type { ReactNode } from 'react'
import PageEntry from './PageEntry'
import IndicatorNew from '@/components/indicator/IndicatorNew'
import { pageVersion } from '@/lib/ui/renderVersion'

/** Ponto único de decisão de Indicadores. Default: legacy. */
export default function IndicatorEntry({ legacy }: { legacy: ReactNode }) {
  return <PageEntry marker="indicator" version={pageVersion('indicator')} legacy={legacy} next={<IndicatorNew />} />
}
