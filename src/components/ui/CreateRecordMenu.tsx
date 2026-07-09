'use client'

// ============================================================
// CreateRecordMenu — MENU DE CRIAÇÃO DE REGISTROS (componente oficial DS-001)
// ============================================================
// NÃO é um menu de upload — é o menu de CRIAÇÃO DE REGISTROS da plataforma.
// TRANSVERSAL e AGNÓSTICO de domínio: não conhece Medicamentos, Exames nem nada.
// O módulo apenas DECLARA quais métodos quer (`methods` + `extras` + `voice`) e
// recebe de volta QUAL foi escolhido (`onSelect`) — quem decide o que fazer é o módulo.
//
//   Como deseja cadastrar?  (ordem FIXA em toda a plataforma — memória muscular)
//     📄 Selecionar arquivo (PDF ou foto)   → onSelect('file', file)
//     📷 Tirar foto                         → onSelect('camera', file)
//     ⌨️  Digitar manualmente               → onSelect('manual')
//     🎤 Falar                              → slot `voice` (interativo)
//     … extras (Centro de Captura, Apple Health, WhatsApp…) → onSelect(key)
//
// Regra: 2+ métodos → menu; 1 único → aciona direto. Novos métodos entram só por
// CONFIGURAÇÃO (extras), sem alterar a estrutura. Herda UX-001 §1.10/§1.11, DS-001.

import { useRef, useState, type ReactNode, type ComponentType } from 'react'
import { Plus, Loader2, Upload, Camera, Pencil } from 'lucide-react'
import Card from './Card'

type IconType = ComponentType<{ size?: number; className?: string }>
export type RecordMethod = 'file' | 'camera' | 'manual'
export interface ExtraMethod { key: string; label: string; icon?: IconType }

// Definições dos meios padrão (rótulo + ícone). A ORDEM é fixa (ORDER), nunca varia.
const STD: Record<RecordMethod, { label: string; icon: IconType }> = {
  file:   { label: 'Selecionar arquivo (PDF ou foto)', icon: Upload },
  camera: { label: 'Tirar foto', icon: Camera },
  manual: { label: 'Digitar manualmente', icon: Pencil },
}
const ORDER: RecordMethod[] = ['file', 'camera', 'manual']
const ITEM = 'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-blush text-left font-body text-sm text-onyx transition-colors'

export default function CreateRecordMenu({
  label,
  onSelect,
  methods = ['file', 'camera'],
  extras = [],
  voice,
  fileAccept = 'application/pdf,image/*',
  cameraAccept = 'image/*',
  fileLabel,
  busy = false,
  busyLabel = 'Enviando…',
  className = '',
}: {
  /** Rótulo do botão — comunica a INTENÇÃO (ex.: "Novo exame"). */
  label: string
  /** Devolve o método escolhido; `file` presente em 'file'/'camera'. O MÓDULO decide o resto. */
  onSelect: (method: string, file?: File) => void
  /** Meios padrão disponíveis (renderizados sempre na ordem canônica, nunca reordenados). */
  methods?: RecordMethod[]
  /** Meios adicionais por configuração (crescimento futuro) → onSelect(key). */
  extras?: ExtraMethod[]
  /** Elemento interativo de voz (ex.: <VoiceInput/>), renderizado como "Falar". */
  voice?: ReactNode
  fileAccept?: string
  cameraAccept?: string
  /** Sobrescreve o rótulo de "Selecionar arquivo" (raro). */
  fileLabel?: string
  busy?: boolean
  busyLabel?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const std = ORDER.filter(m => methods.includes(m))
  const total = std.length + (voice ? 1 : 0) + extras.length
  const single = total === 1

  const trigger = (m: RecordMethod) => {
    if (m === 'file') fileRef.current?.click()
    else if (m === 'camera') cameraRef.current?.click()
    else onSelect(m)
  }
  const onPrimary = () => {
    if (!single) { setOpen(o => !o); return }
    if (std.length === 1) trigger(std[0])
    else if (extras.length === 1) onSelect(extras[0].key)
    else setOpen(true) // voz única (interativa) → abre o menu
  }

  const hasFile = methods.includes('file')
  const hasCamera = methods.includes('camera')

  return (
    <div className={`relative ${className}`}>
      <button type="button" onClick={onPrimary}
        aria-haspopup={single ? undefined : 'menu'} aria-expanded={single ? undefined : open}
        onDragOver={e => { e.preventDefault() }}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f && hasFile) onSelect('file', f) }}
        className="flex items-center gap-2 px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium hover:opacity-90 transition-opacity">
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
        {busy ? busyLabel : label}
      </button>

      {open && !single && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} aria-hidden="true" />
          <Card padding="none" className="absolute right-0 top-full mt-2 z-30 w-64 p-2 space-y-0.5">
            <p className="font-body text-[11px] text-mauve px-2 pt-1 pb-1.5">Como deseja cadastrar?</p>
            {std.map(m => {
              const Icon = STD[m].icon
              return (
                <button key={m} type="button" onClick={() => { setOpen(false); trigger(m) }} className={ITEM}>
                  <Icon size={15} className="text-petal flex-shrink-0" /> {m === 'file' && fileLabel ? fileLabel : STD[m].label}
                </button>
              )
            })}
            {voice && <div onClick={() => setOpen(false)}>{voice}</div>}
            {extras.map(x => {
              const Icon = x.icon ?? Upload
              return (
                <button key={x.key} type="button" onClick={() => { setOpen(false); onSelect(x.key) }} className={ITEM}>
                  <Icon size={15} className="text-petal flex-shrink-0" /> {x.label}
                </button>
              )
            })}
          </Card>
        </>
      )}

      {hasFile && (
        <input ref={fileRef} type="file" accept={fileAccept} className="sr-only" disabled={busy}
          aria-label={fileLabel ?? 'Selecionar arquivo'}
          onChange={e => { const f = e.target.files?.[0]; if (f) onSelect('file', f); e.target.value = '' }} />
      )}
      {hasCamera && (
        <input ref={cameraRef} type="file" accept={cameraAccept} capture="environment" className="sr-only" disabled={busy}
          aria-label="Tirar foto"
          onChange={e => { const f = e.target.files?.[0]; if (f) onSelect('camera', f); e.target.value = '' }} />
      )}
    </div>
  )
}
