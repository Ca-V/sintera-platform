import type { DocumentProcessor, CaptureResult } from '../types'
import { captureError } from '../result'
import { uploadUserDocument } from '@/lib/api/storage'
import { createExam } from '@/lib/exams/service'

// Processador de EXAME (e laudos). Encaminha ao pipeline de Exames existente:
// upload → signed URL → insert (status pending). A extração inicia no detalhe do exame.
export const examProcessor: DocumentProcessor = {
  kind: 'exam',
  label: 'Exame',
  icon: 'FlaskConical',
  accepts: ['application/pdf', 'image/jpeg', 'image/png'],
  target: '/dashboard/exams',
  confirmPhrase: 'um exame',
  async process(file, ctx): Promise<CaptureResult> {
    try {
      const { signedUrl } = await uploadUserDocument(ctx.supabase, { userId: ctx.userId, file })
      if (!signedUrl) return captureError('exam', 'signed url')
      const name = file.name.replace(/\.[^.]+$/, '')
      const examId = await createExam(ctx.supabase, ctx.userId, { type: name, fileUrl: signedUrl })
      return {
        status: 'success', kind: 'exam', entityId: examId,
        title: 'Exame criado',
        message: 'Enviado — a extração dos dados começa automaticamente.',
        nextActionLabel: 'Abrir exame', nextHref: `/dashboard/exams/${examId}`,
      }
    } catch (e) {
      return captureError('exam', e instanceof Error ? e.message : String(e))
    }
  },
}
