// Domínio Atividade Física (activity_sessions) do @sintera/api-client — HIP-014 §3.
//
// O que estes testes protegem: a linha que VAI AO BANCO. Typecheck não pega conversão errada de unidade nem
// campo vazio virando zero — e as duas seriam afirmações falsas sobre a saúde de alguém.
import { describe, it, expect } from 'vitest'
import { listActivitySessions, saveActivitySession, deleteActivitySession, ingestActivitySessions } from '../../packages/api-client/src/activity/activity'
import { mockSupabase, mockQueryBuilder, fakeSession } from './supabaseMock'

function comTabela(result: { data?: unknown; error: unknown }) {
  const builder = mockQueryBuilder(result)
  const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chamadas = () => (builder as any).__calls as Record<string, unknown[]>
  return { client, chamadas }
}

const base = { source: 'manual', activity_type: 'corrida', started_at: '2026-08-25T07:00:00.000Z' }

describe('api-client · activity.listActivitySessions', () => {
  it('devolve as sessões, da mais recente para a mais antiga', async () => {
    const { client, chamadas } = comTabela({ data: [{ id: 'a' }, { id: 'b' }], error: null })
    const r = await listActivitySessions(client)
    expect(r.map(s => s.id)).toEqual(['a', 'b'])
    expect(chamadas().order).toEqual(['started_at', { ascending: false }])
  })

  it('sem sessão → LANÇA', async () => {
    await expect(listActivitySessions(mockSupabase({ session: null }))).rejects.toThrow(/autenticado/i)
  })

  it('erro do banco → LANÇA', async () => {
    const { client } = comTabela({ data: null, error: new Error('db') })
    await expect(listActivitySessions(client)).rejects.toThrow()
  })
})

describe('api-client · activity.saveActivitySession — a linha que vai ao banco', () => {
  it('grava a proveniência e o tipo', async () => {
    const { client, chamadas } = comTabela({ data: null, error: null })
    const { error } = await saveActivitySession(client, base)
    expect(error).toBeNull()
    const row = chamadas().insert[0] as Record<string, unknown>
    expect(row.user_id).toBe('u1')
    expect(row.source).toBe('manual')
    expect(row.activity_type).toBe('corrida')
  })

  it('O CASO CENTRAL: o que não foi informado vai como null, NUNCA como zero', async () => {
    const { client, chamadas } = comTabela({ data: null, error: null })
    await saveActivitySession(client, base)
    const row = chamadas().insert[0] as Record<string, unknown>
    for (const c of ['distance_m', 'active_energy_kcal', 'avg_heart_rate', 'max_heart_rate', 'steps', 'ended_at', 'notes', 'title']) {
      expect(row[c], `${c} deveria ser null, não zero nem string vazia`).toBeNull()
    }
  })

  it('deriva a duração da janela quando ela é coerente', async () => {
    const { client, chamadas } = comTabela({ data: null, error: null })
    await saveActivitySession(client, { ...base, ended_at: '2026-08-25T07:32:00.000Z' })
    expect((chamadas().insert[0] as Record<string, unknown>).duration_s).toBe(1920)
  })

  it('janela incoerente NÃO vira duração inventada', async () => {
    const { client, chamadas } = comTabela({ data: null, error: null })
    await saveActivitySession(client, { ...base, ended_at: '2026-08-25T06:00:00.000Z' }) // fim antes do início
    expect((chamadas().insert[0] as Record<string, unknown>).duration_s).toBeNull()
  })

  it('duração explícita vence a derivada', async () => {
    const { client, chamadas } = comTabela({ data: null, error: null })
    await saveActivitySession(client, { ...base, ended_at: '2026-08-25T08:00:00.000Z', duration_s: 600 })
    expect((chamadas().insert[0] as Record<string, unknown>).duration_s).toBe(600)
  })

  it('tipo ausente degrada para "outro" — Modelo Aberto, não falha', async () => {
    const { client, chamadas } = comTabela({ data: null, error: null })
    await saveActivitySession(client, { ...base, activity_type: '' })
    expect((chamadas().insert[0] as Record<string, unknown>).activity_type).toBe('outro')
  })

  it('RECUSA sessão sem origem — proveniência é obrigatória', async () => {
    const { client } = comTabela({ data: null, error: null })
    const { error } = await saveActivitySession(client, { ...base, source: '  ' })
    expect(error?.message).toMatch(/origem/i)
  })

  it('RECUSA sessão sem início', async () => {
    const { client } = comTabela({ data: null, error: null })
    const { error } = await saveActivitySession(client, { ...base, started_at: '' })
    expect(error?.message).toMatch(/começou/i)
  })

  it('com id, ATUALIZA a própria linha e não insere', async () => {
    const { client, chamadas } = comTabela({ data: null, error: null })
    await saveActivitySession(client, { ...base, id: 's1' })
    expect(chamadas().update).toBeDefined()
    expect(chamadas().insert).toBeUndefined()
    expect(chamadas().eq).toEqual(['user_id', 'u1']) // último eq: escopo do dono
  })

  it('sem sessão → devolve error, não lança', async () => {
    const { error } = await saveActivitySession(mockSupabase({ session: null }), base)
    expect(error?.message).toMatch(/autenticado/i)
  })
})

