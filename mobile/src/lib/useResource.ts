// Espelho-Mobile do `useListResource` da Web (src/lib/ui/useListResource.ts).
// Mesmo CONTRATO de recurso de lista: GET lista · POST cria · POST|PATCH edita ·
// DELETE ?id= remove. A diferença é só o transporte: aqui usamos o `api` (Bearer)
// em vez de `fetch` com cookie. As chaves de envelope (`listKey`) e o método de
// edição (`editMethod`) são configuração — idênticos aos da Web, sem reabrir rotas.
import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from './api'

export interface ListResource<T> {
  items: T[]
  loading: boolean
  saving: boolean
  busyId: string | null
  error: string | null
  setError: (e: string | null) => void
  reload: () => Promise<void>
  /** Cria (sem editingId) ou edita (com editingId). `true` em sucesso (e recarrega). */
  save: (body: Record<string, unknown>, editingId?: string | null) => Promise<boolean>
  /** Remove por id (DELETE ?id=). A confirmação fica na tela. `true` em sucesso. */
  remove: (id: string) => Promise<boolean>
}

export interface ListResourceOptions {
  /** Endpoint do recurso, ex.: '/api/condicoes'. */
  endpoint: string
  /** Chave do array na resposta GET, ex.: 'conditions' → `{ conditions: [...] }`. */
  listKey: string
  /** Método da EDIÇÃO: 'PATCH' (condicoes/recursos/habitos) ou 'POST' (id no corpo —
   *  sinais-vitais/medicamentos). Default: 'POST'. */
  editMethod?: 'PATCH' | 'POST'
}

function messageOf(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message : fallback
}

export function useResource<T>({ endpoint, listKey, editMethod = 'POST' }: ListResourceOptions): ListResource<T> {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<Record<string, unknown>>(endpoint)
      setItems((data[listKey] ?? []) as T[])
      setError(null)
    } catch (e) {
      setError(messageOf(e, 'Falha ao carregar.'))
    } finally {
      setLoading(false)
    }
  }, [endpoint, listKey])

  useEffect(() => { reload() }, [reload])

  const save = useCallback(async (body: Record<string, unknown>, editingId?: string | null): Promise<boolean> => {
    setSaving(true)
    try {
      const payload = editingId ? { id: editingId, ...body } : body
      if (editingId && editMethod === 'PATCH') await api.patch(endpoint, payload)
      else await api.post(endpoint, payload)
      setError(null)
      await reload()
      return true
    } catch (e) {
      setError(messageOf(e, 'Falha ao salvar.'))
      return false
    } finally {
      setSaving(false)
    }
  }, [endpoint, editMethod, reload])

  const remove = useCallback(async (id: string): Promise<boolean> => {
    setBusyId(id)
    try {
      await api.del(`${endpoint}?id=${encodeURIComponent(id)}`)
      await reload()
      return true
    } catch (e) {
      setError(messageOf(e, 'Falha ao remover.'))
      return false
    } finally {
      setBusyId(null)
    }
  }, [endpoint, reload])

  return { items, loading, saving, busyId, error, setError, reload, save, remove }
}
