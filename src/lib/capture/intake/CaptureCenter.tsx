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
import { FlaskConical, Pill, Glasses, HeartPulse, Dna, FileText, UploadCloud, Camera, Loader2, X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import { CAPTURE_PROCESSORS, processorFor, processorsAccepting } from '../registry'
import { classifyCheap } from '../classifier/classify'
import { captureError, captureResultTone } from '../result'
import { logCapture } from '../telemetry'
import type { DocumentKind, CaptureResult, ClassificationResult } from '../types'
import { useDocumentBundle, DocumentBundleStaging } from '@/components/ui/DocumentBundleCapture'
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from '../limits'
// Estava definida aqui dentro; virou fonte única porque `medications/scanImage` tinha outra, sem redução —
// duas qualidades de leitura para a mesma pessoa, conforme a tela que ela usasse.
import { fileToBase64 } from '../fileToBase64'
// A politica de formatos tem UM dono (ANEXO-001). Cada input declarava a sua, e as listas divergiam:
// `image/*` deixava passar HEIC — o padrao do iPhone — que a plataforma declara como capacidade AINDA NAO
// habilitada. O arquivo entrava e a leitura falhava depois, sem ninguem entender por que.
import { supportedNowAcceptAttr } from '@sintera/core'

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  FlaskConical, Pill, Glasses, HeartPulse, Dna, FileText,
}
const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png']

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export interface CaptureCenterProps {
  className?: string
  /** Chamado após encaminhar com sucesso (ex.: fechar o modal). */
  onDone?: () => void
  /** HUB-001: tipo declarado pelo usuário no Hub (pré-seleção). A classificação ainda refina em 2º plano. */
  initialKind?: DocumentKind | null
}

