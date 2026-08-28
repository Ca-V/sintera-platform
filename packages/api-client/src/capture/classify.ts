// @sintera/api-client — Classificação de documento por conteúdo (ANEXO-001 · item D).
//
// PONTE ARQUITETURAL TRANSITÓRIA (ADR-020): reusa a rota `/api/capture/classify` da Web — a MESMA regra de
// classificação, com o MESMO prompt e os MESMOS critérios de transcrição, em vez de duplicá-la no Mobile.
// Duplicá-la significaria duas leituras diferentes do mesmo documento conforme o aparelho da pessoa.
// Mesmo arranjo de `listConnectors` e `analyzeExam`. Autentica por Bearer.
//
// NÃO LANÇA: leitura assistida é auxílio, não requisito. Falha devolve `null` e a pessoa preenche à mão, como
// sempre pôde. Quebrar a tela porque a leitura falhou seria trocar uma conveniência por um impedimento.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ClassificationResult } from '@sintera/core'

function base(webBaseUrl: string | undefined): string | null {
  return webBaseUrl ? webBaseUrl.replace(/\/+$/, '') : null
}

export interface ClassifyInput {
  fileBase64: string
  mediaType: string
  filename?: string
}

/**
 * Lê o documento e devolve o que ele PARECE ser, mais os fatos documentais transcritos (emissor, data).
 * `null` sempre que não der para ler — por qualquer motivo.
 */
export async function classifyDocument(
  client: SupabaseClient,
  webBaseUrl: string | undefined,
  input: ClassifyInput,
): Promise<ClassificationResult | null> {
  try {
    const url = base(webBaseUrl)
    if (!url || !input.fileBase64) return null

    const { data: { session } } = await client.auth.getSession()
    if (!session?.access_token) return null

    const res = await fetch(`${url}/api/capture/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(input),
    })
    if (!res.ok) return null
    return (await res.json()) as ClassificationResult
  } catch {
    return null
  }
}
