// FUNC — O SERVIÇO DE TRANSCRIÇÃO: o que ele faz ANTES e DEPOIS de chamar o modelo.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// POR QUE ESTE ARQUIVO EXISTE.
//
// A regra de o que CONTA como transcrição vive no núcleo e é pura — já coberta em
// `FUNC-transcricao-documento`. O que NÃO estava coberto é justamente a parte que gasta dinheiro e produz
// o rastro de auditoria:
//
//   · a deduplicação por SHA-256 (não pagar duas vezes pelos mesmos bytes)
//   · o teto diário por conta (não pagar duzentas leituras no primeiro dia de uma usuária)
//   · a linha de `ai_processing_log` aberta ANTES da chamada e fechada depois
//   · a recusa quando o prompt não passa na verificação de integridade
//
// Nenhuma dessas decisões é pura, e todas elas erram em silêncio: um teto que não segura, uma deduplicação
// que não reconhece, um log que não abre — nada disso aparece na tela. Aparece na fatura, ou na hora em que
// alguém precisa auditar e não encontra o registro.
//
// Sem rede, sem provedor real, sem banco. Só o serviço e mocks.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TETO_TRANSCRICOES_POR_DIA } from '@sintera/core'

const h = vi.hoisted(() => ({
  /** Quantas vezes o provedor foi efetivamente chamado. É a medida de custo do teste. */
  chamadasAoProvedor: 0,
  /** O que o provedor devolve, ou o erro que ele lança. */
  resposta: null as null | { rawResponse: string; stopReason: string | null },
  erroDoProvedor: null as null | Error,
  /** Prompt carregado do registro; `null` simula "nenhum prompt ativo". */
  prompt: { version: '1.0.0', systemPrompt: 'S', userTemplate: 'U', temperature: 0, maxTokens: 100, contentHash: 'h' } as null | Record<string, unknown>,
  integro: true,
}))

vi.mock('@/lib/ai/providers/anthropic', () => ({
  AnthropicProvider: class {
    readonly name = 'anthropic'
    readonly model = 'modelo-de-teste'
    async transcribe() {
      h.chamadasAoProvedor++
      if (h.erroDoProvedor) throw h.erroDoProvedor
      return {
        rawResponse: h.resposta?.rawResponse ?? '{"texto":"HEMOGRAMA\\nHemoglobina: 13,4 g/dL","status":"ok"}',
        promptTokens: 10, completionTokens: 20, model: 'modelo-de-teste', durationMs: 5,
        stopReason: h.resposta?.stopReason ?? 'end_turn',
      }
    }
  },
}))

vi.mock('@/lib/ai/prompt-loader', () => ({
  loadActivePrompt: async () => h.prompt,
  verifyPromptIntegrity: () => h.integro,
}))

import { transcribeDocument } from '@/lib/ai/transcription'

// ── Supabase mockado ─────────────────────────────────────────────────────────────────────────────────────
// Encadeamento livre: todo método devolve o próprio objeto, e a RESOLUÇÃO depende da tabela e de a consulta
// ter pedido contagem. É o mínimo para exercitar os três caminhos do serviço.
interface Cenario {
  /** Linha de exame com o MESMO hash já lida (deduplicação). */
  exameComMesmoHash?: Record<string, unknown> | null
  documentoComMesmoHash?: Record<string, unknown> | null
  /** Quantas leituras a conta já fez nas últimas 24h. */
  leiturasHoje?: number
}

function supabaseFake(c: Cenario = {}) {
  const gravado: { insert: Record<string, unknown>[]; update: Record<string, unknown>[] } = { insert: [], update: [] }

  const client = {
    from(tabela: string) {
      let contagem = false
      const q: Record<string, unknown> = {}
      const mesmo = () => q
      for (const m of ['eq', 'gte', 'in', 'limit', 'order', 'not']) q[m] = mesmo
      q.select = (_c?: unknown, opts?: { count?: string }) => { if (opts?.count) contagem = true; return q }
      q.insert = (linha: Record<string, unknown>) => { gravado.insert.push({ tabela, ...linha }); return q }
      q.update = (linha: Record<string, unknown>) => { gravado.update.push({ tabela, ...linha }); return q }
      q.single = async () => ({ data: { id: 'log-1' }, error: null })
      q.maybeSingle = async () => ({
        data: tabela === 'exams' ? (c.exameComMesmoHash ?? null) : (c.documentoComMesmoHash ?? null),
        error: null,
      })
      // Resolução da cadeia sem terminal explícito (a contagem do teto).
      q.then = (res: (v: unknown) => unknown) =>
        Promise.resolve(contagem ? { count: c.leiturasHoje ?? 0, error: null } : { data: null, error: null }).then(res)
      return q
    },
  }
  return { client: client as never, gravado }
}

const ALVO = { kind: 'exam' as const, examId: 'ex-1' }
const BUFFER = Buffer.from('bytes-do-laudo')

