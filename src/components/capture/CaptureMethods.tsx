'use client'

// ============================================================
// CaptureMethods — botão "Novo X" + escolha do MÉTODO de cadastro (CAP-001)
// ============================================================
// Componente REUTILIZÁVEL (UX-001 §1.10/§1.11, CAP-001 §2.2/§2.9): a intenção
// primeiro ("Novo exame", "Novo medicamento ou suplemento"), o meio depois
// (enviar arquivo · tirar foto · [digitar manual] · [falar] · arrastar). Cada
// módulo apenas declara os meios; o comportamento é idêntico em toda a plataforma.
// Consumidores: Medicamentos, Exames e futuros (Recursos, Despesas, Agenda…).

import { useRef, useState, type ReactNode } from 'react'
import { Plus, Loader2, Upload, Camera, Pencil } from 'lucide-react'

const ITEM = 'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-blush text-left font-body text-sm text-onyx transition-colors'

export default function CaptureMethods({
  label,
  onFile,
  fileAccept = 'application/pdf,image/*',
  cameraAccept = 'image/*',
  busy = false,
  busyLabel = 'Enviando…',
  fileLabel = 'Enviar arquivo (PDF ou foto)',
  showCamera = true,
  onManual,
  children,
  className = '',
}: {
  /** Rótulo do botão — comunica a INTENÇÃO (ex.: "Novo exame"). */
  label: string
  /** Chamado com o arquivo escolhido (enviar arquivo · tirar foto · arrastar). */
  onFile: (file: File) => void
  fileAccept?: string
  cameraAccept?: string
  busy?: boolean
  busyLabel?: string
  fileLabel?: string
  showCamera?: boolean
  /** Se fornecido, mostra "Digitar manualmente". */
  onManual?: () => void
  /** Meios adicionais no menu (ex.: <VoiceInput/> "Falar"). */
  children?: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const pick = (f?: File | null) => { if (f) onFile(f) }

  return (
    <div className={`relative ${className}`}>
      <button type="button" onClick={() => setOpen(o => !o)}
        onDragOver={e => { e.preventDefault() }}
        onDrop={e => { e.preventDefault(); pick(e.dataTransfer.files?.[0]) }}
        className="flex items-center gap-2 px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium hover:opacity-90 transition-opacity">
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
        {busy ? busyLabel : label}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-full mt-2 z-30 w-64 card-premium p-2 space-y-0.5">
            <p className="font-body text-[11px] text-mauve/60 px-2 pt-1 pb-1.5">Como deseja cadastrar?</p>
            <button type="button" onClick={() => { setOpen(false); fileRef.current?.click() }} className={ITEM}>
              <Upload size={15} className="text-petal flex-shrink-0" /> {fileLabel}
            </button>
            {showCamera && (
              <button type="button" onClick={() => { setOpen(false); cameraRef.current?.click() }} className={ITEM}>
                <Camera size={15} className="text-petal flex-shrink-0" /> Tirar foto
              </button>
            )}
            {onManual && (
              <button type="button" onClick={() => { setOpen(false); onManual() }} className={ITEM}>
                <Pencil size={15} className="text-petal flex-shrink-0" /> Digitar manualmente
              </button>
            )}
            {children && <div onClick={() => setOpen(false)}>{children}</div>}
          </div>
        </>
      )}

      {/* Inputs ocultos: enviar arquivo (PDF/imagem) e tirar foto (câmera no mobile) */}
      <input ref={fileRef} type="file" accept={fileAccept} className="sr-only" disabled={busy}
        onChange={e => { pick(e.target.files?.[0]); e.target.value = '' }} />
      {showCamera && (
        <input ref={cameraRef} type="file" accept={cameraAccept} capture="environment" className="sr-only" disabled={busy}
          onChange={e => { pick(e.target.files?.[0]); e.target.value = '' }} />
      )}
    </div>
  )
}
