'use client'

// ============================================================
// SINTERA — DONO do ciclo de vida de RECURSO DE LISTA (cliente)
// ============================================================
// Conceito permanente: um "recurso de lista" é uma coleção user-scoped exposta em
// `/api/<módulo>` (GET lista · POST cria · POST|PATCH edita · DELETE ?id= remove).
// É o ESPELHO-CLIENTE da rota `authed` do servidor (src/lib/api/http.ts): o servidor
// já tinha dono; a metade cliente (buscar → listar → salvar → remover + estados
// loading/busy/erro + extração de erro `e.error ?? 'Falha ao salvar.'`) estava órfã e
// reimplementada em ~7 páginas CRUD. Este hook é esse dono único.
//
// Fronteira: o hook possui o RECURSO (itens + ciclo assíncrono + persistência), NÃO
// o formulário. Estado de formulário (showForm, editingId, valores dos campos) e a
// confirmação de exclusão (mensagem do domínio) permanecem na página. O envelope da
// resposta (`listKey`) e o método de edição (`editMethod`) são CONFIGURAÇÃO do recurso,
// não regra de negócio — parametrizados para acomodar as rotas existentes sem reabri-las.
//
// Prepara o futuro: refresh/invalidável em UM lugar (ingestões externas — Apple Health,
// Health Connect, labs, FHIR — disparam reload sem tocar cada página; o cliente Mobile
// reutiliza o mesmo dono).
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import { useUser } from '@/context/UserContext'

export interface ListResource<T> {
  items: T[]
  loading: boolean
  saving: boolean
  busyId: string | null
  error: string | null
  setError: (e: string | null) => void
  reload: () => Promise<void>
  /** Cria (sem editingId) ou edita (com editingId). Devolve `true` em sucesso (e recarrega). */
  save: (body: Record<string, unknown>, editingId?: string | null) => Promise<boolean>
  /** Remove por id (DELETE ?id=). A confirmação fica na página. Devolve `true` em sucesso. */
  remove: (id: string) => Promise<boolean>
}

export interface ListResourceOptions {
  /** Endpoint do recurso, ex.: '/api/condicoes'. */
  endpoint: string
  /** Chave do array na resposta GET, ex.: 'conditions' → `{ conditions: [...] }`. */
  listKey: string
  /** Método HTTP da EDIÇÃO: 'PATCH' (condicoes/recursos/habitos/ciclo) ou 'POST'
   *  (id no corpo — sinais-vitais/medidas/medicamentos). Default: 'POST'. */
  editMethod?: 'PATCH' | 'POST'
}

const JSON_HEADERS = { 'Content-Type': 'application/json' }

export function useListResource<T>({ endpoint, listKey, editMethod = 'POST' }: ListResourceOptions): ListResource<T> {
  const { user, loading: authLoading } = useUser()
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const res = await fetch(endpoint)
    const data = res.ok ? await res.json().catch(() => ({})) : {}
    setItems(((data as Record<string, unknown>)[listKey] ?? []) as T[])
    setLoading(false)
  }, [user, endpoint, listKey])

  // Carrega na montagem (após a auth resolver). setLoading(true) síncrono = spinner intencional.
  useEffect(() => {
    // spinner síncrono ao (re)carregar é intencional (mesmo padrão das páginas originais).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!authLoading) reload()
  }, [authLoading, reload])

  const save = useCallback(async (body: Record<string, unknown>, editingId?: string | null): Promise<boolean> => {
    setSaving(true)
    const method = editingId ? editMethod : 'POST'
    const payload = editingId ? { id: editingId, ...body } : body
    const res = await fetch(endpoint, { method, headers: JSON_HEADERS, body: JSON.stringify(payload) })
    if (!res.ok) {
      const e = await res.json().catch(() => ({}))
      setError(((e as { error?: string }).error) ?? 'Falha ao salvar.')
      setSaving(false)
      return false
    }
    setError(null)
    await reload()
    setSaving(false)
    return true
  }, [endpoint, editMethod, reload])

  const remove = useCallback(async (id: string): Promise<boolean> => {
    setBusyId(id)
    const res = await fetch(`${endpoint}?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (!res.ok) {
      const e = await res.json().catch(() => ({}))
      setError(((e as { error?: string }).error) ?? 'Falha ao remover.')
      setBusyId(null)
      return false
    }
    await reload()
    setBusyId(null)
    return true
  }, [endpoint, reload])

  return { items, loading, saving, busyId, error, setError, reload, save, remove }
}
