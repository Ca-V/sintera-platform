// Polling em segundo plano enquanto uma condição for verdadeira — fonte ÚNICA (antes duplicada nos hooks de
// lista/detalhe). Enquanto `active`, chama `tick` a cada `intervalMs`, até `maxTicks` (teto de segurança para
// não pollar preso). `cycleKey` deve mudar a cada ciclo (ex.: os dados carregados) para reagendar o próximo tick.
import { useEffect, useRef } from 'react'

export function usePollWhile(
  active: boolean,
  tick: () => void,
  cycleKey: unknown,
  intervalMs = 4000,
  maxTicks = 20,
): void {
  const ticks = useRef(0)
  useEffect(() => {
    if (!active) {
      ticks.current = 0
      return
    }
    if (ticks.current >= maxTicks) return
    const id = setTimeout(() => {
      ticks.current += 1
      tick()
    }, intervalMs)
    return () => clearTimeout(id)
  }, [active, tick, cycleKey, intervalMs, maxTicks])
}
