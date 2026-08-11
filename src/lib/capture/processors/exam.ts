import type { DocumentProcessor, CaptureResult } from '../types'
import { captureError } from '../result'
import { uploadUserDocument } from '@/lib/api/storage'

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
      const examId = crypto.randomUUID()
      const name = file.name.replace(/\.[^.]+$/, '')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ins = await (ctx.supabase.from('exams') as any).insert({ id: examId, user_id: ctx.userId, type: name, exam_date: null, file_url: signedUrl, status: 'pending' })
      if (ins.error) return captureError('exam', ins.error.message)
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