beforeEach(() => {
  h.chamadasAoProvedor = 0
  h.resposta = null
  h.erroDoProvedor = null
  h.prompt = { version: '1.0.0', systemPrompt: 'S', userTemplate: 'U', temperature: 0, maxTokens: 100, contentHash: 'h' }
  h.integro = true
})

describe('o caminho normal', () => {
  it('lê o documento, devolve o texto e o HASH do arquivo', async () => {
    const { client } = supabaseFake()
    const r = await transcribeDocument(client, { alvo: ALVO, userId: 'u1', buffer: BUFFER, mediaType: 'image/jpeg' })
    expect(r.status).toBe('ok')
    expect(r.texto).toContain('Hemoglobina')
    // O hash volta para ser GRAVADO no registro — é ele que faz a deduplicação valer da próxima vez.
    expect(r.sha256).toMatch(/^[0-9a-f]{64}$/)
    expect(h.chamadasAoProvedor).toBe(1)
  })

  it('ABRE a linha de auditoria antes de chamar, e a FECHA depois', async () => {
    // Um evento que não deixa rastro é indistinguível de um evento que não aconteceu.
    const { client, gravado } = supabaseFake()
    const r = await transcribeDocument(client, { alvo: ALVO, userId: 'u1', buffer: BUFFER, mediaType: 'image/jpeg' })
    const abertura = gravado.insert.find(x => x.tabela === 'ai_processing_log')
    expect(abertura, 'nenhuma linha de auditoria foi aberta').toBeTruthy()
    expect(abertura!.operation).toBe('transcription')
    expect(abertura!.status).toBe('processing')
    expect(abertura!.exam_id).toBe('ex-1')
    expect(abertura!.prompt_version).toBe('1.0.0')

    const fecho = gravado.update.find(x => x.tabela === 'ai_processing_log')
    expect(fecho, 'a linha de auditoria ficou aberta').toBeTruthy()
    expect(fecho!.status).toBe('success')
    expect(fecho!.completed_at).toBeTruthy()
    expect(r.logId).toBe('log-1')
  })

  it('documento de paciente aponta para `document_id`, não para `exam_id`', async () => {
    const { client, gravado } = supabaseFake()
    await transcribeDocument(client, {
      alvo: { kind: 'document', documentId: 'doc-9' }, userId: 'u1', buffer: BUFFER, mediaType: 'application/pdf',
    })
    const abertura = gravado.insert.find(x => x.tabela === 'ai_processing_log')!
    expect(abertura.document_id).toBe('doc-9')
    expect(abertura.exam_id).toBeUndefined()
  })
})

describe('DEDUPLICAÇÃO — os mesmos bytes não se pagam duas vezes', () => {
  it('arquivo idêntico já lido: REAPROVEITA o texto e NÃO chama o modelo', async () => {
    const { client } = supabaseFake({
      exameComMesmoHash: {
        id: 'ex-antigo', exam_text: 'texto já lido antes',
        text_transcription_status: 'ok', text_transcription_prompt_version: '1.0.0',
      },
    })
    const r = await transcribeDocument(client, { alvo: ALVO, userId: 'u1', buffer: BUFFER, mediaType: 'image/jpeg' })
    expect(h.chamadasAoProvedor, 'pagou uma leitura que já tinha').toBe(0)
    expect(r.texto).toBe('texto já lido antes')
    expect(r.status).toBe('ok')
    expect(r.reaproveitadoDe).toBe('ex-antigo')
    // Sem chamada, não há linha de auditoria nova — e é correto: nada aconteceu no provedor.
    expect(r.logId).toBeNull()
  })

  it('reaproveita também de um DOCUMENTO de paciente, não só de exame', async () => {
    const { client } = supabaseFake({
      documentoComMesmoHash: {
        id: 'doc-antigo', transcricao: 'receita já lida',
        transcricao_status: 'parcial', transcricao_prompt_version: '1.0.0',
      },
    })
    const r = await transcribeDocument(client, { alvo: ALVO, userId: 'u1', buffer: BUFFER, mediaType: 'image/jpeg' })
    expect(h.chamadasAoProvedor).toBe(0)
    expect(r.status).toBe('parcial')
    expect(r.reaproveitadoDe).toBe('doc-antigo')
  })

  it('arquivo DIFERENTE não é confundido com o já lido', async () => {
    // Sem esta separação, a deduplicação devolveria o laudo de outra pessoa — ou de outro exame.
    const { client } = supabaseFake()
    const a = await transcribeDocument(client, { alvo: ALVO, userId: 'u1', buffer: Buffer.from('A'), mediaType: 'image/jpeg' })
    const b = await transcribeDocument(client, { alvo: ALVO, userId: 'u1', buffer: Buffer.from('B'), mediaType: 'image/jpeg' })
    expect(a.sha256).not.toBe(b.sha256)
    expect(h.chamadasAoProvedor).toBe(2)
  })
})

