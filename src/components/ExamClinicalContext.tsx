'use client'

// "O que é este exame?" — SUPERFÍCIE de consumo do Clinical Knowledge Service (C6). Lê o endpoint read-only
// /api/exams/[id]/clinical-context e apresenta o contexto clínico CONFIÁVEL e RASTREÁVEL do exame reconhecido:
// descrição, finalidade, indicações, periodicidade, especialidade, órgão/sistema, nível de evidência e FONTES.
// Fronteira RDC-657: descreve o EXAME, nunca interpreta o resultado da usuária. Sem curadoria → não renderiza nada.
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Info } from 'lucide-react'
import type { ClinicalKnowledge } from '@/lib/clinical-knowledge/clinical-knowledge-service'
import type { ClinicalContext } from '@/lib/clinical-pipeline/contracts'

type Response =
  | { available: false }
  | { available: true; knowledge: ClinicalKnowledge; context: ClinicalContext }

/** Formata YYYY-MM-DD como DD/MM/AAAA sem depender de fuso (a data é um fato de proveniência, não um instante). */
function fmtReviewed(iso: string | null): string | null {
  if (!iso) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso
}

/** Bloco rotulado de texto — um campo educativo com seu rótulo. */
function Field({ label, children, partial }: { label: string; children: React.ReactNode; partial?: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <p className="font-body text-[11px] font-semibold text-onyx/50 uppercase tracking-wider">{label}</p>
        {partial && (
          <span className="font-body text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
            consenso parcial
          </span>
        )}
      </div>
      <p className="font-body text-sm text-onyx/80 leading-relaxed mt-0.5">{children}</p>
    </div>
  )
}

export default function ExamClinicalContext({ examId }: { examId: string }) {
  const [data, setData] = useState<Response | null>(null)

  useEffect(() => {
    let alive = true
    fetch(`/api/exams/${examId}/clinical-context`)
      .then(r => (r.ok ? r.json() : { available: false }))
      .then((d: Response) => { if (alive) setData(d) })
      .catch(() => { if (alive) setData({ available: false }) })
    return () => { alive = false }
  }, [examId])

  // Sem contexto curado para este exame → não polui a tela (o conteúdo evolui progressivamente).
  if (!data || !data.available) return null

  const { knowledge: k, context: ctx } = data
  const reviewed = fmtReviewed(ctx.lastReviewed)

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
      <div className="rounded-2xl border border-border bg-white p-6">
        {/* Cabeçalho */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-9 h-9 rounded-xl bg-blush flex items-center justify-center flex-shrink-0">
            <BookOpen size={18} className="text-petal" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-onyx">O que é este exame?</h2>
            <p className="font-body text-xs text-mauve">{k.canonicalName.value}</p>
          </div>
        </div>

        {/* Descrição padronizada */}
        <p className="font-body text-sm text-onyx/80 leading-relaxed mt-3">{k.description.value}</p>

        {/* Campos educativos */}
        <div className="mt-4 space-y-3">
          <Field label="Para que serve">{k.purpose.value}</Field>
          <Field label="Quando costuma ser indicado">{k.whenIndicated.value}</Field>
          <Field label="Periodicidade sugerida" partial={k.suggestedPeriodicity.consensus === 'partial'}>
            {k.suggestedPeriodicity.value}
          </Field>
        </div>

        {/* Fatos rápidos */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 pt-4 border-t border-border/60">
          <div>
            <p className="font-body text-[11px] font-semibold text-onyx/50 uppercase tracking-wider">Especialidade</p>
            <p className="font-body text-sm text-onyx/80">{k.specialty.value}</p>
          </div>
          <div>
            <p className="font-body text-[11px] font-semibold text-onyx/50 uppercase tracking-wider">Órgão / sistema</p>
            <p className="font-body text-sm text-onyx/80">{k.bodySystem.value}</p>
          </div>
          <div>
            <p className="font-body text-[11px] font-semibold text-onyx/50 uppercase tracking-wider">Nível de evidência</p>
            <p className="font-body text-sm text-onyx/80">{k.evidenceLevel.value}</p>
          </div>
        </div>

        {/* Proveniência + fronteira RDC-657 */}
        <div className="mt-4 pt-4 border-t border-border/60 space-y-1.5">
          {ctx.sources.length > 0 && (
            <p className="font-body text-[11px] text-mauve">
              <span className="font-semibold text-onyx/60">Fontes:</span> {ctx.sources.join(' · ')}
              {reviewed ? <> · <span className="font-semibold text-onyx/60">revisado em</span> {reviewed}</> : null}
            </p>
          )}
          <div className="flex items-start gap-1.5">
            <Info size={12} className="text-mauve flex-shrink-0 mt-0.5" />
            <p className="font-body text-[11px] text-mauve leading-relaxed">
              Conteúdo educativo sobre o exame, com base em fontes reconhecidas. Não interpreta o seu resultado
              nem substitui avaliação médica.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
