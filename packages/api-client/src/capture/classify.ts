// @sintera/api-client — Classificação de documento por conteúdo (ANEXO-001 · item D).
//
// PONTE ARQUITETURAL TRANSITÓRIA (ADR-020): reusa a rota `/api/capture/classify` da Web — a MESMA regra de
// classificação, com o MESMO prompt e os MESMOS critérios de transcrição, em vez de duplicá-la no Mobile.
// Duplicá-la significaria duas leituras diferentes do mesmo documento conforme o aparelho da pessoa.
// Mesmo arranjo de `listConnectors` e `analyzeExam`. Autentica por Bearer.
//
// NÃO LANÇA: leitura assistida é auxílio, não requisito. Falha devolve o MOTIVO e a pessoa preenche à mão, como
// sempre pôde. Quebrar a tela porque a leitura falhou seria trocar uma conveniência por um impedimento.
//
// MAS DEVOLVE O MOTIVO. Devolvia `null` para cinco situações diferentes — inclusive a ponte não configurada,
// que custou dois ciclos de homologação e continuaria invisível na próxima vez. Degradar é certo; degradar
// calado não.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ClassificationResult, LeituraTentativa } from '@sintera/core'

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
): Promise<LeituraTentativa<ClassificationResult>> {
  // CADA SAÍDA DIZ POR QUÊ. Antes eram cinco `return null` indistinguíveis, e a tela não tinha como
  // diferenciar "não consegui ler" de "li e não reconheci" — do lado de fora, os campos simplesmente não se
  // preenchiam. A primeira dessas cinco, a ponte ausente, custou dois ciclos de homologação.
  const url = base(webBaseUrl)
  if (!url) {
    console.warn('[SINTERA] leitura de documento: a ponte com a Web não está configurada (EXPO_PUBLIC_WEB_URL).')
    return { resultado: null, motivo: 'sem-ponte' }
  }
  if (!input.fileBase64) return { resultado: null, motivo: 'sem-arquivo' }

  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session?.access_token) return { resultado: null, motivo: 'sem-sessao' }

    const res = await fetch(`${url}/api/capture/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      console.warn(`[SINTERA] leitura de documento: o servidor respondeu ${res.status}.`)
      return { resultado: null, motivo: 'servidor' }
    }
    // LEU. `motivo` nulo mesmo que o conteúdo venha pobre — não reconhecer é resposta legítima, e avisar sobre
    // ela transformaria uma leitura bem-sucedida num alarme.
    return { resultado: (await res.json()) as ClassificationResult, motivo: null }
  } catch (e) {
    console.warn('[SINTERA] leitura de documento: não houve resposta.', e)
    return { resultado: null, motivo: 'rede' }
  }
}
