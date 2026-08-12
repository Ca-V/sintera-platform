// Rota de CRUD de Exames — Web (cookie) e Mobile (Bearer). Lógica em
// @/lib/exams/service. O arquivo é enviado ao storage no cliente (uploadUserDocument)
// e o `fileUrl` (signed URL) chega aqui; o registro do exame nasce 'pending'.
//   GET   → { exams }  (lista da usuária)
//   POST  { type, fileUrl?, examDate? } → cria; devolve { id }
//   PATCH { id, type?, examDate?, status? } → atualiza
// (Análise/extração = api/exams/[id]/analyze; exclusão = api/exams/[id].)
import { NextResponse } from 'next/server'
import { authed, BadRequestError } from '@/lib/api/http'
import { createExam, updateExam, listExams } from '@/lib/exams/service'

export const GET = authed(async ({ supabase, userId }) => {
  return NextResponse.json({ exams: await listExams(supabase, userId) })
})

export const POST = authed(async ({ supabase, userId, request }) => {
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const id = await createExam(supabase, userId, {
    type: typeof b.type === 'string' ? b.type : '',
    fileUrl: typeof b.fileUrl === 'string' ? b.fileUrl : null,
    examDate: typeof b.examDate === 'string' ? b.examDate : null,
  })
  return NextResponse.json({ id })
})

export const PATCH = authed(async ({ supabase, userId, request }) => {
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>
  if (typeof b.id !== 'string') throw new BadRequestError('id é obrigatório.')
  await updateExam(supabase, userId, b.id, {
    type: typeof b.type === 'string' ? b.type : undefined,
    examDate: typeof b.examDate === 'string' ? b.examDate : b.examDate === null ? null : undefined,
    status: typeof b.status === 'string' ? b.status : undefined,
  })
  return NextResponse.json({ success: true })
})
