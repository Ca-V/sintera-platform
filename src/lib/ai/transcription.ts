// TRANSCRIÇÃO DE DOCUMENTO — o serviço, com rastro.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// DECISÃO DA FUNDADORA (01/09/2026): "todos os documentos que são adicionados precisam ser lidos e
// transcritos [...] de forma segura, auditável, rastreável, e registrada em modelo de dados."
//
// Este arquivo é a metade "auditável e rastreável" dessa frase. Toda chamada:
//   1. carrega o prompt do REGISTRO GOVERNADO e verifica o hash de integridade antes de usar;
//   2. abre uma linha em `ai_processing_log` com operation='transcription' ANTES de chamar o modelo;
//   3. fecha essa linha com resultado, tokens, duração, motivo de parada e resposta bruta;
//   4. devolve o id da linha, para que o registro transcrito aponte para o evento que o produziu.
//
// De qualquer texto transcrito na plataforma se chega, por um id, à chamada exata que o gerou — com modelo,
// versão de prompt, horário e custo. É isso, e não a existência da coluna, que torna a leitura auditável.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
//
// NUNCA LANÇA. Uma falha de transcrição não pode derrubar o processamento do documento: o arquivo já está
// guardado, e é ele a fonte da verdade. A falha vira estado 'falhou' — DECLARADO, nunca confundido com
// "o documento não tinha nada". Essa distinção é o motivo de este serviço existir com um tipo de retorno
// próprio em vez de devolver `string | null`.
import { createHash } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  avaliarTranscricao, TETO_TRANSCRICOES_POR_DIA,
  type StatusDaTranscricao, type MotivoDaFalha,
} from '@sintera/core'
import { AnthropicProvider } from './providers/anthropic'
import { loadActivePrompt, verifyPromptIntegrity } from './prompt-loader'

/** Alvo da transcrição: um exame OU um documento de paciente. Exatamente um dos dois. */
export type AlvoDaTranscricao =
  | { readonly kind: 'exam'; readonly examId: string }
  | { readonly kind: 'document'; readonly documentId: string }

export interface TranscriptionInput {
  readonly alvo: AlvoDaTranscricao
  readonly userId: string
  /** Bytes do arquivo. PDF ou imagem. */
  readonly buffer: Buffer
  /** 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp' */
  readonly mediaType: string
  /** Qualidade detectada do arquivo — vai para a auditoria, para explicar depois por que deu no que deu. */
  readonly pdfQualityDetected?: string
}

export interface TranscriptionOutcome {
  readonly texto: string | null
  readonly status: StatusDaTranscricao
  readonly trechosIlegiveis: number
  /** Versão do prompt usada. `null` quando nem chegou a rodar. */
  readonly promptVersion: string | null
  /** Linha de `ai_processing_log` — o ponteiro de auditoria. */
  readonly logId: string | null
  /** O modelo parou por limite de tokens? Documento longo pode ter sido cortado. */
  readonly truncado: boolean
  /** Motivo legível quando `status === 'falhou'` — para o log do servidor, não para a tela. */
  readonly motivoDaFalha: string | null
  /**
   * POR QUE falhou, em termos que a TELA entende. 'teto_diario' produz uma frase diferente, porque a
   * situação é diferente: nada está quebrado, e tentar de novo agora não adianta.
   */
  readonly motivo?: MotivoDaFalha
  /** SHA-256 do arquivo lido — a chave da deduplicação, e o preenchimento de uma coluna que nunca foi usada. */
  readonly sha256?: string
  /** Quando o texto veio de outro documento com bytes idênticos, o id dele. Auditoria de reaproveitamento. */
  readonly reaproveitadoDe?: string
}

const FALHOU = (motivo: string, logId: string | null = null, promptVersion: string | null = null): TranscriptionOutcome => ({
  texto: null, status: 'falhou', trechosIlegiveis: 0, promptVersion, logId, truncado: false, motivoDaFalha: motivo,
})

/**
 * Quantas leituras esta conta já consumiu nas últimas 24 horas.
 *
 * Conta em `ai_processing_log`, que é onde toda tentativa fica registrada — inclusive as que falharam. Contar
 * só os sucessos deixaria uma conta em falha permanente chamando o provedor sem limite, que é justamente o
 * cenário caro.
 *
 * Em caso de erro na contagem, devolve 0 — ou seja, DEIXA PASSAR. É a escolha certa: bloquear a leitura de
 * todo mundo porque uma consulta de contagem falhou trocaria um risco de custo por um defeito de produto.
 */
