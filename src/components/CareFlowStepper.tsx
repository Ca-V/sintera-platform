// EXA-C2 (NC-0011) — Stepper do fluxo assistencial do exame: Pedido → Agendamento → Realização → Resultado.
// Apenas APRESENTAÇÃO: recebe a etapa atual (resolvida no domínio por careStageFor/resolveCareStage) e
// destaca as etapas já alcançadas. Não decide nada — a lógica é pura e vive em @/lib/exams/careFlow.
'use client'

import { CARE_STAGES, stageReached, stageIndex, type CareStage } from '@/lib/exams/careFlow'
import { Check } from 'lucide-react'

export default function CareFlowStepper({ stage }: { stage: CareStage | null }) {
  // Sem nenhum sinal de fluxo (null) não há o que exibir — a UI é consequência do domínio, não decoração.
  if (stage == null) return null
  const currentIdx = stageIndex(stage)

  return (
    <div className="rounded-2xl border border-border bg-ivory px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-mauve mb-3">Fluxo do exame</p>
      <ol className="flex items-center gap-1" aria-label="Etapas do fluxo assistencial">
        {CARE_STAGES.map((s, i) => {
          const reached = stageReached(stage, s.key)
          const isCurrent = i === currentIdx
          return (
            <li key={s.key} className="flex flex-1 items-center gap-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5 min-w-0">
                <span
                  className={
                    'flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors ' +
                    (reached
                      ? 'border-petal bg-petal text-white'
                      : 'border-border bg-white text-mauve')
                  }
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {reached ? <Check size={14} strokeWidth={3} /> : i + 1}
                </span>
                <span
                  className={
                    'text-[11px] leading-tight text-center ' +
                    (isCurrent ? 'font-semibold text-onyx' : reached ? 'text-onyx/70' : 'text-mauve')
                  }
                >
                  {s.label}
                </span>
              </div>
              {i < CARE_STAGES.length - 1 && (
                <span
                  aria-hidden
                  className={
                    'h-0.5 flex-1 rounded-full ' +
                    (stageReached(stage, CARE_STAGES[i + 1].key) ? 'bg-petal' : 'bg-border')
                  }
                />
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
