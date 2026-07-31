// Hook do Perfil (Incremento 4) — encapsula o `profileMachine` (reducer puro) e dispara os efeitos de rede
// pelo `apiClient` (FRONTEIRA Inc.1: nenhum acesso direto ao SDK Supabase em apps/mobile). Gravação
// PESSIMISTA (MOBILE-016 §6.1): a UI só reflete "salvo" após confirmação do backend. Sem atualização otimista,
// sem fila offline. Validação/normalização via @sintera/validation (contrato compartilhado com a Web).
import { useReducer, useEffect, useState, useCallback, useRef } from 'react'
import { validateName, validatePhone } from '@sintera/validation'
import { apiClient } from '../../../infrastructure/apiClient'
import {
  profileReducer,
  initialProfileState,
  type ProfilePhase,
  type ProfileState,
} from './profileMachine'

const LOAD_ERROR = 'Não foi possível carregar seu perfil. Tente novamente.'
const SAVE_ERROR = 'Não foi possível salvar. Tente novamente.'

function messageFor(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback
}

export interface ProfileFieldErrors {
  name?: string
  phone?: string
}

export interface UseProfile {
  phase: ProfilePhase
  state: ProfileState
  /** Erro corrente de carga/gravação (mensagem acionável) ou null. */
  error: string | null
  name: string
  phone: string
  setName: (v: string) => void
  setPhone: (v: string) => void
  fieldErrors: ProfileFieldErrors
  save: () => void
  retry: () => void
}

/**
 * Carrega o perfil na montagem, mantém o form (name/phone) e persiste via upsert.
 * Estados (do `profileMachine`): idle→loading→ready|loadError; ready→saving→saved|saveError.
 * "Perfil vazio" (sem linha) = ready com data=null → o form abre vazio; o primeiro Salvar faz upsert.
 */
export function useProfile(): UseProfile {
  const [state, dispatch] = useReducer(profileReducer, initialProfileState)
  const [name, setNameRaw] = useState('')
  const [phone, setPhoneRaw] = useState('')
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({})
  // Patch validado/normalizado capturado no Salvar (o efeito de 'saving' o consome — evita closure obsoleto).
  const patchRef = useRef<{ name: string | null; phone: string | null }>({ name: null, phone: null })

  // Dispara a carga inicial uma única vez.
  useEffect(() => {
    dispatch({ type: 'LOAD' })
  }, [])

  // Efeito de CARGA (fase 'loading'). Aborta em desmontagem/retry.
  useEffect(() => {
    if (state.phase !== 'loading') return
    const controller = new AbortController()
    let alive = true
    apiClient.profile
      .getProfile(controller.signal)
      .then((data) => {
        if (!alive) return
        setNameRaw(data?.name ?? '')
        setPhoneRaw(data?.phone ?? '')
        setFieldErrors({})
        dispatch({ type: 'LOAD_SUCCESS', data })
      })
      .catch((e) => {
        if (!alive || controller.signal.aborted) return
        dispatch({ type: 'LOAD_FAILURE', error: messageFor(e, LOAD_ERROR) })
      })
    return () => {
      alive = false
      controller.abort()
    }
  }, [state.phase])

  // Efeito de GRAVAÇÃO (fase 'saving'). Pessimista: SAVE_SUCCESS só após o backend confirmar.
  useEffect(() => {
    if (state.phase !== 'saving') return
    const controller = new AbortController()
    let alive = true
    apiClient.profile
      .updateProfile(patchRef.current, controller.signal)
      .then(({ error }) => {
        if (!alive) return
        if (error) dispatch({ type: 'SAVE_FAILURE', error: error.message || SAVE_ERROR })
        else dispatch({ type: 'SAVE_SUCCESS' })
      })
      .catch((e) => {
        if (!alive) return
        dispatch({ type: 'SAVE_FAILURE', error: messageFor(e, SAVE_ERROR) })
      })
    return () => {
      alive = false
      controller.abort()
    }
  }, [state.phase])

  // Editar um campo após salvar/erro volta a máquina para 'ready' (permite novo Salvar e limpa o selo "salvo").
  // Em 'ready'/'loading'/'saving' o reducer ignora EDIT (retorna o mesmo estado → sem re-render).
  const setName = useCallback((v: string) => {
    setNameRaw(v)
    dispatch({ type: 'EDIT' })
  }, [])
  const setPhone = useCallback((v: string) => {
    setPhoneRaw(v)
    dispatch({ type: 'EDIT' })
  }, [])

  const save = useCallback(() => {
    const nres = validateName(name)
    const pres = validatePhone(phone)
    const errs: ProfileFieldErrors = {}
    if (!nres.ok) errs.name = nres.error
    if (!pres.ok) errs.phone = pres.error
    setFieldErrors(errs)
    if (!nres.ok || !pres.ok) return
    patchRef.current = { name: nres.value, phone: pres.value }
    dispatch({ type: 'SAVE' })
  }, [name, phone])

  const retry = useCallback(() => dispatch({ type: 'RETRY' }), [])

  return {
    phase: state.phase,
    state,
    error: state.error,
    name,
    phone,
    setName,
    setPhone,
    fieldErrors,
    save,
    retry,
  }
}