async function contarLeiturasDoDia(supabase: SupabaseClient, userId: string): Promise<number> {
  try {
    const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count, error } = await supabase
      .from('ai_processing_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId).eq('operation', 'transcription').gte('started_at', desde)
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}

/** O que se reaproveita de um arquivo idêntico já lido. */
interface TextoJaLido {
  readonly texto: string | null
  readonly status: StatusDaTranscricao
  readonly promptVersion: string | null
  readonly de: string
}

/**
 * Este arquivo — estes bytes exatos — já foi lido para esta pessoa?
 *
 * Só reaproveita leitura BEM-SUCEDIDA: reaproveitar uma falha seria propagar o problema em vez de tentar
 * de novo. E só dentro da MESMA conta — o hash é global, o dado de saúde não é.
 */
async function textoJaLido(
  supabase: SupabaseClient, userId: string, sha256: string,
): Promise<TextoJaLido | null> {
  try {
    const { data: ex } = await supabase.from('exams')
      .select('id, exam_text, text_transcription_status, text_transcription_prompt_version')
      .eq('user_id', userId).eq('document_sha256', sha256)
      .in('text_transcription_status', ['ok', 'parcial'])
      .limit(1).maybeSingle() as { data: {
        id: string; exam_text: string | null
        text_transcription_status: string | null; text_transcription_prompt_version: string | null
      } | null }
    if (ex?.exam_text) {
      return {
        texto: ex.exam_text,
        status: ex.text_transcription_status as StatusDaTranscricao,
        promptVersion: ex.text_transcription_prompt_version,
        de: ex.id,
      }
    }

    const { data: doc } = await supabase.from('patient_documents')
      .select('id, transcricao, transcricao_status, transcricao_prompt_version')
      .eq('user_id', userId).eq('document_sha256', sha256)
      .in('transcricao_status', ['ok', 'parcial'])
      .limit(1).maybeSingle() as { data: {
        id: string; transcricao: string | null
        transcricao_status: string | null; transcricao_prompt_version: string | null
      } | null }
    if (doc?.transcricao) {
      return {
        texto: doc.transcricao,
        status: doc.transcricao_status as StatusDaTranscricao,
        promptVersion: doc.transcricao_prompt_version,
        de: doc.id,
      }
    }
    return null
  } catch {
    // Falha na busca por duplicata NUNCA impede a leitura — no pior caso, paga-se uma leitura a mais.
    return null
  }
}

/**
 * Extrai o objeto JSON da resposta do modelo.
 *
 * Tolera cerca de código e texto em volta — o prompt pede JSON puro, mas depender disso seria transformar
 * uma variação de formatação em "documento não lido". Não tolera JSON inválido: aí a resposta não é
 * confiável, e `avaliarTranscricao` decide o que fazer com `null`.
 */
function extrairJson(bruto: string): Record<string, unknown> | null {
  const semCerca = bruto.replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/i, '').trim()
  const inicio = semCerca.indexOf('{')
  const fim = semCerca.lastIndexOf('}')
  if (inicio < 0 || fim <= inicio) return null
  try {
    const obj = JSON.parse(semCerca.slice(inicio, fim + 1))
    return obj && typeof obj === 'object' ? (obj as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/**
 * Lê o documento e devolve o texto — com a linha de auditoria que prova o que aconteceu.
 *
 * `supabase` deve ser o cliente da requisição (cookie na Web, Bearer no aplicativo): o carregador de prompts
 * depende da RLS de `prompt_registry`, e um cliente anônimo devolveria NO_ACTIVE_PROMPT — defeito já visto
 * nesta plataforma, e por isso o cliente é parâmetro e não é criado aqui dentro.
 */
export async function transcribeDocument(
  supabase: SupabaseClient,
  input: TranscriptionInput,
): Promise<TranscriptionOutcome> {
  const { alvo, userId, buffer, mediaType, pdfQualityDetected } = input

  // ── 0a. O MESMO ARQUIVO NÃO SE LÊ DUAS VEZES ─────────────────────────────────────────────────────────
  //
  // A pessoa fotografa o mesmo laudo de novo, ou sobe o PDF que já tinha subido. Pagar outra leitura por
  // bytes idênticos é dinheiro jogado fora, e o texto seria o mesmo.
  //
  // O hash é calculado AQUI, do buffer que já está em memória. A coluna `document_sha256` existe no banco
  // desde sempre e nunca foi preenchida por ninguém — mais um caso de campo criado e nunca ligado; agora
  // passa a ser gravado como efeito da leitura.
  const sha256 = createHash('sha256').update(buffer).digest('hex')
  const reaproveitado = await textoJaLido(supabase, userId, sha256)
  if (reaproveitado) {
    return {
      texto: reaproveitado.texto,
      status: reaproveitado.status,
      trechosIlegiveis: 0,
      promptVersion: reaproveitado.promptVersion,
      // SEM linha de auditoria nova, e é correto: nenhuma chamada de modelo aconteceu. A rastreabilidade
      // continua existindo — pelo documento de origem, que tem a sua.
      logId: null,
      truncado: false,
      motivoDaFalha: null,
      sha256,
      reaproveitadoDe: reaproveitado.de,
    }
  }

  // ── 0b. O TETO DIÁRIO DA CONTA ───────────────────────────────────────────────────────────────────────
  //
  // Protege contra o cenário que o próprio produto convida: duzentos documentos antigos no primeiro dia.
  // O documento NÃO é recusado — ele entra, fica guardado, e a leitura é adiada com a razão declarada.
  const lidosHoje = await contarLeiturasDoDia(supabase, userId)
  if (lidosHoje >= TETO_TRANSCRICOES_POR_DIA) {
    console.warn('[transcricao] teto diário atingido', { userId, lidosHoje })
    return { ...FALHOU('teto diário de leituras atingido'), motivo: 'teto_diario' as const, sha256 }
  }

  // 1. O PROMPT VEM DO REGISTRO, E É VERIFICADO. Rodar um prompt fora do registro seria abrir mão da
  //    verificação de integridade — exatamente a garantia que torna esta leitura auditável.
  const prompt = await loadActivePrompt('transcription', supabase)
  if (!prompt) return FALHOU('nenhum prompt de transcrição ativo no registro')
  if (!verifyPromptIntegrity(prompt)) {
    console.error('[transcricao] PROMPT_INTEGRITY_VIOLATION — hash divergente em runtime')
    return FALHOU('falha de integridade do prompt de transcrição')
  }

  const provider = new AnthropicProvider()
  const ehImagem = mediaType.startsWith('image/')
  const extractionPath = ehImagem ? 'image' : 'pdf_native'

  // 2. A LINHA DE AUDITORIA ABRE ANTES DA CHAMADA. Se o processo morrer no meio, fica o registro de que a
  //    tentativa existiu — um evento que não deixa rastro é indistinguível de um evento que não aconteceu.
  const inicio = { operation: 'transcription', user_id: userId, provider: provider.name, model: provider.model,
    prompt_version: prompt.version, status: 'processing', extraction_path: extractionPath,
    pdf_quality_detected: pdfQualityDetected ?? (ehImagem ? 'image' : null),
    input_chars: 0, full_text_chars: 0, truncated: false,
    ...(alvo.kind === 'exam' ? { exam_id: alvo.examId } : { document_id: alvo.documentId }) }

  const { data: logRow } = await supabase.from('ai_processing_log').insert(inicio as never).select('id').single()
  const logId = (logRow as { id: string } | null)?.id ?? null

  const fecharLog = async (campos: Record<string, unknown>) => {
    if (!logId) return
    // A auditoria NUNCA derruba a operação — mas a falha dela é dita no log do servidor, não engolida.
    try {
      await supabase.from('ai_processing_log').update({ completed_at: new Date().toISOString(), ...campos } as never).eq('id', logId)
    } catch (e) {
      console.error('[transcricao] falha ao fechar a linha de auditoria', logId, e)
    }
  }

  // 3. A CHAMADA.
  let resultado
  try {
    resultado = await provider.transcribe({
      examId: alvo.kind === 'exam' ? alvo.examId : '',
      userId,
      systemPrompt: prompt.systemPrompt,
      userTemplate: prompt.userTemplate,
      temperature: prompt.temperature,
      maxTokens: prompt.maxTokens,
      extractionPath,
      ...(ehImagem ? { imageBuffer: buffer, imageMediaType: mediaType } : { pdfBuffer: buffer }),
    })
  } catch (e) {
    const motivo = e instanceof Error ? e.message : 'erro desconhecido no provedor'
    await fecharLog({ status: 'error', parse_error: motivo, parsed_ok: false })
    return FALHOU(motivo, logId, prompt.version)
  }

  // 4. A LEITURA DA RESPOSTA. A regra de o que conta como transcrição vive no núcleo, onde é pura e testada;
  //    aqui só se entrega o que veio.
  const truncado = resultado.stopReason === 'max_tokens'
  const t = avaliarTranscricao(extrairJson(resultado.rawResponse) as never)

  await fecharLog({
    status: t.status === 'falhou' ? 'error' : 'success',
    parsed_ok: t.status !== 'falhou',
    parse_error: t.status === 'falhou' ? 'resposta do modelo fora do formato esperado' : null,
    // A resposta bruta é guardada RECORTADA: é a evidência de auditoria, e um laudo inteiro por linha de log
    // inflaria a tabela sem acrescentar nada — o texto transcrito já fica no registro do documento.
    raw_response: resultado.rawResponse.slice(0, 15000),
    prompt_tokens: resultado.promptTokens,
    completion_tokens: resultado.completionTokens,
    duration_ms: resultado.durationMs,
    stop_reason: resultado.stopReason,
    truncated: truncado,
    full_text_chars: t.texto?.length ?? 0,
    model: resultado.model,
  })

  return {
    texto: t.texto,
    status: t.status,
    trechosIlegiveis: t.trechosIlegiveis,
    promptVersion: prompt.version,
    logId,
    truncado,
    motivoDaFalha: t.status === 'falhou' ? 'resposta do modelo fora do formato esperado' : null,
    // Vai de volta ao chamador para ser GRAVADO no registro. É o que faz a deduplicação valer da próxima
    // vez — e o que finalmente preenche uma coluna que existia no banco sem nunca ter sido escrita.
    sha256,
  }
}
