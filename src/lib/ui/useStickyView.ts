import { useEffect, useState } from 'react'

// Guarda a última visualização escolhida (por módulo) no localStorage e a restaura
// ao reabrir a página. SSR-safe: inicia com o padrão e restaura só após montar
// (evita divergência de hidratação). Cada módulo usa a sua própria chave.
export function useStickyView<T extends string>(key: string, initial: T): [T, (v: T) => void] {
  const [view, setViewState] = useState<T>(initial)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restaura preferência salva
      if (saved) setViewState(saved as T)
    } catch { /* ignora acesso indisponível ao localStorage */ }
  }, [key])
  const setView = (v: T) => {
    setViewState(v)
    try { localStorage.setItem(key, v) } catch { /* ignora */ }
  }
  return [view, setView]
}
