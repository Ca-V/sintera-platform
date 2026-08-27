// @sintera/api-client — nome dos registros a que um documento está VINCULADO (item C do backlog de paridade).
//
// POR QUE EXISTE: o card mostrava só "Receita", mesmo quando o vínculo com o medicamento já estava gravado.
// Esconder o que a plataforma sabe obriga a pessoa a abrir o documento para descobrir de qual remédio é aquela
// receita — trabalho administrativo que a SINTERA existe para reduzir.
//
// O VÍNCULO É POLIMÓRFICO (`target_domain` + `target_id`, sem FK possível — ver a migração 146), então
// resolver o nome exige perguntar à tabela certa de cada domínio. É feito em LOTE por domínio, não um a um.
//
// DEGRADA, NÃO QUEBRA: domínio sem tabela mapeada, registro apagado ou consulta que falha devolvem ausência de
// nome, e o título cai para o rótulo puro ("Receita"). Nunca inventa complemento.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { DocumentTargetDomain } from '@sintera/core'

/** Onde mora o nome de cada domínio-alvo. Confirmado contra o schema de produção. */
const FONTE: Partial<Record<DocumentTargetDomain, { tabela: string; coluna: string }>> = {
  medicamento: { tabela: 'medications',       coluna: 'name' },
  suplemento:  { tabela: 'medications',       coluna: 'name' },  // mesma tabela, distinguida por `kind`
  recurso:     { tabela: 'health_resources',  coluna: 'name' },
  habito:      { tabela: 'life_habits',       coluna: 'description' },
  consulta:    { tabela: 'health_events',     coluna: 'title' },
  // `exame` fica de fora: `exams` não tem coluna de nome própria — o título vem da identidade derivada dos
  // resultados, que é outra regra e outro caminho. Melhor não nomear do que nomear errado.
}

export interface DocumentLink {
  document_id: string
  target_domain: DocumentTargetDomain
  target_id: string
}

/**
 * Vínculos dos documentos pedidos + o nome de cada alvo, quando resolvível.
 * Devolve um mapa `document_id → nomes`, pronto para `deriveDocumentTitle`.
 *
 * NUNCA lança: qualquer falha devolve o que já conseguiu (possivelmente nada). O título degrada sozinho.
 */
export async function targetNamesByDocument(
  client: SupabaseClient,
  documentIds: readonly string[],
): Promise<Record<string, string[]>> {
  const porDocumento: Record<string, string[]> = {}
  if (documentIds.length === 0) return porDocumento

  try {
    const { data, error } = await client
      .from('patient_document_links')
      .select('document_id, target_domain, target_id')
      .in('document_id', [...documentIds])
    if (error || !data) return porDocumento

    const links = data as DocumentLink[]
    if (links.length === 0) return porDocumento

    // Agrupa por domínio para consultar cada tabela UMA vez, não uma vez por vínculo.
    const idsPorDominio = new Map<DocumentTargetDomain, Set<string>>()
    for (const l of links) {
      if (!FONTE[l.target_domain]) continue
      const s = idsPorDominio.get(l.target_domain) ?? new Set<string>()
      s.add(l.target_id)
      idsPorDominio.set(l.target_domain, s)
    }

    const nomePorAlvo = new Map<string, string>()  // chave: `${dominio}|${id}`
    for (const [dominio, ids] of idsPorDominio) {
      const fonte = FONTE[dominio]
      if (!fonte) continue
      try {
        // A coluna do nome varia por domínio, então o `select` é montado em tempo de execução. O analisador
        // de tipos do Supabase só entende literais, daí a conversão por `unknown` — é limitação do tipo dele,
        // não desconhecimento da forma: `id` e a coluna foram conferidos contra o schema de produção.
        const r = await client.from(fonte.tabela).select(`id, ${fonte.coluna}`).in('id', [...ids])
        for (const linha of ((r.data ?? []) as unknown) as Record<string, unknown>[]) {
          const nome = linha[fonte.coluna]
          if (typeof nome === 'string' && nome.trim()) {
            nomePorAlvo.set(`${dominio}|${String(linha.id)}`, nome.trim())
          }
        }
      } catch {
        // Um domínio que falha não derruba os outros.
      }
    }

    // Preserva a ordem dos vínculos — o "+1" do título deve ser estável entre carregamentos.
    for (const l of links) {
      const nome = nomePorAlvo.get(`${l.target_domain}|${l.target_id}`)
      if (!nome) continue
      porDocumento[l.document_id] = [...(porDocumento[l.document_id] ?? []), nome]
    }
    return porDocumento
  } catch {
    return porDocumento
  }
}
