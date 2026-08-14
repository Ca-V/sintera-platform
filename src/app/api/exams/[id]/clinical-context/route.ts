// FLUXO DE CONSUMO do Clinical Knowledge Service (C6). Dado um exame já reconhecido (Clinical Identity persistida),
// devolve o CONTEXTO CLÍNICO confiável e rastreável — descrição, finalidade, indicações, periodicidade, especialidade,
// órgão/sistema, nível de evidência, referências — cada campo com proveniência. Read-only; NÃO altera o pipeline de
// identidade. Resolve a partir dos FATOS já gravados no exame (nome/modalidade); sem entrada curada → available:false.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getKnowledgeForConcept, toClinicalContext } from '@/lib/clinical-knowledge/clinical-knowledge-service'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: examId } = await params
  const supabase = await createClient()

  // 1. Auth
  const { data: authData, error: authErr } = await supabase.auth.getUser()
  if (authErr || !authData.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const userId = authData.user.id

  // 2. Ownership + FATOS de identidade já persistidos (o C6 não reinterpreta o documento — só consome a identidade).
  const { data: exam } = await supabase
    .from('exams')
    .select('id, display_title, type, document_type, clinical_type, equipment')
    .eq('id', examId)
    .eq('user_id', userId)
    .maybeSingle() as { data: {
      id: string; display_title: string | null; type: string | null
      document_type: string | null; clinical_type: string | null; equipment: string | null
    } | null }

  if (!exam) {
    return NextResponse.json({ error: 'Exame não encontrado.' }, { status: 404 })
  }

  // 3. Conceito a resolver: nome de exibição (identidade) → tipo/modalidade como fallback. Nunca o equipamento.
  const knowledge = await getKnowledgeForConcept({
    name: exam.display_title ?? exam.type ?? undefined,
    modality: exam.clinical_type ?? exam.document_type ?? undefined,
  })

  // 4. Sem curadoria para este exame → resposta graciosa (a UI não quebra; o conteúdo evolui progressivamente).
  if (!knowledge) {
    return NextResponse.json({ available: false })
  }

  // Devolve o conhecimento COMPLETO (proveniência por atributo, rastreabilidade) + a projeção achatada ClinicalContext.
  return NextResponse.json({
    available: true,
    knowledge,
    context: toClinicalContext(knowledge),
  })
}