describe('api-client · activity.ingestActivitySessions — idempotência do re-sync', () => {
  // O re-sync SEMPRE reprocessa uma janela sobreposta. Sem idempotência, cada sincronização duplicaria as
  // sessões que já estavam lá — e o índice único da migração 149 faria a gravação inteira falhar.
  const strava = (id: string, inicio: string) => ({
    source: 'strava', external_id: id, activity_type: 'corrida', started_at: inicio,
  })

  it('lote novo: grava tudo', async () => {
    const { client, chamadas } = comTabela({ data: [], error: null })
    const { result, error } = await ingestActivitySessions(client, [
      strava('a', '2026-08-25T06:00:00.000Z'),
      strava('b', '2026-08-26T06:00:00.000Z'),
    ])
    expect(error).toBeNull()
    expect(result).toEqual({ recebidas: 2, gravadas: 2, jaExistiam: 0, atualizadas: 0 })
    expect((chamadas().insert[0] as unknown[]).length).toBe(2)
  })

  it('O CASO CENTRAL: rodar de novo com o mesmo lote não grava nada', async () => {
    const { client, chamadas } = comTabela({
      data: [{ id: 'x1', source: 'strava', external_id: 'a', started_at: '2026-08-25T06:00:00.000Z', activity_type: 'corrida' }],
      error: null,
    })
    const { result } = await ingestActivitySessions(client, [strava('a', '2026-08-25T06:00:00.000Z')])
    expect(result).toEqual({ recebidas: 1, gravadas: 0, jaExistiam: 1, atualizadas: 0 })
    expect(chamadas().insert, 'nada deveria ser inserido').toBeUndefined()
  })

  it('grava só as novas quando a janela se sobrepõe', async () => {
    const { client } = comTabela({
      data: [{ id: 'x1', source: 'strava', external_id: 'a', started_at: '2026-08-25T06:00:00.000Z', activity_type: 'corrida' }],
      error: null,
    })
    const { result } = await ingestActivitySessions(client, [
      strava('a', '2026-08-25T06:00:00.000Z'),   // já existe
      strava('b', '2026-08-26T06:00:00.000Z'),   // nova
    ])
    expect(result).toEqual({ recebidas: 2, gravadas: 1, jaExistiam: 1, atualizadas: 0 })
  })

  it('sem id externo, a identidade é o INSTANTE de início dentro da fonte', async () => {
    const { client } = comTabela({
      data: [{ source: 'manual', external_id: null, started_at: '2026-08-25T06:00:00.000Z' }],
      error: null,
    })
    const { result } = await ingestActivitySessions(client, [
      { source: 'manual', activity_type: 'corrida', started_at: '2026-08-25T06:00:00.000Z' },
    ])
    expect(result.jaExistiam).toBe(1)
  })

  it('duas fontes com o MESMO id externo não colidem — a origem faz parte da identidade', async () => {
    const { client } = comTabela({
      data: [{ source: 'strava', external_id: 'x', started_at: '2026-08-25T06:00:00.000Z' }],
      error: null,
    })
    const { result } = await ingestActivitySessions(client, [
      { source: 'garmin', external_id: 'x', activity_type: 'corrida', started_at: '2026-08-25T06:00:00.000Z' },
    ])
    expect(result.gravadas, 'garmin/x é outra sessão que não strava/x').toBe(1)
  })

  it('deduplica DENTRO do lote — a mesma janela pode trazer a sessão repetida', async () => {
    const { client } = comTabela({ data: [], error: null })
    const { result } = await ingestActivitySessions(client, [
      strava('a', '2026-08-25T06:00:00.000Z'),
      strava('a', '2026-08-25T06:00:00.000Z'),
    ])
    expect(result).toEqual({ recebidas: 2, gravadas: 1, jaExistiam: 1, atualizadas: 0 })
  })

  it('lote vazio não toca o banco', async () => {
    const { client, chamadas } = comTabela({ data: [], error: null })
    const { result, error } = await ingestActivitySessions(client, [])
    expect(error).toBeNull()
    expect(result.gravadas).toBe(0)
    expect(chamadas().select).toBeUndefined()
  })
})

