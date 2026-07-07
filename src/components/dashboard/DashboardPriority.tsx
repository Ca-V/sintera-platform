'use client'

// ============================================================
// Dashboard por PRIORIDADE — primeira integração (validação dos componentes)
// ============================================================
// Composição APRESENTAÇÃO PURA: recebe dados por props (projeções já lidas a
// montante) e monta as seções na ordem de prioridade. Não acessa banco/domínio.
// Objetivo: validar ItemCard · EventCard · SituationCard em uma tela real.
// ============================================================

import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import ItemCard from '@/components/ui/ItemCard'
import EventCard from '@/components/ui/EventCard'
import SituationCard from '@/components/ui/SituationCard'
import StateView from '@/components/ui/StateView'
import type { SituationTone } from '@/lib/ui/situation'
import type { EventNature } from '@/lib/ui/event'
import { CloudUpload, ShoppingCart, FlaskConical, Pill, Watch, Stethoscope } from 'lucide-react'

/** Estado por bloco (não global): cada seção resolve seu próprio ciclo. */
export type BlockState = 'loading' | 'error' | 'ok'

export interface Stat { label: string; value: string }
export interface SituationData { tone: SituationTone; title: string; description?: string; deadline?: string; primaryLabel?: string; href?: string }
export interface UpcomingData { nature: EventNature; title: string; when: string; context?: string }
export interface IndicatorData { label: string; value: string; trend?: string }
export interface ProgramData { title: string; subtitle?: string; meta?: { label: string; value: string }[] }

export interface DashboardPriorityProps {
  greeting: string
  today: Stat[]
  attention: SituationData[]
  continuing: SituationData[]
  upcoming: UpcomingData[]
  indicators: IndicatorData[]
  programs: ProgramData[]
  spend?: { value: string; caption: string; trend?: string }
  /** estado por bloco — cada seção com dado real resolve loading/erro isoladamente */
  attentionState?: BlockState
  upcomingState?: BlockState
  indicatorsState?: BlockState
  className?: string
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-cream p-4">
      <h2 className="mb-3 text-sm font-medium text-mauve">{title}</h2>
      {children}
    </section>
  )
}

/** Renderiza o ciclo do bloco: loading/erro via StateView; senão o conteúdo. */
function Block({ state, title, loadingLabel, errorLabel, children }: {
  state: BlockState | undefined; title: string; loadingLabel: string; errorLabel: string; children: React.ReactNode
}) {
  if (state === 'loading') return <Section title={title}><StateView kind="loading" title={loadingLabel} /></Section>
  if (state === 'error') return <Section title={title}><StateView kind="error" title={errorLabel} message="Tente novamente em instantes." /></Section>
  return <>{children}</>
}

export default function DashboardPriority(props: DashboardPriorityProps) {
  const { greeting, today, attention, continuing, upcoming, indicators, programs, spend,
    attentionState, upcomingState, indicatorsState, className } = props
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <h1 className="font-display text-xl text-onyx">{greeting}</h1>

      {/* 1 · Minha saúde hoje (5 indicadores) */}
      <Section title="Minha saúde hoje">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {today.map((s) => (
            <div key={s.label} className="rounded-xl bg-white p-3">
              <dd className="text-xl font-medium text-onyx">{s.value}</dd>
              <dt className="mt-0.5 text-xs text-mauve">{s.label}</dt>
            </div>
          ))}
        </dl>
      </Section>

      {/* 2 · Requer atenção */}
      <Block state={attentionState} title="Requer atenção" loadingLabel="Verificando o que precisa de atenção…" errorLabel="Não foi possível verificar pendências">
        {attention.length > 0 && (
          <Section title="Requer atenção">
            <div className="flex flex-col gap-3">
              {attention.map((a, i) => (
                <SituationCard key={i} tone={a.tone} title={a.title} description={a.description} deadline={a.deadline}
                  primaryAction={a.primaryLabel ? { label: a.primaryLabel, href: a.href } : undefined} />
              ))}
            </div>
          </Section>
        )}
      </Block>

      {/* 3 · Continuar de onde parei (some quando vazio) */}
      {continuing.length > 0 && (
        <Section title="Continuar de onde parei">
          <div className="grid gap-3 sm:grid-cols-2">
            {continuing.map((c, i) => (
              <SituationCard key={i} tone={c.tone} title={c.title} description={c.description}
                primaryAction={c.primaryLabel ? { label: c.primaryLabel, href: c.href } : undefined} />
            ))}
          </div>
        </Section>
      )}

      {/* 4 · Registrar */}
      <Section title="Registrar">
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm"><CloudUpload className="h-4 w-4" /> Adicionar documento</Button>
          <Button variant="secondary" size="sm"><ShoppingCart className="h-4 w-4" /> Compra</Button>
          <Button variant="secondary" size="sm"><FlaskConical className="h-4 w-4" /> Exame</Button>
          <Button variant="secondary" size="sm"><Pill className="h-4 w-4" /> Medicamento</Button>
          <Button variant="secondary" size="sm"><Watch className="h-4 w-4" /> Dispositivo</Button>
          <Button variant="secondary" size="sm"><Stethoscope className="h-4 w-4" /> Condição</Button>
        </div>
      </Section>

      {/* 5 · Próximos acontecimentos (7 dias) */}
      <Block state={upcomingState} title="Próximos acontecimentos" loadingLabel="Carregando próximos acontecimentos…" errorLabel="Não foi possível carregar a agenda">
        {upcoming.length > 0 && (
          <Section title="Próximos acontecimentos">
            <div className="flex flex-col gap-3">
              {upcoming.map((u, i) => (
                <EventCard key={i} nature={u.nature} title={u.title} when={u.when} context={u.context} />
              ))}
            </div>
          </Section>
        )}
      </Block>

      {/* 6 · Indicadores (resumo) */}
      <Block state={indicatorsState} title="Indicadores" loadingLabel="Carregando indicadores…" errorLabel="Não foi possível carregar os indicadores">
        {indicators.length > 0 && (
          <Section title="Indicadores">
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {indicators.map((ind) => (
                <div key={ind.label} className="rounded-xl bg-white p-3">
                  <dt className="text-xs text-mauve">{ind.label}</dt>
                  <dd className="mt-0.5 text-base font-medium text-onyx">{ind.value}</dd>
                  {ind.trend && <p className="text-xs text-mauve">{ind.trend}</p>}
                </div>
              ))}
            </dl>
          </Section>
        )}
      </Block>

      {/* 7 · Programas ativos */}
      {programs.length > 0 && (
        <Section title="Programas ativos">
          <div className="grid gap-3 sm:grid-cols-2">
            {programs.map((p, i) => (
              <ItemCard key={i} kind="program" title={p.title} subtitle={p.subtitle} meta={p.meta} />
            ))}
          </div>
        </Section>
      )}

      {/* 8 · Gastos (resumo) */}
      {spend && (
        <Section title="Despesas">
          <div className="flex items-baseline gap-3">
            <span className="text-xl font-medium text-onyx">{spend.value}</span>
            <span className="text-xs text-mauve">{spend.caption}</span>
            {spend.trend && <span className="ml-auto text-xs text-sage">{spend.trend}</span>}
          </div>
        </Section>
      )}
    </div>
  )
}
