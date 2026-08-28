// ARCH · A REGRA DE RECONCILIAÇÃO É UMA SÓ — escrita em dois lugares, verificada aqui.
//
// O CASO. A auditoria listava `reconcileSamples` como capacidade órfã: escrita, testada, sem consumidor. A
// leitura óbvia seria "falta ligar". Está errada — a reconciliação JÁ acontece, no Postgres:
//
//     upsert(rows, { onConflict: 'user_id,provider,metric,recorded_at' })
//
// que é exatamente a regra da função: mesma (métrica, instante, fonte) → a nova substitui; fontes diferentes
// para a mesma métrica e instante → ambas coexistem, porque a fonte entra na chave. Multi-provedor sem perder
// procedência (HIP-009).
//
// ENTÃO POR QUE A FUNÇÃO CONTINUA EXISTINDO. Ela é a regra em forma executável e testável: `dedupWithinSource`
// e `reconcileSamples` provam, sem banco, o que a restrição promete — e servem a qualquer caminho de ingestão
// que precise reconciliar ANTES de gravar (o Health Connect lê no aparelho e pode receber o mesmo intervalo
// duas vezes na mesma sessão).
//
// O RISCO REAL não é a duplicação; é a DIVERGÊNCIA. No dia em que alguém acrescentar uma coluna à chave do
// banco — ou tirar `provider` dela — as duas param de concordar e o efeito aparece como dado sumindo: leituras
// de dois aparelhos colapsando numa só, sem erro em lugar nenhum. Esta guarda liga as duas pontas da regra.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { sampleKey, reconcileSamples, dedupWithinSource, type CanonicalSample } from '@sintera/core'

const ROOT = process.cwd()
const PERSIST = join(ROOT, 'packages/api-client/src/connectors/persist.ts')

/** Colunas da chave de conflito, na ordem em que o banco as declara. */
const CHAVE_DO_BANCO = ['user_id', 'provider', 'metric', 'recorded_at'] as const

/**
 * A mesma chave, do lado do domínio. `user_id` não aparece porque a função opera sempre DENTRO de uma pessoa —
 * quem chama já separou por dono. O resto tem de casar coluna a coluna.
 */
const CHAVE_DO_DOMINIO = ['provider', 'metric', 'recorded_at'] as const

const amostra = (metric: string, recordedAt: string, source: string, value: number): CanonicalSample => ({
  metric, recordedAt, value, unit: 'un',
  provenance: { source, connectorVersion: '1', channel: 'health_connect' },
} as CanonicalSample)

describe('ARCH · reconciliação: a regra do banco e a do domínio são a mesma', () => {
  it('a chave de conflito do upsert é exatamente a esperada', () => {
    const corpo = readFileSync(PERSIST, 'utf8')
    const m = corpo.match(/onConflict:\s*'([^']+)'/)
    expect(m, 'não achei a chave de conflito em persist.ts — o upsert mudou de forma?').not.toBeNull()

    const colunas = m![1].split(',').map(c => c.trim())
    expect(
      colunas,
      '\nA chave de conflito do banco mudou.\n\n' +
        'Ela é a MESMA regra que `sampleKey` implementa no domínio. Mudar uma sem a outra faz as duas\n' +
        'discordarem — e o efeito aparece como DADO SUMINDO: leituras de dois aparelhos colapsando numa só,\n' +
        'sem erro em lugar nenhum. Ajuste `sampleKey` junto, e atualize este teste dizendo por quê.\n',
    ).toEqual([...CHAVE_DO_BANCO])
  })

  it('a chave do domínio cobre as mesmas colunas (menos o dono, que quem chama já separou)', () => {
    // Se um dia `provider` sair da chave do banco, este par de asserções é o que impede a divergência passar.
    expect([...CHAVE_DO_BANCO].filter(c => c !== 'user_id')).toEqual([...CHAVE_DO_DOMINIO])
  })

  it('fontes DIFERENTES no mesmo instante coexistem — é o que a procedência protege', () => {
    const relogio = amostra('frequencia_cardiaca', '2026-08-28T10:00:00.000Z', 'garmin', 70)
    const anel = amostra('frequencia_cardiaca', '2026-08-28T10:00:00.000Z', 'oura', 72)
    expect(sampleKey(relogio)).not.toBe(sampleKey(anel))
    expect(reconcileSamples([relogio], [anel])).toHaveLength(2)
  })

  it('a MESMA fonte no mesmo instante substitui — re-sincronizar não duplica', () => {
    const antes = amostra('frequencia_cardiaca', '2026-08-28T10:00:00.000Z', 'garmin', 70)
    const depois = amostra('frequencia_cardiaca', '2026-08-28T10:00:00.000Z', 'garmin', 71)
    const r = reconcileSamples([antes], [depois])
    expect(r).toHaveLength(1)
    expect(r[0].value).toBe(71)
  })

  it('reconciliar duas vezes dá o mesmo resultado — a sincronização é idempotente', () => {
    const a = amostra('glicemia', '2026-08-28T08:00:00.000Z', 'health_connect', 95)
    const b = amostra('glicemia', '2026-08-28T12:00:00.000Z', 'health_connect', 102)
    const uma = reconcileSamples([a], [b])
    const duas = reconcileSamples(uma, [b])
    expect(duas).toEqual(uma)
  })

  it('o mesmo intervalo recebido duas vezes na MESMA sessão não vira duas linhas', () => {
    // É o caso concreto do Health Connect: ele lê no aparelho e pode devolver o intervalo repetido.
    const s = amostra('passos', '2026-08-28T09:00:00.000Z', 'strava', 1200)
    expect(dedupWithinSource([s, s, s])).toHaveLength(1)
  })
})
