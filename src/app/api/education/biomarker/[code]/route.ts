// Camada educacional: dado o `code` do biomarker_catalog, devolve material
// educativo do MedlinePlus (NIH) sobre O QUE É aquele exame.
// Ver docs/clinical/GOVERNANCA-CIENTIFICA.md §1.1.
//
// FRONTEIRA: educativo sobre o tipo de exame — NUNCA interpreta o resultado da
// usuária. Só usamos o loinc_code do catálogo (tipo de exame); nenhum dado de
// saúde individual é enviado ao MedlinePlus. Se o exame ainda não tem LOINC
// mapeado (curadoria pendente), retorna lista vazia com motivo claro.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchMedlinePlusByLoinc, type MedlineLanguage } from '@/lib/education/medlineplus'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params
  const supabase = await createClient()

  // Auth — conteúdo só para usuárias logadas (consistente com o resto do app).
  const { data: authData, error: authErr } = await supabase.auth.getUser()
  if (authErr || !authData.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const langParam = request.nextUrl.searchParams.get('lang')
  const language: MedlineLanguage = langParam === 'es' ? 'es' : 'en'

  // Busca o LOINC do tipo de exame no catálogo.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- cast do supabase (tipos gerados não cobrem a tabela); resultado tipado abaixo
  const { data: entry } = await (supabase as any)
    .from('biomarker_catalog')
    .select('code, display_name, loinc_code')
    .eq('code', code)
    .maybeSingle() as { data: { code: string; display_name: string; loinc_code: string | null } | null }

  if (!entry) {
    return NextResponse.json({ error: 'Biomarcador não encontrado.' }, { status: 404 })
  }

  // Sem LOINC mapeado → camada educacional ainda não disponível (curadoria pendente).
  if (!entry.loinc_code) {
    return NextResponse.json({
      code: entry.code,
      displayName: entry.display_name,
      loincCode: null,
      source: 'medlineplus',
      language,
      topics: [],
      reason: 'loinc_nao_mapeado',
    })
  }

  const topics = await fetchMedlinePlusByLoinc(entry.loinc_code, language)
  return NextResponse.json({
    code: entry.code,
    displayName: entry.display_name,
    loincCode: entry.loinc_code,
    source: 'medlineplus',
    language,
    topics,
  })
}
