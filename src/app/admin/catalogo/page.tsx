'use client'

// Painel de curadoria do catálogo de biomarcadores.
// Objetivo: dar visibilidade do MAPEAMENTO LOINC (interoperabilidade) — o que já
// foi mapeado e o que falta — para apoiar a curadoria humana futura. Ver
// docs/clinical/GOVERNANCA-CIENTIFICA.md §1.2 e §5.
//
// NÃO edita conteúdo clínico nem LOINC aqui (o preenchimento é curadoria
// validada). É somente leitura + preview educativo (MedlinePlus) por linha já
// mapeada. Acesso restrito ao e-mail operacional.

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, FlaskConical, BookOpen, ChevronDown, ExternalLink, AlertTriangle, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import { CLINICAL_RULESET } from '@/lib/ai/insights/rules.clinical'
import { activeRulesOnly } from '@/lib/ai/insights/engine'

const ADMIN_EMAIL = 'carinaleite.br@gmail.com'

// Códigos com regra clínica ATIVA (aprovada). Hoje vazio por desenho — nenhuma
// regra aprovada. Ver docs/clinical/GOVERNANCA-CIENTIFICA.md §2-3.
const ACTIVE_RULE_CODES = new Set(activeRulesOnly(CLINICAL_RULESET).map(r => r.catalogCode))

interface CatalogRow {
  code: string
  display_name: string
  category: string
  specimen: string
  is_critical: boolean
  loinc_code: string | null
  snomed_ct_code: string | null
}

/** Rótulo de conteúdo disponível para o biomarcador (gestão de produto). */
function coverageLabel(r: CatalogRow): string {
  const hasRule = ACTIVE_RULE_CODES.has(r.code)
  const hasEdu = !!r.loinc_code // MedlinePlus depende do LOINC mapeado
  if (hasRule && hasEdu) return 'MedlinePlus + Regra'
  if (hasRule) return 'Regra'
  if (hasEdu) return 'MedlinePlus'
  return 'Nenhum'
}

interface MedlineTopic { title: string; url: string; summary: string | null }

const CATEGORY_LABELS: Record<string, string> = {
  hematologia_vermelha: 'Hematologia vermelha',
  hematologia_branca_plaquetas: 'Hematologia branca / plaquetas',
  coagulacao: 'Coagulação',
  metabolismo_ferro: 'Metabolismo do ferro',
  metabolismo_glicose: 'Metabolismo da glicose',
  funcao_tireoidiana: 'Função tireoidiana',
  inflamacao_imunologia: 'Inflamação / imunologia',
  funcao_hepatica_proteinas: 'Função hepática / proteínas',
  funcao_renal_eletrolitos: 'Função renal / eletrólitos',
  urina_24h: 'Urina 24h',
  vitaminas_minerais: 'Vitaminas e minerais',
  hormonios_sexuais_reprodutivo: 'Hormônios sexuais / reprodutivo',
  cardiometabolico: 'Cardiometabólico',
  urinalise_eas: 'Urinálise (EAS)',
}

function CoverageChip({ label, on, title }: { label: string; on: boolean; title?: string }) {
  return (
    <span title={title}
      className={`inline-flex items-center gap-0.5 font-body text-[10px] rounded-full px-1.5 py-0.5 border ${
        on ? 'text-sage bg-sage-light border-sage/20' : 'text-mauve/40 bg-ivory border-border'
      }`}>
      {on ? <Check size={9} /> : <X size={9} />} {label}
    </span>
  )
}

