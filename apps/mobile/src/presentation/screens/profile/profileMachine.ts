// Máquina de estados do Perfil — LÓGICA PURA (sem React/RN). O hook `useProfile` (quarta) apenas encapsula
// este reducer: dispara efeitos (getProfile/updateProfile) e despacha os eventos abaixo. Testável sem emulador.
//
// Fases:  idle → loading → ready | loadError        (loadError --RETRY--> loading)
//         ready → saving → saved | saveError         (saveError --RETRY--> saving; saved/saveError --EDIT--> ready)
// "Perfil vazio" (usuário novo) = fase `ready` com `data === null` → a tela abre com os defaults do banco.
import type { ProfileDTO } from '@sintera/api-client'

export type ProfilePhase = 'idle' | 'loading' | 'ready' | 'loadError' | 'saving' | 'saved' | 'saveError'

export interface ProfileState {
  phase: ProfilePhase
  /** `null` = perfil vazio (sem linha) → a tela usa os defaults. Presente quando carregado. */
  data: ProfileDTO | null
  /** Mensagem de erro corrente (loadError/saveError); `null` caso contrário. */
  error: string | null
}

export type ProfileEvent =
  | { type: 'LOAD' }
  | { type: 'LOAD_SUCCESS'; data: ProfileDTO | null } // data null = linha inexistente (vazio)
  | { type: 'LOAD_FAILURE'; error: string }           // inclui timeout
  | { type: 'SAVE' }
  | { type: 'SAVE_SUCCESS' }
  | { type: 'SAVE_FAILURE'; error: string }           // inclui timeout
  | { type: 'RETRY' }
  | { type: 'EDIT' }

export const initialProfileState: ProfileState = { phase: 'idle', data: null, error: null }

/** Reducer puro e determinístico. Eventos inválidos para a fase atual são ignorados (retorna o mesmo estado). */
export function profileReducer(state: ProfileState, event: ProfileEvent): ProfileState {
  switch (state.phase) {
    case 'idle':
      if (event.type === 'LOAD') return { phase: 'loading', data: null, error: null }
      return state

    case 'loading':
      if (event.type === 'LOAD_SUCCESS') return { phase: 'ready', data: event.data, error: null }
      if (event.type === 'LOAD_FAILURE') return { phase: 'loadError', data: null, error: event.error }
      return state

    case 'loadError':
      if (event.type === 'RETRY' || event.type === 'LOAD') return { phase: 'loading', data: null, error: null }
      return state

    case 'ready':
      if (event.type === 'SAVE') return { phase: 'saving', data: state.data, error: null }
      return state

    case 'saving':
      if (event.type === 'SAVE_SUCCESS') return { phase: 'saved', data: state.data, error: null }
      if (event.type === 'SAVE_FAILURE') return { phase: 'saveError', data: state.data, error: event.error }
      return state

    case 'saved':
      if (event.type === 'EDIT') return { phase: 'ready', data: state.data, error: null }
      if (event.type === 'SAVE') return { phase: 'saving', data: state.data, error: null }
      return state

    case 'saveError':
      if (event.type === 'RETRY' || event.type === 'SAVE') return { phase: 'saving', data: state.data, error: null }
      if (event.type === 'EDIT') return { phase: 'ready', data: state.data, error: null }
      return state

    default:
      return state
  }
}
