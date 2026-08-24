// Hook do Perfil (Incremento 4) — encapsula o `profileMachine` (reducer puro) e dispara os efeitos de rede
// pelo `apiClient` (FRONTEIRA Inc.1: nenhum acesso direto ao SDK Supabase em apps/mobile). Gravação
// PESSIMISTA (MOBILE-016 §6.1): a UI só reflete "salvo" após confirmação do backend. Sem atualização otimista,
// sem fila offline. Validação/normalização via @sintera/validation (contrato compartilhado com a Web).
import { useReducer, useEffect, useState, useCallback, useRef } from 'react'
import { validateName, validatePhone, validateAgeRange, validateGoals, parseGoals, goalsToInput } from '@sintera/validation'
import { DEFAULT_DIAL_ISO, splitPhone, joinPhone } from '@sintera/core'
import type { ProfileStats } from '@sintera/api-client'
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
  age_range?: string
  goals?: string
}

export interface UseProfile {
  phase: ProfilePhase
  state: ProfileState
  /** Erro corrente de carga/gravação (mensagem acionável) ou null. */
  error: string | null
  name: string
  /** Número NACIONAL, sem o código de país (que vive em `phoneIso`). */
  phone: string
  /** País do telefone (ISO 3166-1 alfa-2). O DDI nunca é adivinhado — vem daqui. */
  phoneIso: string
  ageRange: string
  goalsText: string
  setName: (v: string) => void
  setPhone: (v: string) => void
  setPhoneIso: (v: string) => void
  setAgeRange: (v: string) => void
  setGoals: (v: string) => void
  fieldErrors: ProfileFieldErrors
  /** Estatísticas (exames·biomarcadores·membro desde) — exibição; null enquanto carrega ou se falhar. */
  stats: ProfileStats | null
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
  // Telefone dividido: país (ISO) + número nacional. O gravado é E.164 (`+DDI…`),
  // montado no Salvar por `joinPhone`. Nunca se adivinha o DDI.
  const [phone, setPhoneRaw] = useState('')
  const [phoneIso, setPhoneIsoRaw] = useState<string>(DEFAULT_DIAL_ISO)
  const [ageRange, setAgeRangeRaw] = useState('')
  const [goalsText, setGoalsRaw] = useState('')
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({})
  const [stats, setStats] = useState<ProfileStats | null>(null)
  // Patch validado/normalizado capturado no Salvar (o efeito de 'saving' o consome — evita closure obsoleto).
  const patchRef = useRef<{ name: string | null; phone: string | null; age_range: string | null; goals: string[] | null }>({ name: null, phone: null, age_range: null, goals: null })

  // Dispara a carga inicial uma única vez.
  useEffect(() => {
    dispatch({ type: 'LOAD' })
  }, [])

  // Estatísticas — carga independente (exibição). Falha NÃO quebra o Perfil (fica sem os números).
  useEffect(() => {
    const controller = new AbortController()
    let alive = true
    apiClient.profile
      .getProfileStats(controller.signal)
      .then((s) => { if (alive) setStats(s) })
      .catch(() => { /* estatísticas são exibição; silencioso */ })
    return () => { alive = false; controller.abort() }
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
        // Separa o gravado em país + número nacional. Valor legado (só dígitos,
        // sem "+") é lido como Brasil — que é o que ele sempre significou.
        const split = splitPhone(data?.phone)
        setPhoneIsoRaw(split.iso)
        setPhoneRaw(split.national)
        setAgeRangeRaw(data?.age_range ?? '')
        setGoalsRaw(goalsToInput(data?.goals))
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
  const setPhoneIso = useCallback((v: string) => {
    setPhoneIsoRaw(v)
    dispatch({ type: 'EDIT' })
  }, [])
  const setAgeRange = useCallback((v: string) => {
    setAgeRangeRaw(v)
    dispatch({ type: 'EDIT' })
  }, [])
  const setGoals = useCallback((v: string) => {
    setGoalsRaw(v)
    dispatch({ type: 'EDIT' })
  }, [])

  const save = useCallback(() => {
    const nres = validateName(name)
    const pres = validatePhone(phone)
    const ares = validateAgeRange(ageRange)
    const gres = validateGoals(parseGoals(goalsText))
    const errs: ProfileFieldErrors = {}
    if (!nres.ok) errs.name = nres.error
    if (!pres.ok) errs.phone = pres.error
    if (!ares.ok) errs.age_range = ares.error
    if (!gres.ok) errs.goals = gres.error
    setFieldErrors(errs)
    if (!nres.ok || !pres.ok || !ares.ok || !gres.ok) return
    // Grava em E.164 com o DDI do país escolhido: `+5511999999999`.
    // `joinPhone` devolve null quando o número nacional está vazio (campo opcional).
    patchRef.current = { name: nres.value, phone: joinPhone(phoneIso, pres.value), age_range: ares.value, goals: gres.value }
    dispatch({ type: 'SAVE' })
  }, [name, phone, phoneIso, ageRange, goalsText])

  const retry = useCallback(() => dispatch({ type: 'RETRY' }), [])

  return {
    phase: state.phase,
    state,
    error: state.error,
    name,
    phone,
    phoneIso,
    ageRange,
    goalsText,
    setName,
    setPhone,
    setPhoneIso,
    setAgeRange,
    setGoals,
    fieldErrors,
    stats,
    save,
    retry,
  }
}
