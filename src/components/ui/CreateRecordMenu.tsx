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
import { Plus, Loader2, Upload, Camera, Pencil, X } from 'lucide-react'
import { Card } from '@/lib/ui/ds'
import { useDocumentBundle } from './DocumentBundleCapture'

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
  // Captura de documento multipágina pelo primitivo transversal (Bundle→CDU): imagens acumuladas
  // → 1 PDF → 1 registro. Uma implementação, reutilizada aqui e em todo ponto de captura.
  const bundle = useDocumentBundle((f) => onSelect('file', f))
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
        onDrop={e => {
          e.preventDefault(); if (!hasFile) return
          const fs = Array.from(e.dataTransfer.files ?? []); if (!fs.length) return
          bundle.intake(fs)
        }}
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

      {/* Painel de captura multipágina — imagens do MESMO documento → 1 PDF (primitivo Bundle). */}
      {bundle.pages.length > 0 && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => { if (!bundle.combining) bundle.reset() }} aria-hidden="true" />
          <Card padding="none" className="absolute right-0 top-full mt-2 z-30 w-72 p-3 space-y-2.5">
            <p className="font-body text-sm font-semibold text-onyx">
              Documento — {bundle.pages.length} página{bundle.pages.length !== 1 ? 's' : ''}
            </p>
            <div className="flex flex-wrap gap-2">
              {bundle.pages.map((f, i) => (
                <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(f)} alt={`Página ${i + 1}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => bundle.removeAt(i)}
                    aria-label={`Remover página ${i + 1}`}
                    className="absolute top-0 right-0 bg-black/50 text-white rounded-bl-md p-0.5 hover:bg-black/70">
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => cameraRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border font-body text-xs text-onyx hover:bg-blush transition-colors">
                <Camera size={14} className="text-petal" /> Adicionar página
              </button>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border font-body text-xs text-onyx hover:bg-blush transition-colors">
                <Upload size={14} className="text-petal" /> Da galeria
              </button>
            </div>
            <div className="flex gap-2 pt-0.5">
              <button type="button" onClick={() => bundle.reset()} disabled={bundle.combining}
                className="flex-1 py-2 rounded-xl font-body text-sm text-mauve hover:bg-blush transition-colors disabled:opacity-50">
                Cancelar
              </button>
              <button type="button" onClick={bundle.finish} disabled={bundle.combining}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-body text-sm font-medium text-white gradient-sintera hover:opacity-90 transition-opacity disabled:opacity-60">
                {bundle.combining ? <><Loader2 size={13} className="animate-spin" /> Montando…</> : `Concluir (${bundle.pages.length})`}
              </button>
            </div>
          </Card>
        </>
      )}

      {hasFile && (
        <input ref={fileRef} type="file" accept={fileAccept} multiple className="sr-only" disabled={busy}
          aria-label={fileLabel ?? 'Selecionar arquivo'}
          onChange={e => {
            const files = Array.from(e.target.files ?? []); e.target.value = ''
            bundle.intake(files) // PDF único → direto; imagens → montam o bundle (mesma regra transversal)
          }} />
      )}
      {hasCamera && (
        <input ref={cameraRef} type="file" accept={cameraAccept} capture="environment" className="sr-only" disabled={busy}
          aria-label="Tirar foto"
          onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) bundle.intake([f]) }} />
      )}
    </div>
  )
}
