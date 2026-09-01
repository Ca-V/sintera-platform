// TRANSCRIÇÃO DE RECEITAS, ATESTADOS E DEMAIS DOCUMENTOS.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// DECISÃO DA FUNDADORA (01/09/2026): "todos os documentos que são adicionados precisam ser lidos e
// transcritos", independentemente da forma como entram.
//
// O QUE FALTAVA. `patient_documents` nunca teve transcrição. A leitura assistida já abria a foto da receita
// para preencher profissional, instituição, data e itens prescritos — e DESCARTAVA o texto. Buscar uma
// palavra dentro de uma receita nunca funcionou, porque nunca houve o que buscar.
//
// POR QUE UMA ROTA PRÓPRIA, e não dentro da classificação. A classificação roda ANTES de o documento existir:
// não haveria id para amarrar a linha de auditoria, e uma transcrição sem rastro é exatamente o que esta
// mudança existe para não produzir. Aqui o documento já está salvo, então cada leitura aponta para ele — e a
// rota pode ser chamada de novo quando a primeira tentativa falhar.
//
// Simétrica a `/api/exams/[id]/analyze`: mesmo serviço, mesmo prompt governado, mesma auditoria.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server'
// Auth COMPARTILHADA (Cookie=Web · Bearer=aplicativo) — ponte ADR-020.
import { getAuthedSupabase } from '@/lib/supabase/authedClient'
import { transcribeDocument } from '@/lib/ai/transcription'
import { combinarTranscricoes, statusFrase, type Transcricao } from '@sintera/core'

/** Tipo do arquivo pela extensão. O que não for imagem conhecida é tratado como PDF. */
function mediaTypeDe(url: string): string {
  const caminho = (() => { try { return new URL(url).pathname.toLowerCase() } catch { return url.toLowerCase() } })()
  if (caminho.endsWith('.png')) return 'image/png'
  if (caminho.endsWith('.webp')) return 'image/webp'
  if (/\.jpe?g$/.test(caminho)) return 'image/jpeg'
  return 'application/pdf'
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: documentId } = await params
  const { supabase, user } = await getAuthedSupabase(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // Dono — a RLS já protege, e o filtro explícito faz "não é seu" e "não existe" darem a mesma resposta.
  const { data: doc } = await supabase
    .from('patient_documents')
    .select('id, file_url, transcricao_status')
    .eq('id', documentId).eq('user_id', user.id).single() as {
      data: { id: string; file_url: string | null; transcricao_status: string | null } | null
    }

  if (!doc) return NextResponse.json({ error: 'Documento não encontrado.' }, { status: 404 })
  if (!doc.file_url) return NextResponse.json({ error: 'Este documento não tem arquivo anexado.' }, { status: 422 })

  // JÁ LIDO NÃO É RELIDO. Transcrever de novo custa uma chamada e pode devolver texto diferente do que a
  // pessoa já conferiu — reler só faz sentido quando a leitura anterior NÃO deu certo.
  if (doc.transcricao_status === 'ok' || doc.transcricao_status === 'parcial') {
    return NextResponse.json({ status: doc.transcricao_status, jaTranscrito: true }, { status: 200 })
  }

  // As páginas, NA ORDEM DE LEITURA — é a ordem em que a pessoa fotografou (ANEXO-001).
  const { data: paginas } = await supabase
    .from('patient_document_files')
    .select('file_url, mime_type, position')
    .eq('document_id', documentId).eq('user_id', user.id)
    .order('position', { ascending: true }) as {
      data: { file_url: string; mime_type: string | null; position: number }[] | null
    }

  // Sem páginas extras, o documento é o próprio `file_url` — o formato antigo, que continua valendo.
  const arquivos = (paginas && paginas.length > 0)
    ? paginas.map(p => ({ url: p.file_url, mediaType: p.mime_type || mediaTypeDe(p.file_url) }))
    : [{ url: doc.file_url, mediaType: mediaTypeDe(doc.file_url) }]

  const transcricoes: Transcricao[] = []
  // A VERSÃO DO PROMPT e a ÚLTIMA linha de auditoria — é por elas que se reconstrói, meses depois, sob qual
  // regra este texto foi produzido. Sem isso, "transcrito" seria uma afirmação sem prova.
  let promptVersion: string | null = null
  let ultimoLogId: string | null = null

  for (const arq of arquivos) {
    let buffer: Buffer
    try {
      const res = await fetch(arq.url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      buffer = Buffer.from(await res.arrayBuffer())
    } catch {
      // Página que não desceu é página NÃO LIDA — e falha de rede é 'falhou', nunca 'ilegível': uma se
      // resolve tentando de novo, a outra não, e confundi-las manda a pessoa repetir em vão.
      transcricoes.push({ texto: null, status: 'falhou', trechosIlegiveis: 0 })
      continue
    }

    const t = await transcribeDocument(supabase, {
      alvo: { kind: 'document', documentId },
      userId: user.id,
      buffer,
      mediaType: arq.mediaType,
    })
    transcricoes.push({ texto: t.texto, status: t.status, trechosIlegiveis: t.trechosIlegiveis })
    promptVersion = t.promptVersion ?? promptVersion
    ultimoLogId = t.logId ?? ultimoLogId
  }

  const combinada = combinarTranscricoes(transcricoes)

  // A PROVENIÊNCIA É GRAVADA MESMO NA FALHA. Um documento que não pôde ser lido precisa DIZER isso; sem o
  // registro, ele volta a ser indistinguível de um documento sem conteúdo.
  const { error } = await supabase.from('patient_documents').update({
    transcricao: combinada.texto,
    transcricao_status: combinada.status,
    transcricao_origin: combinada.texto ? 'transcricao_visao' : null,
    transcrito_em: new Date().toISOString(),
    transcricao_prompt_version: promptVersion,
    // O log da ÚLTIMA página lida ancora a auditoria do conjunto; cada página tem a SUA própria linha em
    // `ai_processing_log`, todas apontando para este documento por `document_id` — de onde se recupera o
    // histórico completo, página a página.
    transcricao_log_id: ultimoLogId,
  } as never).eq('id', documentId).eq('user_id', user.id)

  if (error) {
    console.error('[transcricao] falha ao gravar a transcrição do documento', documentId, error.message)
    return NextResponse.json({ error: 'Não foi possível salvar a transcrição.' }, { status: 500 })
  }

  return NextResponse.json({
    status: combinada.status,
    trechosIlegiveis: combinada.trechosIlegiveis,
    paginas: arquivos.length,
    mensagem: statusFrase(combinada.status, combinada.trechosIlegiveis),
  })
}
