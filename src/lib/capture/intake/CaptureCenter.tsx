'use client'

// ============================================================
// Central de Entrada (interno: CaptureCenter) — INTAKE · componente REUTILIZÁVEL
// ============================================================
// V1 (MVP, SEM IA): selecionar/arrastar → prévia → sugestão heurística + escolher/
// corrigir o tipo → ENVIAR → resultado UNIFICADO. Estados, resultado e erro são
// uniformes (contrato CaptureResult) — a usuária sente UM ponto de entrada, não 4
// módulos. Sem domínio novo, sem evento, sem lote/fila/OCR/IA. Apenas ORQUESTRAÇÃO.
// ============================================================

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FlaskConical, Pill, Glasses, HeartPulse, Dna, FileText, UploadCloud, Camera, Loader2, X, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import { CAPTURE_PROCESSORS, processorFor, processorsAccepting } from '../registry'
import { classifyByFilename } from '../classifier/classify'
import { captureError } from '../result'
import { logCapture } from '../telemetry'
import type { DocumentKind, CaptureResult, ClassificationResult } from '../types'

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  FlaskConical, Pill, Glasses, HeartPulse, Dna, FileText,
}
const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_BYTES = 50 * 1024 * 1024

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Converte o arquivo para base64 p/ a classificação por conteúdo. Imagem: reduz
 *  (acelera/barateia); PDF: base64 direto. Client-only (canvas/FileReader). */
