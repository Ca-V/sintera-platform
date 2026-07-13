'use client'

// Primitivo TRANSVERSAL de captura multipágina (Capture Hub / Document Bundle).
// Padrão único aplicado em TODOS os pontos de "anexar/adicionar imagem ou documento"
// (fundadora): várias fotos/imagens do MESMO documento → 1 PDF → 1 registro. PDF ou
// arquivo único seguem direto. Uma implementação, reutilizada em todo lugar.
import { useState } from 'react'
import { Camera, Upload, Loader2, X } from 'lucide-react'

const isImg = (f: File) => f.type.startsWith('image/')
const isPdf = (f: File) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name)

export interface MultiPageCapture {
  pages: File[]
  combining: boolean
  /** Recebe os arquivos escolhidos (input/câmera/drop). PDF → onComplete direto; imagens → staging. */
  intake: (files: File[]) => void
  /** Junta as imagens em 1 PDF (ou passa a única) e chama onComplete. */
  finish: () => Promise<void>
  removeAt: (i: number) => void
  reset: () => void
}

export function useMultiPageCapture(onComplete: (file: File) => void): MultiPageCapture {
  const [pages, setPages] = useState<File[]>([])
  const [combining, setCombining] = useState(false)

  const intake = (files: File[]) => {
    if (!files.length) return
    if (pages.length > 0) { setPages(p => [...p, ...files.filter(isImg)]); return }
    const pdf = files.find(isPdf)
    if (pdf) { onComplete(pdf); return }              // PDF já é multipágina
    const imgs = files.filter(isImg)
    if (imgs.length) { setPages(imgs); return }        // imagens → staging (permite adicionar mais)
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

  return { pages, combining, intake, finish, removeAt: (i) => setPages(p => p.filter((_, j) => j !== i)), reset: () => setPages([]) }
}

/** UI de staging — miniaturas + "Adicionar página" + "Concluir". Reutilizável. */
export function MultiPageStaging({
  cap, onAddCamera, onAddGallery, className = '',
}: {
  cap: MultiPageCapture
  onAddCamera: () => void
  onAddGallery: () => void
  className?: string
}) {
  if (cap.pages.length === 0) return null
  return (
    <div className={`border-2 border-petal/40 rounded-2xl p-4 bg-blush/30 space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <p className="font-display text-base font-semibold text-onyx">
          Documento — {cap.pages.length} página{cap.pages.length !== 1 ? 's' : ''}
        </p>
        <button type="button" onClick={cap.reset} disabled={cap.combining} aria-label="Cancelar"
          className="text-mauve hover:text-onyx disabled:opacity-50"><X size={17} /></button>
      </div>
      <div className="flex flex-wrap gap-2">
        {cap.pages.map((f, i) => (
          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={URL.createObjectURL(f)} alt={`Página ${i + 1}`} className="w-full h-full object-cover" />
            <button type="button" onClick={() => cap.removeAt(i)} aria-label={`Remover página ${i + 1}`}
              className="absolute top-0 right-0 bg-black/50 text-white rounded-bl-md p-0.5 hover:bg-black/70"><X size={11} /></button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onAddCamera} disabled={cap.combining}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-white font-body text-sm text-onyx hover:bg-blush disabled:opacity-50">
          <Camera size={15} className="text-petal" /> Adicionar página
        </button>
        <button type="button" onClick={onAddGallery} disabled={cap.combining}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-white font-body text-sm text-onyx hover:bg-blush disabled:opacity-50">
          <Upload size={15} className="text-petal" /> Galeria
        </button>
        <button type="button" onClick={cap.finish} disabled={cap.combining}
          className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl gradient-sintera text-white font-body text-sm font-medium hover:opacity-90 disabled:opacity-60">
          {cap.combining ? <><Loader2 size={14} className="animate-spin" /> Montando…</> : `Concluir (${cap.pages.length} pág.)`}
        </button>
      </div>
    </div>
  )
}
