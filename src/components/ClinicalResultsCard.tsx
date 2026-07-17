// EXA-C3 (NC-0009) — Exibição GENÉRICA de resultados clínicos não-laboratoriais (CPE `clinical_results`).
// Lê o CONTRATO canônico UCDA (nunca o backend) e apresenta os itens sem NENHUMA lógica por modalidade —
// Convergência Progressiva: a UI não conhece Pentacam/ECG/etc., só o contrato. A presentação rica por
// modalidade (E6) permanece um passo futuro; aqui o dado clínico deixa de ser invisível.
'use client'

import { motion } from 'framer-motion'
import { FlaskConical } from 'lucide-react'
import { groupUcdaForDisplay, type UcdaRepresentation } from '@/lib/capture/ucda'
import MotionCard from '@/components/ui/MotionCard'

export default function ClinicalResultsCard({ rep }: { rep: UcdaRepresentation }) {
  const sections = groupUcdaForDisplay(rep)
  const total = rep.items.length
  if (total === 0) return null

  return (
    <MotionCard initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      padding="none" className="overflow-hidden">
      <div className="p-5 border-b border-border/50 flex items-center gap-2">
        <FlaskConical size={16} className="text-petal flex-shrink-0" />
        <h2 className="font-display text-base font-semibold text-onyx">Resultados estruturados</h2>
      </div>

      {sections.map((sec, si) => (
        <div key={sec.label ?? `__${si}`}>
          {sec.label && (
            <div className="px-5 py-2.5 bg-ivory border-b border-border/50">
              <h3 className="font-body text-xs font-semibold text-onyx/70 uppercase tracking-wider">{sec.label}</h3>
            </div>
          )}
          <div className="divide-y divide-border/30">
            {sec.items.map((it, i) => (
              <motion.div key={`${it.name}-${i}`}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.01 + i * 0.008 }}
                className="px-5 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-body text-sm font-medium text-onyx min-w-0">{it.name}</p>
                  <p className="font-body text-lg font-semibold text-onyx leading-tight flex-shrink-0">
                    {it.valueText || '—'}
                    {it.unit ? <span className="text-mauve text-sm font-normal ml-1">{it.unit}</span> : null}
                  </p>
                </div>
                {/* Referência (transcrita, não interpretativa) + método/contexto, quando o documento trouxe */}
                {(it.referenceText || it.method || it.context) && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                    {it.referenceText && (
                      <span className="font-body text-[11px] text-mauve">Referência informada: {it.referenceText}</span>
                    )}
                    {it.method && <span className="font-body text-[11px] text-mauve">Método: {it.method}</span>}
                    {it.context && <span className="font-body text-[11px] text-mauve">{it.context}</span>}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      <div className="px-5 py-3 bg-ivory border-t border-border/50">
        <p className="font-body text-xs text-mauve">
          {total} {total === 1 ? 'resultado estruturado' : 'resultados estruturados'} · estruturados a partir do documento
        </p>
      </div>
      <div className="px-5 py-3 border-t border-border/50 bg-ivory/60">
        <p className="font-body text-[11px] text-mauve leading-relaxed">
          Os valores e referências, <strong className="text-onyx/70">quando disponíveis</strong>, são reprodução do que
          consta no <strong className="text-onyx/70">documento de origem</strong> e podem variar conforme equipamento,
          método e referência científica. Esta informação organiza seus dados e <strong className="text-onyx/70">não
          substitui a avaliação médica</strong>.
        </p>
      </div>
    </MotionCard>
  )
}