describe('TETO DIÁRIO — o custo tem limite por conta', () => {
  it('no teto: NÃO chama o modelo, e o motivo é declarado', async () => {
    const { client } = supabaseFake({ leiturasHoje: TETO_TRANSCRICOES_POR_DIA })
    const r = await transcribeDocument(client, { alvo: ALVO, userId: 'u1', buffer: BUFFER, mediaType: 'image/jpeg' })
    expect(h.chamadasAoProvedor, 'o teto não segurou').toBe(0)
    expect(r.status).toBe('falhou')
    // O motivo é o que permite à tela dizer "continua amanhã" em vez de "tente novamente".
    expect(r.motivo).toBe('teto_diario')
  })

  it('UMA leitura abaixo do teto ainda passa', async () => {
    const { client } = supabaseFake({ leiturasHoje: TETO_TRANSCRICOES_POR_DIA - 1 })
    const r = await transcribeDocument(client, { alvo: ALVO, userId: 'u1', buffer: BUFFER, mediaType: 'image/jpeg' })
    expect(h.chamadasAoProvedor).toBe(1)
    expect(r.status).toBe('ok')
  })

  it('o teto é conferido ANTES do prompt — não se carrega o que não se vai usar', async () => {
    h.prompt = null   // se o teto não segurasse primeiro, o erro seria "sem prompt ativo"
    const { client } = supabaseFake({ leiturasHoje: TETO_TRANSCRICOES_POR_DIA })
    const r = await transcribeDocument(client, { alvo: ALVO, userId: 'u1', buffer: BUFFER, mediaType: 'image/jpeg' })
    expect(r.motivo).toBe('teto_diario')
  })
})

describe('as recusas, e todas SEM chamar o modelo', () => {
  it('nenhum prompt ativo no registro', async () => {
    h.prompt = null
    const { client } = supabaseFake()
    const r = await transcribeDocument(client, { alvo: ALVO, userId: 'u1', buffer: BUFFER, mediaType: 'image/jpeg' })
    expect(r.status).toBe('falhou')
    expect(h.chamadasAoProvedor).toBe(0)
  })

  it('HASH DO PROMPT DIVERGENTE: recusa rodar', async () => {
    // Rodar um prompt alterado fora do registro seria abrir mão da verificação que torna a leitura auditável.
    h.integro = false
    const { client } = supabaseFake()
    const r = await transcribeDocument(client, { alvo: ALVO, userId: 'u1', buffer: BUFFER, mediaType: 'image/jpeg' })
    expect(r.status).toBe('falhou')
    expect(h.chamadasAoProvedor, 'rodou um prompt que falhou na integridade').toBe(0)
  })
})

describe('quando o provedor falha, o serviço NÃO derruba nada', () => {
  it('erro de rede vira estado "falhou" e a auditoria é FECHADA como erro', async () => {
    h.erroDoProvedor = new Error('ECONNRESET')
    const { client, gravado } = supabaseFake()
    const r = await transcribeDocument(client, { alvo: ALVO, userId: 'u1', buffer: BUFFER, mediaType: 'image/jpeg' })
    expect(r.status).toBe('falhou')
    expect(r.texto).toBeNull()
    expect(r.motivoDaFalha).toContain('ECONNRESET')
    const fecho = gravado.update.find(x => x.tabela === 'ai_processing_log')
    expect(fecho!.status, 'a linha ficou marcada como sucesso após uma falha').toBe('error')
  })

  it('resposta fora do formato NÃO vira leitura', async () => {
    // Errar para "não li" é recuperável; errar para "li" grava um vazio com aparência de leitura completa.
    h.resposta = { rawResponse: 'isto não é json', stopReason: 'end_turn' }
    const { client } = supabaseFake()
    const r = await transcribeDocument(client, { alvo: ALVO, userId: 'u1', buffer: BUFFER, mediaType: 'image/jpeg' })
    expect(r.status).toBe('falhou')
    expect(r.texto).toBeNull()
  })

  it('corte por limite de tokens é DETECTADO, não silencioso', async () => {
    h.resposta = { rawResponse: '{"texto":"laudo longo","status":"ok"}', stopReason: 'max_tokens' }
    const { client } = supabaseFake()
    const r = await transcribeDocument(client, { alvo: ALVO, userId: 'u1', buffer: BUFFER, mediaType: 'image/jpeg' })
    expect(r.truncado, 'documento cortado passou por completo').toBe(true)
  })

  it('NUNCA lança — o documento já está guardado, e a falha não pode derrubar o processamento', async () => {
    h.erroDoProvedor = new Error('qualquer coisa')
    const { client } = supabaseFake()
    await expect(
      transcribeDocument(client, { alvo: ALVO, userId: 'u1', buffer: BUFFER, mediaType: 'image/jpeg' }),
    ).resolves.toBeTruthy()
  })
})
