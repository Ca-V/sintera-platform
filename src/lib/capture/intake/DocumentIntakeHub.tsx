'use client'

// ============================================================
// Centro de Entrada — INTAKE (experiência da usuária) · componente REUTILIZÁVEL
// ============================================================
// Usado em várias superfícies (Dashboard, Exames, Medicamentos, Problemas de Saúde,
// Timeline, futuro mobile). A PÁGINA é apenas consumidora — a lógica vive aqui.
// V0: pergunta pela INTENÇÃO ("O que deseja adicionar?") e encaminha ao pipeline
// EXISTENTE. SEM IA, SEM domínio (não cria evento). Método de envio + prévia + envio
// no próprio hub = V0.1 (próximo incremento); auto-classificação por IA = V0.2.
// ============================================================

import { useRouter } from 'next/navigation'
import { FlaskConical, Pill, Glasses, Dna, FileText, ChevronRight } from 'lucide-react'
import { CAPTURE_PROCESSORS } from '../registry'
import type { DocumentKind } from '../types'

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  FlaskConical, Pill, Glasses, Dna, FileText,
}

export interface DocumentIntakeHubProps {
  className?: string
  /**
   * Chamado quando a usuária escolhe O QUE adicionar. O consumidor encaminha ao
   * pipeline (navegação/upload). Se ausente, o hub navega para o `target` do
   * processador. Mantém o hub desacoplado da superfície que o usa.
   */
  onChoose?: (kind: DocumentKind) => void
}

export default function DocumentIntakeHub({ className = '', onChoose }: DocumentIntakeHubProps) {
  const router = useRouter()

  function choose(kind: DocumentKind, target: string) {
    if (onChoose) onChoose(kind)
    else router.push(target)
  }

  return (
    <div className={className}>
      <p className="font-body text-sm font-semibold text-onyx mb-1">O que você deseja adicionar?</p>
      <p className="font-body text-xs text-mauve mb-4">Escolha o tipo de documento. Cada um segue para o fluxo correto.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {CAPTURE_PROCESSORS.map(p => {
          const Icon = ICONS[p.icon] ?? FileText
          return (
            <button
              key={p.kind}
              onClick={() => choose(p.kind, p.target)}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-border bg-ivory hover:border-petal/40 hover:bg-blush/10 transition-colors text-left group"
            >
              <span className="w-9 h-9 rounded-xl bg-blush flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-petal" />
              </span>
              <span className="font-body text-sm text-onyx flex-1">{p.label}</span>
              <ChevronRight size={16} className="text-mauve/30 group-hover:text-petal transition-colors flex-shrink-0" />
            </button>
          )
        })}

        {/* Outro documento — V0: ainda sem pipeline próprio */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-dashed border-border bg-ivory/50 text-left opacity-70"
          aria-disabled="true"
        >
          <span className="w-9 h-9 rounded-xl bg-ivory flex items-center justify-center flex-shrink-0">
            <FileText size={18} className="text-mauve/50" />
          </span>
          <span className="font-body text-sm text-mauve flex-1">Outro documento</span>
          <span className="font-body text-[10px] text-mauve/50 flex-shrink-0">em breve</span>
        </div>
      </div>
    </div>
  )
}
