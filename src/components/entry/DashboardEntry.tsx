import type { ReactNode } from 'react'
import PageEntry from './PageEntry'
import DashboardNew from '@/components/dashboard/DashboardNew'
import { pageVersion } from '@/lib/ui/renderVersion'

/**
 * Ponto ÚNICO de decisão do Dashboard. No cutover, a rota /dashboard passa a
 * renderizar <DashboardEntry legacy={<LegacyDashboard/>} />. Default: legacy.
 */
export default function DashboardEntry({ legacy }: { legacy: ReactNode }) {
  return <PageEntry marker="dashboard" version={pageVersion('dashboard')} legacy={legacy} next={<DashboardNew />} />
}
