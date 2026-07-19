'use client'

// ============================================================
// HUB-001 — Hub de Registro (ponto único de entrada da SINTERA)
// ============================================================
// "O que você deseja registrar?" — intenção PRIMEIRO, mecanismo depois. O usuário escolhe O QUE;
// a SINTERA decide COMO capturar. Infraestrutura TRANSVERSAL: não conhece regra de nenhum domínio.
// Reusa o Capture Center (documentos) e os formulários dos módulos (registros) — sem duplicar fluxo.
// Taxonomia = SSOT em @/lib/capture/registrationHub.
// ============================================================

import { useState, type ComponentType } from 'react'
import { useRouter } from 'next/navigation'
import {
  FlaskConical, ClipboardList, FileText, FileHeart, Dna, Pill, Leaf, Package, Glasses,
  Stethoscope, HeartPulse, Ruler, Sparkles, Scissors, Syringe, Thermometer, Receipt,
  ArrowLeft, ChevronRight, UploadCloud, ArrowUpRight,
} from 'lucide-react'
import CaptureCenter from '@/lib/capture/intake/CaptureCenter'
import { INTENT_GROUPS, intentsByGroup, type RegistrationIntent } from '@/lib/capture/registrationHub'
import type { DocumentKind } from '@/lib/capture/types'

type IconType = ComponentType<{ size?: number; className?: string }>
const ICONS: Record<string, IconType> = {
  FlaskConical, ClipboardList, FileText, FileHeart, Dna, Pill, Leaf, Package, Glasses,
  Stethoscope, HeartPulse, Ruler, Sparkles, Scissors, Syringe, Thermometer, Receipt,
}

type View =
  | { mode: 'menu' }
  | { mode: 'capture'; kind: DocumentKind | null }
  | { mode: 'choice'; intent: RegistrationIntent }

export default function RegistrationHub({ onDone }: { onDone?: () => void }) {
  const router = useRouter()
  const [view, setView] = useState<View>({ mode: 'menu' })

  function goToPage(href: string) { onDone?.(); router.push(href) }

  function choose(intent: RegistrationIntent) {
    if (!intent.available) return
    const m = intent.mechanism
    if (m.type === 'capture') setView({ mode: 'capture', kind: m.documentKind ?? null })
    else if (m.type === 'page') goToPage(m.href)
    else setView({ mode: 'choice', intent })
  }

  // ── Capture Center (documento), com volta ao menu ──────────────────────────
  if (view.mode === 'capture') {
    return (
      <div>
        <button type="button" onClick={() => setView({ mode: 'menu' })}
          className="inline-flex items-center gap-1.5 font-body text-xs text-mauve hover:text-onyx transition-colors mb-3">
          <ArrowLeft size={13} /> Voltar
        </button>
        <CaptureCenter initialKind={view.kind} onDone={onDone} />
      </div>
    )
  }

  // ── Escolha (ex.: Medicamento → enviar receita | cadastrar manualmente) ─────
  if (view.mode === 'choice') {
    const m = view.intent.mechanism
    if (m.type !== 'choice') return null
    return (
      <div>
        <button type="button" onClick={() => setView({ mode: 'menu' })}
          className="inline-flex items-center gap-1.5 font-body text-xs text-mauve hover:text-onyx transition-colors mb-3">
          <ArrowLeft size={13} /> Voltar
        </button>
        <p className="font-body text-sm font-semibold text-onyx mb-3">{view.intent.label} — como deseja registrar?</p>
        <div className="space-y-2">
          <button type="button" onClick={() => setView({ mode: 'capture', kind: m.captureKind })}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-border hover:border-petal/40 hover:bg-blush/30 transition-colors text-left">
            <UploadCloud size={18} className="text-petal flex-shrink-0" />
            <span className="font-body text-sm text-onyx flex-1">{m.captureLabel}</span>
            <ChevronRight size={15} className="text-mauve" />
          </button>
          <button type="button" onClick={() => goToPage(m.pageHref)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-border hover:border-petal/40 hover:bg-blush/30 transition-colors text-left">
            <Pill size={18} className="text-petal flex-shrink-0" />
            <span className="font-body text-sm text-onyx flex-1">{m.pageLabel}</span>
            <ArrowUpRight size={15} className="text-mauve" />
          </button>
        </div>
      </div>
    )
  }

  // ── Menu — "O que você deseja registrar?" (por natureza da informação) ──────
  return (
    <div>
      <p className="font-display text-lg font-semibold text-onyx mb-1">O que você deseja registrar?</p>
      <p className="font-body text-xs text-mauve mb-4">Escolha o que quer adicionar — a SINTERA cuida do resto.</p>
      <div className="space-y-4">
        {INTENT_GROUPS.map(({ group, label }) => (
          <div key={group}>
            <p className="font-body text-[11px] font-semibold text-mauve uppercase tracking-wider mb-2">{label}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {intentsByGroup(group).map(intent => {
                const Icon = ICONS[intent.icon] ?? FileText
                const disabled = !intent.available
                return (
                  <button key={intent.key} type="button" onClick={() => choose(intent)} disabled={disabled}
                    aria-label={intent.label + (disabled ? ' (em breve)' : '')}
                    className={`relative flex flex-col items-start gap-2 p-3 rounded-2xl border text-left transition-colors ${
                      disabled
                        ? 'border-border/60 bg-ivory/50 cursor-not-allowed'
                        : 'border-border bg-ivory hover:border-petal/40 hover:bg-blush/20'
                    }`}>
                    <Icon size={18} className={disabled ? 'text-mauve/40' : 'text-petal'} />
                    <span className={`font-body text-xs font-medium leading-tight ${disabled ? 'text-mauve/50' : 'text-onyx'}`}>{intent.label}</span>
                    {disabled && <span className="absolute top-2 right-2 font-body text-[9px] text-mauve/60 bg-mauve/10 rounded-full px-1.5 py-0.5">em breve</span>}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
