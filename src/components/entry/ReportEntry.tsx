import type { ReactNode } from 'react'
import PageEntry from './PageEntry'
import ReportNew from '@/components/report/ReportNew'
import { pageVersion } from '@/lib/ui/renderVersion'

/** Ponto único de decisão de Relatórios. Default: legacy. */
export default function ReportEntry({ legacy }: { legacy: ReactNode }) {
  return <PageEntry marker="report" version={pageVersion('report')} legacy={legacy} next={<ReportNew />} />
}
