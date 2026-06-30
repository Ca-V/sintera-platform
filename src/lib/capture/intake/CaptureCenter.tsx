'use client'

// ============================================================
// Centro de Entrada (Capture Center) — INTAKE · componente REUTILIZÁVEL
// ============================================================
// V1 (MVP, SEM IA): selecionar/arrastar → prévia → sugestão heurística + escolher/
// corrigir o tipo → encaminhar ao pipeline EXISTENTE → resultado. Sem domínio novo,
// sem criação de evento, sem lote/fila/OCR/IA. Apenas ORQUESTRAÇÃO.
// Usado em várias superfícies (Dashboard agora; Exames/Medicamentos/Timeline/mobile
// depois). A página é só consumidora — a lógica vive aqui.
// ============================================================

import { useCallback, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FlaskConical, Pill, Glasses, Dna, FileText, UploadCloud, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import { CAPTURE_PROCESSORS, processorFor, processorsAccepting } from '../registry'
import { classifyByFilename } from '../classifier/classify'
import type { DocumentKind } from '../types'

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  FlaskConical, Pill, Glasses, Dna, FileText,
}
const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_BYTES = 50 * 1024 * 1024

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export interface CaptureCenterProps {
  className?: string
  /** Chamado após encaminhar com sucesso (ex.: fechar o modal). */
  onDone?: () => void
}

export default function CaptureCenter({ className = '', onDone }: CaptureCenterProps) {
  const router = useRouter()
  const { user } = useUser()
  const supabase = useRef(createClient()).current
  const inputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [kind, setKind] = useState<DocumentKind | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Tipos válidos para o arquivo escolhido (por MIME).
  const validKinds = useMemo(() => (file ? processorsAccepting(file.type) : CAPTURE_PROCESSORS), [file])

  const pickFile = useCallback((f: File) => {
    setError(null)
    if (!ACCEPTED.includes(f.type)) { setError('Formato inválido. Aceitos: PDF, JPG e PNG.'); return }
    if (f.size > MAX_BYTES) { setError('Arquivo muito grande (limite 50 MB).'); return }
    setFile(f)
    setPreviewUrl(f.type.startsWith('image/') ? URL.createObjectURL(f) : null)
    // Sugestão heurística (só se o tipo aceitar o MIME do arquivo).
    const guess = classifyByFilename(f.name).kind
    setKind(processorsAccepting(f.type).some(p => p.kind === guess) ? guess : null)
  }, [])

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null); setPreviewUrl(null); setKind(null); setError(null); setSending(false)
  }

  async function forward() {
    if (!file || !kind || sending) return
    const proc = processorFor(kind)
    if (!proc) return
    setError(null)
    // EXAME: upload + insert + navega ao resultado (pipeline existente, reusado fielmente).
    // Demais tipos: encaminha à entrada do módulo (upload-no-hub por tipo = próximo incremento).
    if (kind === 'exam') {
      if (!user) { setError('Faça login para enviar.'); return }
      setSending(true)
      try {
        const ext = file.name.split('.').pop() ?? 'bin'
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`
        const up = await supabase.storage.from('exams').upload(path, file, { contentType: file.type, upsert: false })
        if (up.error) throw new Error(up.error.message)
        const signed = await supabase.storage.from('exams').createSignedUrl(path, 60 * 60 * 24 * 365)
        if (signed.error || !signed.data) throw new Error(signed.error?.message ?? 'Não foi possível gerar o link do arquivo.')
        const examId = crypto.randomUUID()
        const name = file.name.replace(/\.[^.]+$/, '')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ins = await (supabase.from('exams') as any).insert({ id: examId, user_id: user.id, type: name, exam_date: null, file_url: signed.data.signedUrl, status: 'pending' })
        if (ins.error) throw new Error(ins.error.message)
        onDone?.()
        router.push(`/dashboard/exams/${examId}`)
      } catch (e) {
        setSending(false)
        setError(e instanceof Error ? e.message : 'Falha ao enviar. Tente novamente.')
      }
    } else {
      onDone?.()
      router.push(proc.target)
    }
  }

  return (
    <div className={className}>
      {!file ? (
        // ── Passo 1: selecionar / arrastar ──────────────────────────────────────
        <div>
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) pickFile(f) }}
            onClick={() => inputRef.current?.click()}
            className={`rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${dragOver ? 'border-petal bg-blush/20' : 'border-border hover:border-petal/40'}`}
          >
            <UploadCloud size={28} className="text-petal mx-auto mb-2" />
            <p className="font-body text-sm text-onyx">Arraste um arquivo ou <span className="text-petal font-medium">selecione</span></p>
            <p className="font-body text-xs text-mauve mt-1">PDF, JPG ou PNG · até 50 MB</p>
          </div>
          <input ref={inputRef} type="file" accept={ACCEPTED.join(',')} className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = '' }} />
          {error && <p className="font-body text-xs text-red-600 mt-2">{error}</p>}
        </div>
      ) : (
        // ── Passo 2: prévia + tipo + encaminhar ─────────────────────────────────
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-ivory p-3">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <span className="w-12 h-12 rounded-lg bg-blush flex items-center justify-center flex-shrink-0"><FileText size={20} className="text-petal" /></span>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-body text-sm text-onyx truncate">{file.name}</p>
              <p className="font-body text-xs text-mauve">{fmtSize(file.size)} · {file.type.includes('pdf') ? 'PDF' : 'Imagem'}</p>
            </div>
            <button onClick={reset} disabled={sending} aria-label="Trocar arquivo" className="text-mauve/40 hover:text-onyx transition-colors disabled:opacity-40"><X size={16} /></button>
          </div>

          <div>
            <p className="font-body text-sm font-semibold text-onyx mb-1">Qual é este documento?</p>
            {kind && processorFor(kind) && (
              <p className="font-body text-xs text-mauve mb-2">Sugestão: parece ser <strong>{processorFor(kind)!.label.toLowerCase()}</strong> — confirme ou corrija.</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {validKinds.map(p => {
                const Icon = ICONS[p.icon] ?? FileText
                const active = kind === p.kind
                return (
                  <button key={p.kind} onClick={() => setKind(p.kind)} disabled={sending}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-colors disabled:opacity-50 ${active ? 'border-petal bg-blush/20' : 'border-border bg-ivory hover:border-petal/40'}`}>
                    <Icon size={16} className={active ? 'text-petal' : 'text-mauve'} />
                    <span className="font-body text-sm text-onyx">{p.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {error && <p className="font-body text-xs text-red-600">{error}</p>}

          <div className="flex items-center justify-end gap-2">
            <button onClick={reset} disabled={sending}
              className="px-4 py-2 rounded-full font-body text-sm text-mauve hover:text-onyx transition-colors disabled:opacity-40">Cancelar</button>
            <button onClick={forward} disabled={!kind || sending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity">
              {sending ? <><Loader2 size={14} className="animate-spin" /> Enviando…</> : 'Enviar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
