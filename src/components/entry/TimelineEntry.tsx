import type { ReactNode } from 'react'
import PageEntry from './PageEntry'
import TimelineNew from '@/components/timeline/TimelineNew'
import { pageVersion } from '@/lib/ui/renderVersion'

/** Ponto único de decisão da Timeline. Default: legacy. */
export default function TimelineEntry({ legacy }: { legacy: ReactNode }) {
  return <PageEntry marker="timeline" version={pageVersion('timeline')} legacy={legacy} next={<TimelineNew />} />
}
