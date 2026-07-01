import type { ReactNode } from 'react'
import type { RenderVersion } from '@/lib/ui/renderVersion'

/**
 * Orquestrador ÚNICO de troca de implementação. Renderiza legacy OU a nova
 * composição — nunca as duas, nunca uma chamando a outra (independência total).
 * Instrumenta a tela com data-render-version para facilitar suporte na transição.
 */
export default function PageEntry({ marker, version, legacy, next }: {
  marker: string
  version: RenderVersion
  legacy: ReactNode
  next: ReactNode
}) {
  return <div data-render-version={`${marker}:${version}`}>{version === 'v2' ? next : legacy}</div>
}
