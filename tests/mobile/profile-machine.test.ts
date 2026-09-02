// Máquina de estados do Perfil — reducer PURO (sem RN). Cobre o fluxo feliz, falhas, retry e no-ops.
import { describe, it, expect } from 'vitest'
import {
  profileReducer, initialProfileState, type ProfileState,
} from '../../apps/mobile/src/presentation/screens/profile/profileMachine'
import type { ProfileDTO } from '../../packages/api-client/src/profile/types'

const DTO: ProfileDTO = { id: 'u1', name: 'Ana', phone: null, age_range: null, birth_date: null, goals: null, avatar_url: null, updated_at: null }
const at = (phase: ProfileState['phase'], data: ProfileState['data'] = null, error: string | null = null): ProfileState => ({ phase, data, error })

describe('profileReducer — carga', () => {
  it('idle --LOAD--> loading', () => {
    expect(profileReducer(initialProfileState, { type: 'LOAD' })).toEqual(at('loading'))
  })
  it('loading --LOAD_SUCCESS(dto)--> ready com dados', () => {
    expect(profileReducer(at('loading'), { type: 'LOAD_SUCCESS', data: DTO })).toEqual(at('ready', DTO))
  })
  it('loading --LOAD_SUCCESS(null)--> ready vazio (usuário novo)', () => {
    expect(profileReducer(at('loading'), { type: 'LOAD_SUCCESS', data: null })).toEqual(at('ready', null))
  })
  it('loading --LOAD_FAILURE--> loadError com mensagem', () => {
    expect(profileReducer(at('loading'), { type: 'LOAD_FAILURE', error: 'timeout' })).toEqual(at('loadError', null, 'timeout'))
  })
  it('loadError --RETRY--> loading (Loading→Falha→Retry→Loading)', () => {
    expect(profileReducer(at('loadError', null, 'timeout'), { type: 'RETRY' })).toEqual(at('loading'))
  })
})

describe('profileReducer — gravação', () => {
  it('ready --SAVE--> saving (preserva os dados)', () => {
    expect(profileReducer(at('ready', DTO), { type: 'SAVE' })).toEqual(at('saving', DTO))
  })
  it('saving --SAVE_SUCCESS--> saved', () => {
    expect(profileReducer(at('saving', DTO), { type: 'SAVE_SUCCESS' })).toEqual(at('saved', DTO))
  })
  it('saving --SAVE_FAILURE--> saveError (preserva os dados e o input)', () => {
    expect(profileReducer(at('saving', DTO), { type: 'SAVE_FAILURE', error: 'offline' })).toEqual(at('saveError', DTO, 'offline'))
  })
  it('saveError --RETRY--> saving', () => {
    expect(profileReducer(at('saveError', DTO, 'offline'), { type: 'RETRY' })).toEqual(at('saving', DTO))
  })
  it('saved --EDIT--> ready (usuário edita de novo)', () => {
    expect(profileReducer(at('saved', DTO), { type: 'EDIT' })).toEqual(at('ready', DTO))
  })
  it('saveError --EDIT--> ready', () => {
    expect(profileReducer(at('saveError', DTO, 'x'), { type: 'EDIT' })).toEqual(at('ready', DTO))
  })
})

describe('profileReducer — robustez', () => {
  it('evento inválido para a fase é ignorado (no-op)', () => {
    const s = at('ready', DTO)
    expect(profileReducer(s, { type: 'LOAD_SUCCESS', data: DTO })).toBe(s) // retorna o MESMO estado
    expect(profileReducer(at('idle'), { type: 'SAVE' })).toEqual(at('idle'))
  })
  it('é puro — não muta o estado de entrada', () => {
    const s = at('loading')
    const frozen = Object.freeze({ ...s })
    expect(() => profileReducer(frozen, { type: 'LOAD_SUCCESS', data: DTO })).not.toThrow()
  })
  it('fluxo completo: idle→loading→ready→saving→saved→(edit)→ready', () => {
    let s = initialProfileState
    s = profileReducer(s, { type: 'LOAD' });                 expect(s.phase).toBe('loading')
    s = profileReducer(s, { type: 'LOAD_SUCCESS', data: DTO }); expect(s.phase).toBe('ready')
    s = profileReducer(s, { type: 'SAVE' });                 expect(s.phase).toBe('saving')
    s = profileReducer(s, { type: 'SAVE_SUCCESS' });         expect(s.phase).toBe('saved')
    s = profileReducer(s, { type: 'EDIT' });                 expect(s.phase).toBe('ready')
  })
})
