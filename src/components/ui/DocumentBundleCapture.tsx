'use client'

// Primitivo TRANSVERSAL de captura — constrói um DOCUMENT BUNDLE (Capture Hub / CEF).
// A responsabilidade NÃO é "capturar várias páginas" (isso é só um caso particular): é
// montar UM documento clínico a partir de páginas/fontes heterogêneas (fotos, PDFs,
// galeria e, no futuro, WhatsApp, e-mail, links → PDF). O Bundle é a unidade FÍSICA de
// entrada; o pipeline consome depois um CapturedDocument (unidade LÓGICA normalizada).
// Uma implementação, reutilizada em todo ponto de "anexar/adicionar documento".
import { useState } from 'react'
import { Camera, Upload, Loader2, X, ChevronLeft, ChevronRight } from 'lucide-react'

const isImg = (f: File) => f.type.startsWith('image/')
const isPdf = (f: File) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name)

export interface DocumentBundle {
  pages: File[]
  combining: boolean
  /** Recebe os arquivos escolhidos. PDF único → onComplete direto; imagens → montam o bundle. */
  intake: (files: File[]) => void
  /** Junta as páginas (na ordem atual) em 1 PDF (ou passa a única) e chama onComplete. */
  finish: () => Promise<void>
  removeAt: (i: number) => void
  /** Move a página i em `dir` (-1 esquerda / +1 direita) — reordenar antes do OCR. */
  move: (i: number, dir: -1 | 1) => void
  reset: () => void
}

export function useDocumentBundle(onComplete: (file: File) => void): DocumentBundle {
  const [pages, setPages] = useState<File[]>([])
  const [combining, setCombining] = useState(false)

  const intake = (files: File[]) => {
    if (!files.length) return
    if (pages.length > 0) { setPages(p => [...p, ...files.filter(isImg)]); return }
    const pdf = files.find(isPdf)
    if (pdf) { onComplete(pdf); return }
    const imgs = files.filter(isImg)
    if (imgs.length) { setPages(imgs); return }
    onComplete(files[0])
  }

  const finish = async () => {
    if (!pages.length || combining) return
    if (pages.length === 1) { const f = pages[0]; setPages([]); onComplete(f); return }
    setCombining(true)
    try {
      const { imagesToPdf } = await import('@/lib/capture/images-to-pdf')
      const pdf = await imagesToPdf(pages, 'documento.pdf')
      setPages([]); onComplete(pdf)
    } catch { const f = pages[0]; setPages([]); onComplete(f) }
    finally { setCombining(false) }
  }

  const move = (i: number, dir: -1 | 1) => setPages(p => {
    const j = i + dir
    if (j < 0 || j >= p.length) return p
    const n = [...p]; [n[i], n[j]] = [n[j], n[i]]; return n
  })

  return { pages, combining, intake, finish, removeAt: (i) => setPages(p => p.filter((_, j) => j !== i)), move, reset: () => setPages([]) }
}

/** UI de montagem do bundle — miniaturas (reordenar/remover) + adicionar + concluir. */
export function DocumentBundleStaging({
  bundle, onAddCamera, onAddGallery, className = '',
}: {
  bundle: DocumentBundle
  onAddCamera: () => void
  onAddGallery: () => void
  className?: string
}) {
  if (bundle.pages.length === 0) return null
  return (
    <div className={`border-2 border-petal/40 rounded-2xl p-4 bg-blush/30 space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <p className="font-display text-base font-semibold text-onyx">
          Documento — {bundle.pages.length} página{bundle.pages.length !== 1 ? 's' : ''}
        </p>
        <button type="button" onClick={bundle.reset} disabled={bundle.combining} aria-label="Cancelar"
          className="text-mauve hover:text-onyx disabled:opacity-50"><X size={17} /></button>
      </div>
      {bundle.pages.length > 1 && (
        <p className="font-body text-[11px] text-mauve">Use ‹ › para reordenar as páginas antes de concluir.</p>
      )}
      <div className="flex flex-wrap gap-2">
        {bundle.pages.map((f, i) => (
          <div key={i} className="relative w-16 h-20 rounded-lg overflow-hidden border border-border bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={URL.createObjectURL(f)} alt={`Página ${i + 1}`} className="w-full h-14 object-cover" />
            <span className="absolute top-0 left-0 bg-black/50 text-white text-[10px] px-1 rounded-br-md">{i + 1}</span>
            <button type="button" onClick={() => bundle.removeAt(i)} aria-label={`Remover página ${i + 1}`}
              className="absolute top-0 right-0 bg-black/50 text-white rounded-bl-md p-0.5 hover:bg-black/70"><X size={11} /></button>
            <div className="absolute bottom-0 inset-x-0 h-6 flex items-center justify-between px-0.5">
              <button type="button" onClick={() => bundle.move(i, -1)} disabled={i === 0 || bundle.combining}
                aria-label={`Mover página ${i + 1} para a esquerda`}
                className="text-onyx/70 hover:text-petal disabled:opacity-30"><ChevronLeft size={15} /></button>
              <button type="button" onClick={() => bundle.move(i, 1)} disabled={i === bundle.pages.length - 1 || bundle.combining}
                aria-label={`Mover página ${i + 1} para a direita`}
                className="text-onyx/70 hover:text-petal disabled:opacity-30"><ChevronRight size={15} /></button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onAddCamera} disabled={bundle.combining}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-white font-body text-sm text-onyx hover:bg-blush disabled:opacity-50">
          <Camera size={15} className="text-petal" /> Adicionar página
        </button>
        <button type="button" onClick={onAddGallery} disabled={bundle.combining}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-white font-body text-sm text-onyx hover:bg-blush disabled:opacity-50">
          <Upload size={15} className="text-petal" /> Galeria
        </button>
        <button type="button" onClick={bundle.finish} disabled={bundle.combining}
          className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl gradient-sintera text-white font-body text-sm font-medium hover:opacity-90 disabled:opacity-60">
          {bundle.combining ? <><Loader2 size={14} className="animate-spin" /> Montando…</> : `Concluir (${bundle.pages.length} pág.)`}
        </button>
      </div>
    </div>
  )
}