describe('api-client · activity.deleteActivitySession', () => {
  it('apaga escopado ao dono', async () => {
    const { client, chamadas } = comTabela({ data: null, error: null })
    const { error } = await deleteActivitySession(client, 's1')
    expect(error).toBeNull()
    expect(chamadas().delete).toBeDefined()
    expect(chamadas().eq).toEqual(['user_id', 'u1'])
  })
})

describe('api-client · activity.ingestActivitySessions — completar o que entrou incompleto', () => {
  // Doze atividades reais entraram como "Outra atividade" e sem distância, por defeito nosso de leitura.
  // Corrigido o defeito, a re-sincronização precisa alcançá-las — senão a pessoa teria de apagar uma a uma.
  it('completa o registro que já existia, sem inserir de novo', async () => {
    const { client, chamadas } = comTabela({
      data: [{
        id: 'x1', source: 'strava', external_id: 'a', started_at: '2026-08-25T06:00:00.000Z',
        activity_type: 'outro', distance_m: null, active_energy_kcal: null,
      }],
      error: null,
    })
    const { result } = await ingestActivitySessions(client, [{
      source: 'strava', external_id: 'a', activity_type: 'corrida',
      started_at: '2026-08-25T06:00:00.000Z', distance_m: 8200, active_energy_kcal: 540,
    }])
    expect(result.atualizadas).toBe(1)
    expect(result.gravadas).toBe(0)
    expect(chamadas().insert, 'corrigir não é inserir').toBeUndefined()
    const campos = chamadas().update[0] as Record<string, unknown>
    expect(campos.activity_type).toBe('corrida')
    expect(campos.distance_m).toBe(8200)
  })

  it('a correção é escopada ao dono — nunca toca o registro de outra pessoa', async () => {
    const { client, chamadas } = comTabela({
      data: [{ id: 'x1', source: 'strava', external_id: 'a', started_at: '2026-08-25T06:00:00.000Z', activity_type: 'outro' }],
      error: null,
    })
    await ingestActivitySessions(client, [{
      source: 'strava', external_id: 'a', activity_type: 'corrida', started_at: '2026-08-25T06:00:00.000Z',
    }])
    expect(chamadas().eq).toEqual(['user_id', 'u1'])
  })
})