async function fileToBase64(file: File): Promise<{ fileBase64: string; mediaType: string }> {
  if (file.type.startsWith('image/')) {
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const img = new Image()
        const url = URL.createObjectURL(file)
        img.onload = () => {
          const max = 1600
          const scale = Math.min(1, max / Math.max(img.width, img.height))
          const canvas = document.createElement('canvas')
          canvas.width = Math.max(1, Math.round(img.width * scale))
          canvas.height = Math.max(1, Math.round(img.height * scale))
          const ctx = canvas.getContext('2d')
          if (!ctx) { URL.revokeObjectURL(url); reject(new Error('canvas')); return }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          URL.revokeObjectURL(url)
          resolve(canvas.toDataURL('image/jpeg', 0.8))
        }
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('img')) }
        img.src = url
      })
      return { fileBase64: dataUrl.split(',')[1] ?? '', mediaType: 'image/jpeg' }
    } catch {
      return { fileBase64: '', mediaType: file.type }
    }
  }
  const b64 = await new Promise<string>((resolve) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '')
    r.onerror = () => resolve('')
    r.readAsDataURL(file)
  })
  return { fileBase64: b64, mediaType: file.type }
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
  const cameraRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [kind, setKind] = useState<DocumentKind | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CaptureResult | null>(null)
  const [classifying, setClassifying] = useState(false)   // IA lendo o conteúdo
  const [autoConfident, setAutoConfident] = useState(false) // classificação por conteúdo com alta confiança

  // CAP-001 (Princípio 1): a lista de destinos NÃO varia pelo tipo do arquivo — mostra
  // sempre todos os destinos suportados; a compatibilidade do formato é validada no envio
  // (forward). Antes, filtrar por MIME escondia "Receita de medicamento" para PDFs.
  const validKinds = CAPTURE_PROCESSORS

  const pickFile = useCallback((f: File) => {
    setError(null)
    if (!ACCEPTED.includes(f.type)) { setError('Formato inválido. Aceitos: PDF, JPG e PNG.'); return }
    if (f.size > MAX_BYTES) { setError('Arquivo muito grande (limite 50 MB).'); return }
    setFile(f)
    setPreviewUrl(f.type.startsWith('image/') ? URL.createObjectURL(f) : null)
    setAutoConfident(false)
    // Palpite instantâneo por NOME (rede de segurança).
    const guess = classifyByFilename(f.name).kind
    setKind(processorsAccepting(f.type).some(p => p.kind === guess) ? guess : null)
    // Em seguida, o ContentClassifier lê o CONTEÚDO e melhora o palpite (fire-and-forget).
    setClassifying(true)
    void (async () => {
      try {
        const payload = await fileToBase64(f)
        if (!payload.fileBase64) return
        const res = await fetch('/api/capture/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, filename: f.name }),
        })
        if (!res.ok) return
        const cls = (await res.json()) as ClassificationResult
        if (cls.kind && cls.kind !== 'unknown' && cls.kind !== 'other'
            && processorsAccepting(f.type).some(p => p.kind === cls.kind)) {
          setKind(cls.kind)
          setAutoConfident(cls.confidence === 'high')
        }
      } catch { /* mantém o palpite por nome */ } finally {
        setClassifying(false)
      }
    })()
  }, [])

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null); setPreviewUrl(null); setKind(null); setError(null); setSending(false); setResult(null)
    setClassifying(false); setAutoConfident(false)
  }

  function cancel() {
    if (file) logCapture({ kind, suggested: classifyByFilename(file.name).kind, outcome: 'cancelled' })
    reset()
  }

  async function forward() {
    if (!file || !kind || sending) return
    const proc = processorFor(kind)
    if (!proc) return
    // Validação de formato PÓS-seleção do destino (CAP-001 Princípio 1).
    if (!proc.accepts.includes(file.type)) {
      setError('Este formato de arquivo não é compatível com o tipo de documento escolhido. Aceitos: PDF, JPG e PNG.')
      return
    }
    if (kind === 'exam' && !user) { setError('Faça login para enviar.'); return }
    setSending(true); setError(null)
    const start = Date.now()
    const suggested = classifyByFilename(file.name).kind
    try {
      const res = await proc.process(file, { supabase, userId: user?.id ?? '' })
      logCapture({ kind, suggested, outcome: res.status, durationMs: Date.now() - start, errorReason: res.errorReason })
      setResult(res)
    } catch (e) {
      logCapture({ kind, suggested, outcome: 'error', durationMs: Date.now() - start })
      setResult(captureError(kind, e instanceof Error ? e.message : String(e)))
    } finally {
      setSending(false)
    }
  }

  // ── Resultado UNIFICADO (sucesso · encaminhado · erro) ──────────────────────
  if (result) {
    const ok = result.status !== 'error'
    return (
      <div className={className}>
        <div className="text-center py-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 ${ok ? 'bg-sage-light' : 'bg-red-50'}`}>
            {ok ? <CheckCircle size={24} className="text-sage" /> : <AlertCircle size={24} className="text-red-500" />}
          </div>
          <p className="font-display text-lg font-semibold text-onyx">{result.title}</p>
          <p className="font-body text-sm text-mauve mt-1 max-w-xs mx-auto">{result.message}</p>
          <div className="flex items-center justify-center gap-2 mt-5">
            {result.nextHref && result.nextActionLabel && (
              <button onClick={() => { onDone?.(); router.push(result.nextHref!) }}
                className="px-5 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium hover:opacity-90 transition-opacity">
                {result.nextActionLabel}
              </button>
            )}
            {ok ? (
              <button onClick={reset} className="px-4 py-2 rounded-full font-body text-sm text-mauve hover:text-onyx transition-colors">Adicionar outro</button>
            ) : (
              <button onClick={() => setResult(null)} className="px-4 py-2 rounded-full font-body text-sm text-petal hover:underline">Tentar novamente</button>
            )}
          </div>
        </div>
      </div>
    )
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
          <button type="button" onClick={() => cameraRef.current?.click()}
            className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-petal/40 text-petal font-body text-sm font-medium hover:bg-blush transition-colors">
            <Camera size={16} /> Tirar foto ou escanear
          </button>
          <input ref={inputRef} type="file" accept={ACCEPTED.join(',')} className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = '' }} />
          {/* Câmera: no celular abre direto a câmera (capture); no desktop, o seletor de arquivos. */}
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = '' }} />
          {error && <p className="font-body text-xs text-red-600 mt-2">{error}</p>}
        </div>
      ) : (
        // ── Passo 2: prévia + tipo + enviar ─────────────────────────────────────
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
            <button onClick={cancel} disabled={sending} aria-label="Trocar arquivo" className="text-mauve/40 hover:text-onyx transition-colors disabled:opacity-40"><X size={16} /></button>
          </div>

          <div>
            <p className="font-body text-sm font-semibold text-onyx mb-1">Qual é este documento?</p>
            {/* Palpite IMEDIATO (por nome) sempre visível; a IA só refina em segundo plano
                ("afinando…"), sem bloquear. "Lendo…" só quando ainda não há palpite algum. */}
            {kind && processorFor(kind) ? (
              <p className="font-body text-xs text-mauve mb-2 flex flex-wrap items-center gap-x-1.5">
                <span>
                  {autoConfident ? 'Identifiquei que é ' : 'Sugestão: parece ser '}
                  <strong>{processorFor(kind)!.label.toLowerCase()}</strong> — confirme ou corrija.
                </span>
                {classifying && (
                  <span className="inline-flex items-center gap-1 text-mauve/60"><Loader2 size={11} className="animate-spin" /> afinando…</span>
                )}
              </p>
            ) : classifying ? (
              <p className="font-body text-xs text-mauve mb-2 inline-flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Lendo o documento…</p>
            ) : null}
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
            <button onClick={cancel} disabled={sending}
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
