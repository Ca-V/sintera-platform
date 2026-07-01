import type { DocumentProcessor, CaptureResult } from '../types'
import { captureError } from '../result'

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
      const ext = file.name.split('.').pop() ?? 'bin'
      const path = `${ctx.userId}/${crypto.randomUUID()}.${ext}`
      const up = await ctx.supabase.storage.from('exams').upload(path, file, { contentType: file.type, upsert: false })
      if (up.error) return captureError('exam', up.error.message)
      const signed = await ctx.supabase.storage.from('exams').createSignedUrl(path, 60 * 60 * 24 * 365)
      if (signed.error || !signed.data) return captureError('exam', signed.error?.message ?? 'signed url')
      const examId = crypto.randomUUID()
      const name = file.name.replace(/\.[^.]+$/, '')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ins = await (ctx.supabase.from('exams') as any).insert({ id: examId, user_id: ctx.userId, type: name, exam_date: null, file_url: signed.data.signedUrl, status: 'pending' })
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