export default function CaptureCenter({ className = '', onDone, initialKind = null }: CaptureCenterProps) {
  const router = useRouter()
  const { user } = useUser()
  const supabase = useRef(createClient()).current
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [kind, setKind] = useState<DocumentKind | null>(initialKind)
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
    if (f.size > MAX_UPLOAD_BYTES) { setError(`Arquivo muito grande (limite ${MAX_UPLOAD_MB} MB).`); return }
    setFile(f)
    setPreviewUrl(f.type.startsWith('image/') ? URL.createObjectURL(f) : null)
    setAutoConfident(false)
    // A13 — categoria DECLARADA pelo usuário no Hub (initialKind) é soberana: NÃO deixar o palpite por
    // nome nem a classificação por conteúdo sobrescrevê-la ao anexar o arquivo (antes, "Atestado"/"Receita"
    // viravam "Exame"). Sem categoria declarada, mantém o comportamento de palpite/auto-classificação.
    if (initialKind) { setClassifying(false); return }
    // Palpite instantâneo pela camada barata do ContentClassifier (síncrono, sem rede).
    const guess = classifyCheap(f.type, f.name).kind
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
        // Obs 6 — só PRÉ-SELECIONA uma categoria de saúde a partir da VISÃO quando a classificação é de
        // ALTA confiança (corroborada na rota por um segundo sinal). Sem alta confiança, mantém o palpite
        // por nome (que pode ser nenhum) e trata como INCERTO: o usuário escolhe uma categoria ou cancela.
        // Impede que um único sinal de visão não corroborado pré-selecione uma categoria de saúde incorreta.
        if (cls.kind && cls.kind !== 'unknown' && cls.kind !== 'other'
            && cls.confidence === 'high'
            && processorsAccepting(f.type).some(p => p.kind === cls.kind)) {
          setKind(cls.kind)
          setAutoConfident(true)
        }
      } catch { /* mantém o palpite por nome */ } finally {
        setClassifying(false)
      }
    })()
  }, [initialKind])

  // Document Bundle (padrão transversal): imagens → 1 PDF → pickFile único.
  const bundle = useDocumentBundle(pickFile)

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null); setPreviewUrl(null); setKind(null); setError(null); setSending(false); setResult(null)
    setClassifying(false); setAutoConfident(false)
  }

  function cancel() {
    if (file) logCapture({ kind, suggested: classifyCheap(file.type, file.name).kind, outcome: 'cancelled' })
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
    const suggested = classifyCheap(file.type, file.name).kind
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
  // 'forwarded' (documento NÃO persistido) usa tom INFORMATIVO — nunca o "check" verde de sucesso:
  // impede a falsa confirmação de que o documento foi salvo (Obs 6b). Só 'success' (persistência
  // efetiva) recebe o selo de sucesso.
  if (result) {
    const tone = captureResultTone(result.status)
    const toneWrap = tone === 'error' ? 'bg-red-50' : tone === 'success' ? 'bg-blush' : 'bg-ivory border border-border'
    const ToneIcon = tone === 'error' ? AlertCircle : tone === 'success' ? CheckCircle : Info
    const toneIconClass = tone === 'error' ? 'text-red-500' : tone === 'success' ? 'text-petal' : 'text-mauve'
    return (
      <div className={className}>
        <div className="text-center py-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 ${toneWrap}`}>
            <ToneIcon size={24} className={toneIconClass} />
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
            {tone === 'error' ? (
              <button onClick={() => setResult(null)} className="px-4 py-2 rounded-full font-body text-sm text-petal hover:underline">Tentar novamente</button>
            ) : tone === 'success' ? (
              <button onClick={reset} className="px-4 py-2 rounded-full font-body text-sm text-mauve hover:text-onyx transition-colors">Adicionar outro</button>
            ) : (
              <button onClick={reset} className="px-4 py-2 rounded-full font-body text-sm text-mauve hover:text-onyx transition-colors">Cancelar</button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Inputs compartilhados (galeria multi + câmera) — a intake decide direto × staging. */}
      <input ref={inputRef} type="file" accept={ACCEPTED.join(',')} multiple className="hidden"
        onChange={e => { const fs = Array.from(e.target.files ?? []); e.target.value = ''; bundle.intake(fs) }} />
      <input ref={cameraRef} type="file" accept={supportedNowAcceptAttr()} capture="environment" className="hidden"
        onChange={e => { const fs = Array.from(e.target.files ?? []); e.target.value = ''; bundle.intake(fs) }} />

      {bundle.pages.length > 0 ? (
        <DocumentBundleStaging bundle={bundle} onAddCamera={() => cameraRef.current?.click()} onAddGallery={() => inputRef.current?.click()} />
      ) : !file ? (
        // ── Passo 1: selecionar / arrastar ──────────────────────────────────────
        <div>
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); bundle.intake(Array.from(e.dataTransfer.files ?? [])) }}
            onClick={() => inputRef.current?.click()}
            className={`rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${dragOver ? 'border-petal bg-blush/20' : 'border-border hover:border-petal/40'}`}
          >
            <UploadCloud size={28} className="text-petal mx-auto mb-2" />
            <p className="font-body text-sm text-onyx">Arraste um arquivo ou <span className="text-petal font-medium">selecione</span></p>
            <p className="font-body text-xs text-mauve mt-1">PDF, foto ou várias fotos do mesmo documento</p>
          </div>
          <button type="button" onClick={() => cameraRef.current?.click()}
            className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-petal/40 text-petal font-body text-sm font-medium hover:bg-blush transition-colors">
            <Camera size={16} /> Tirar foto ou escanear
          </button>
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
                ("afinando…"), sem bloquear. "Lendo…" só quando ainda não há palpite algum.
                Região aria-live: o leitor de tela anuncia a mudança de estado sem recarregar. */}
            <div aria-live="polite" aria-atomic="true">
            {kind && processorFor(kind) ? (
              <p className="font-body text-xs text-mauve mb-2 flex flex-wrap items-center gap-x-1.5">
                <span>
                  {autoConfident ? 'Identifiquei que é ' : 'Sugestão: parece ser '}
                  <strong>{processorFor(kind)!.label.toLowerCase()}</strong> — confirme ou corrija.
                </span>
                {classifying && (
                  <span className="inline-flex items-center gap-1 text-mauve"><Loader2 size={11} className="animate-spin" /> afinando…</span>
                )}
              </p>
            ) : classifying ? (
              <p className="font-body text-xs text-mauve mb-2 inline-flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Lendo o documento…</p>
            ) : null}
            </div>
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