function EducationPreview({ code }: { code: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [topics, setTopics] = useState<MedlineTopic[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function toggle() {
    if (open) { setOpen(false); return }
    setOpen(true)
    if (topics !== null) return // já carregado
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/education/biomarker/${encodeURIComponent(code)}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao buscar')
      setTopics((json.topics ?? []) as MedlineTopic[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-2">
      <button onClick={toggle}
        className="flex items-center gap-1.5 font-body text-[11px] text-mauve hover:text-petal transition-colors">
        <BookOpen size={12} />
        Material educativo (MedlinePlus)
        <ChevronDown size={12} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
      </button>
      {open && (
        <div className="mt-2 pl-4 border-l-2 border-border/40 space-y-2">
          {loading && <p className="font-body text-[11px] text-mauve/60 flex items-center gap-1.5"><Loader2 size={11} className="animate-spin" /> Buscando…</p>}
          {error && <p className="font-body text-[11px] text-red-400">{error}</p>}
          {!loading && !error && topics?.length === 0 && (
            <p className="font-body text-[11px] text-mauve/50">Sem conteúdo do MedlinePlus para este código.</p>
          )}
          {topics?.map((t, i) => (
            <a key={i} href={t.url} target="_blank" rel="noopener noreferrer"
              className="block group">
              <span className="font-body text-[11px] font-medium text-onyx group-hover:text-petal inline-flex items-center gap-1">
                {t.title} <ExternalLink size={10} />
              </span>
              {t.summary && <span className="block font-body text-[11px] text-mauve/70 line-clamp-2">{t.summary}</span>}
            </a>
          ))}
          <p className="font-body text-[10px] text-mauve/40 pt-1">Referência educativa externa (NIH/MedlinePlus, en/es). Não interpreta resultados.</p>
        </div>
      )}
    </div>
  )
}

export default function CatalogoAdminPage() {
  const { user, loading: authLoading } = useUser()
  const router = useRouter()
  const supabase = useRef(createClient()).current

  const [rows, setRows] = useState<CatalogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'mapped' | 'unmapped'>('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('biomarker_catalog')
        .select('code, display_name, category, specimen, is_critical, loinc_code, snomed_ct_code')
        .order('category', { ascending: true })
        .order('display_name', { ascending: true })
      setRows((data ?? []) as CatalogRow[])
    } catch (e) {
      console.error('[admin/catalogo] load error:', e)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (!authLoading && (!user || user.email !== ADMIN_EMAIL)) router.replace('/dashboard')
  }, [user, authLoading, router])

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) load()
  }, [user, load])

  if (authLoading || !user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Loader2 size={28} className="animate-spin text-petal" />
      </div>
    )
  }

  const total = rows.length
  const mapped = rows.filter(r => r.loinc_code).length
  const unmapped = total - mapped
  const pct = total > 0 ? Math.round((mapped / total) * 100) : 0
  const snomedMapped = rows.filter(r => r.snomed_ct_code).length
  const withRule = rows.filter(r => ACTIVE_RULE_CODES.has(r.code)).length
  const complete = rows.filter(r => r.loinc_code && ACTIVE_RULE_CODES.has(r.code)).length

  const visible = rows.filter(r =>
    filter === 'all' ? true : filter === 'mapped' ? !!r.loinc_code : !r.loinc_code
  )

  // Agrupa por categoria para leitura.
  const byCategory = visible.reduce<Record<string, CatalogRow[]>>((acc, r) => {
    (acc[r.category] ??= []).push(r)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-cream px-6 py-10">
      <div className="max-w-4xl mx-auto space-y-7">

        <div>
          <h1 className="font-display text-2xl font-semibold text-onyx mb-1">Catálogo de biomarcadores</h1>
          <p className="font-body text-sm text-mauve">Mapeamento LOINC (interoperabilidade) — apoio à curadoria. Somente leitura.</p>
        </div>

        {/* Resumo do mapeamento */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-premium p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FlaskConical size={16} className="text-petal" />
              <span className="font-body text-sm font-semibold text-onyx">Cobertura LOINC</span>
            </div>
            <span className="font-display text-xl font-bold text-onyx">{mapped}/{total}</span>
          </div>
          <div className="h-2 bg-border/30 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-petal transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="font-body text-xs text-mauve mt-2">
            {mapped === 0
              ? 'Nenhum biomarcador mapeado ainda — preenchimento é curadoria humana validada (LOINC/SNOMED não são interpretação clínica).'
              : `${pct}% mapeados · ${unmapped} pendente${unmapped !== 1 ? 's' : ''}.`}
          </p>

          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border/40">
            {[
              ['SNOMED CT', `${snomedMapped}/${total}`],
              ['Com regra ativa', `${withRule}/${total}`],
              ['Experiência completa', `${complete}/${total}`],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="font-display text-lg font-bold text-onyx">{value}</p>
                <p className="font-body text-[11px] text-mauve/60">{label}</p>
              </div>
            ))}
          </div>
          <p className="font-body text-[10px] text-mauve/40 mt-2">
            &quot;Experiência completa&quot; = biomarcador com LOINC mapeado + regra clínica aprovada. Hoje 0 — depende do Responsável Clínico.
          </p>
        </motion.div>

        {/* Filtros */}
        <div className="flex items-center gap-2">
          {([['all', `Todos (${total})`], ['mapped', `Mapeados (${mapped})`], ['unmapped', `Pendentes (${unmapped})`]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`font-body text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filter === key ? 'border-petal text-petal bg-blush/40' : 'border-border text-mauve hover:border-petal/40'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-petal" /></div>
        ) : (
          <div className="space-y-6">
            {Object.entries(byCategory).map(([cat, items]) => (
              <div key={cat} className="card-premium overflow-hidden">
                <div className="px-5 py-3 border-b border-border/40 flex items-center justify-between">
                  <h2 className="font-body text-sm font-semibold text-onyx">{CATEGORY_LABELS[cat] ?? cat}</h2>
                  <span className="font-body text-[11px] text-mauve/60">{items.length}</span>
                </div>
                <div className="divide-y divide-border/20">
                  {items.map(r => (
                    <div key={r.code} className="px-5 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-body text-sm text-onyx">{r.display_name}</span>
                            {r.is_critical && (
                              <span className="inline-flex items-center gap-1 font-body text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5">
                                <AlertTriangle size={9} /> crítico
                              </span>
                            )}
                          </div>
                          <p className="font-body text-[11px] text-mauve/50 mt-0.5">{r.code} · {r.specimen}</p>
                          {r.loinc_code && <EducationPreview code={r.code} />}
                        </div>
                        <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <CoverageChip label="LOINC" on={!!r.loinc_code} title={r.loinc_code ?? undefined} />
                            <CoverageChip label="SNOMED" on={!!r.snomed_ct_code} title={r.snomed_ct_code ?? undefined} />
                            <CoverageChip label="Regra" on={ACTIVE_RULE_CODES.has(r.code)} />
                          </div>
                          <span className={`font-body text-[10px] ${coverageLabel(r) === 'Nenhum' ? 'text-mauve/40' : 'text-petal'}`}>
                            {coverageLabel(r)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
