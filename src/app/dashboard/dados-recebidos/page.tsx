'use client'

// ============================================================
// Dados recebidos — o que entrou sozinho, de onde veio, e o que parece repetido
// ============================================================
// PARIDADE com o aplicativo (DadosRecebidosScreen). A tela nasceu no Mobile em
// 28/08 e nunca teve equivalente aqui — e quem usa a plataforma no navegador
// não tinha NENHUM lugar para ver o que as conexões trouxeram. BASE ÚNICA: o
// que existe numa ponta existe na outra.
//
// POR QUE ELA EXISTE. A pessoa autoriza a fonte UMA VEZ e o dado passa a entrar
// sem perguntar. Sem um lugar para ver o que entrou, "entra sozinho" viraria
// "entra sem que eu saiba" — e numa plataforma de saúde isso é inaceitável: o
// dado vai para um relatório levado ao médico.
//
// O TOM É DE INFORMAÇÃO, NÃO DE TAREFA. Nada aqui exige resposta. Quem nunca
// abrir esta tela não perde nada e não terá nada duplicado nem descartado em
// silêncio. Uma fila de pendências transformaria o registro de saúde numa caixa
// de entrada — o oposto do que a plataforma faz pela pessoa.
//
// O QUE ELA NÃO FAZ: decidir. A suspeita de duplicata é EXPLICADA e as três
// saídas ficam disponíveis; apagar sozinho exigiria uma certeza que não existe,
// e o custo de errar é perder um fato real.
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/PageHeader'
import EmptyState from '@/components/EmptyState'
import ConfirmDialog from '@/components/ConfirmDialog'
import Disclaimer from '@/components/ui/Disclaimer'
import { Card } from '@/lib/ui/ds'
import {
  listActivitySessions, deleteActivitySession, listBodyMetrics, deleteBodyMetric,
  type ActivitySessionDTO, type BodyMetricDTO,
} from '@sintera/api-client'
import {
  SCREEN_COPY, activityTypeLabel, activitySummary, bodyMetricLabel, bodySourceLabel,
  formatInstantBR, formatDateBR, suspectedDuplicateActivities, DUPLICATE_CHOICES,
  type ActivityForMatch, type DuplicateSuspicion, type DuplicateChoice,
} from '@sintera/core'

const C = SCREEN_COPY.dadosRecebidos

/** Só o que veio de FORA. O que a pessoa digitou ela já sabe que existe — não é "recebido". */
const ehDeFora = (source: string | null | undefined): boolean => {
  const s = (source ?? '').trim()
  return s !== '' && s !== 'manual'
}

function paraComparacao(a: ActivitySessionDTO): ActivityForMatch {
  return {
    id: a.id,
    source: a.source ?? 'desconhecida',
    activityType: a.activity_type,
    startedAt: a.started_at,
    durationS: a.duration_s,
    distanceM: a.distance_m,
  }
}

export default function DadosRecebidosPage() {
  const supabase = createClient()
  const [acts, setActs] = useState<ActivitySessionDTO[]>([])
  const [metrics, setMetrics] = useState<BodyMetricDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [confirmMetric, setConfirmMetric] = useState<BodyMetricDTO | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [a, m] = await Promise.all([
      listActivitySessions(supabase).catch(() => [] as ActivitySessionDTO[]),
      listBodyMetrics(supabase).catch(() => [] as BodyMetricDTO[]),
    ])
    setActs(a.filter((x: ActivitySessionDTO) => ehDeFora(x.source)))
    setMetrics(m.filter((x: BodyMetricDTO) => ehDeFora(x.source)))
    setLoading(false)
  }, [supabase])

  useEffect(() => { void load() }, [load])

  // A regra de "é o mesmo fato?" vive no core, testada. Aqui só se compara a lista consigo mesma: cada
  // atividade contra as demais, para achar o par que veio por dois caminhos. Idêntico ao aplicativo.
  const suspeitas: DuplicateSuspicion<ActivityForMatch>[] = []
  const jaVistos = new Set<string>()
  for (const a of acts) {
    if (jaVistos.has(a.id)) continue
    const outros = acts.filter(o => o.id !== a.id && !jaVistos.has(o.id)).map(paraComparacao)
    const [s] = suspectedDuplicateActivities([paraComparacao(a)], outros)
    if (s) { suspeitas.push(s); jaVistos.add(s.incoming.id); jaVistos.add(s.existing.id) }
  }

  async function resolver(sus: DuplicateSuspicion<ActivityForMatch>, escolha: DuplicateChoice) {
    if (escolha === 'manter-ambos') {
      // Nada a fazer no banco. A semelhança continua visível — é informação, não pendência.
      return
    }
    const alvo = escolha === 'descartar-novo' ? sus.incoming.id : sus.existing.id
    setBusy(alvo)
    try {
      const { error } = await deleteActivitySession(supabase, alvo)
      if (!error) await load()
    } finally { setBusy(null) }
  }

  async function removerMedicao(m: BodyMetricDTO) {
    setConfirmMetric(null)
    setBusy(m.id)
    try {
      const { error } = await deleteBodyMetric(supabase, m.id)
      if (!error) await load()
    } finally { setBusy(null) }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="animate-spin text-mauve" size={20} />
      </div>
    )
  }

  const vazio = acts.length === 0 && metrics.length === 0

  return (
    <div className="space-y-4">
      <PageHeader title={C.title} subtitle={C.subtitle} />

      {vazio && <EmptyState icon={null} title={C.emptyTitle} message={C.emptyMessage} />}

      {/* POSSÍVEIS REPETIÇÕES primeiro — é a única coisa aqui sobre a qual vale a pena decidir. */}
      {suspeitas.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-onyx">{C.duplicateTitle}</h2>
          <p className="text-sm text-mauve">{C.duplicateHint}</p>

          {suspeitas.map(sus => (
            <Card key={sus.incoming.id} className="space-y-3 border-amber-300 p-4">
              <p className="text-sm">
                {activityTypeLabel(sus.incoming.activityType ?? 'outro')} — {sus.incoming.source}
              </p>
              <p className="text-xs text-mauve">{sus.reason}</p>
              <div className="space-y-2">
                {DUPLICATE_CHOICES.map(op => (
                  <button
                    key={op.id}
                    onClick={() => resolver(sus, op.id)}
                    disabled={busy === sus.incoming.id || busy === sus.existing.id}
                    className="w-full rounded-xl border border-border px-4 py-3 text-left hover:bg-black/[0.02] disabled:opacity-50"
                  >
                    <span className="block text-sm">{op.label}</span>
                    <span className="block text-xs text-mauve">{op.hint}</span>
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </section>
      )}

      {acts.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-onyx">Atividades recebidas</h2>
          {acts.map(a => (
            <Card key={a.id} className="space-y-0.5 p-4">
              <p className="text-sm">{a.title?.trim() || activityTypeLabel(a.activity_type)}</p>
              {/* QUANDO ACONTECEU VEM PRIMEIRO. Sem a data, uma atividade de três semanas atrás e uma de hoje
                  são o mesmo cartão — a fundadora viu doze delas, todas idênticas, sem saber de que dias eram.
                  Num registro de saúde, o quando não é detalhe: é metade do fato. */}
              <p className="text-xs text-mauve">
                {[formatInstantBR(a.started_at), activitySummary(a)].filter(Boolean).join(' · ')}
              </p>
              <p className="text-xs text-mauve/70">{`${C.sourceLabel}: ${a.source}`}</p>
            </Card>
          ))}
        </section>
      )}

      {metrics.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-onyx">Medições recebidas</h2>
          {metrics.map(m => (
            <Card key={m.id} className="space-y-0.5 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="flex-1 text-sm">
                  {bodyMetricLabel(m.metric)}: {m.value_text}{m.unit ? ` ${m.unit}` : ''}
                </p>
                <button
                  onClick={() => setConfirmMetric(m)}
                  disabled={busy === m.id}
                  aria-label={`${C.removeAction} ${bodyMetricLabel(m.metric)}`}
                  className="rounded-full p-2 text-mauve hover:bg-black/[0.04] disabled:opacity-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="text-xs text-mauve">
                {/* `measured_at` é o instante; `measured_on` é o dia. Duas leituras de pressão do mesmo dia só
                    se distinguem pelo primeiro — mas nem toda medição tem hora, e aí o dia é o que há. */}
                {[
                  m.measured_at ? formatInstantBR(m.measured_at) : formatDateBR(m.measured_on),
                  `${C.sourceLabel}: ${bodySourceLabel(m.source) ?? m.source}`,
                ].filter(Boolean).join(' · ')}
              </p>
            </Card>
          ))}
        </section>
      )}

      <Disclaimer variant="geral" />

      <ConfirmDialog
        open={confirmMetric !== null}
        title="Remover medição"
        message={confirmMetric
          ? `Remover ${bodyMetricLabel(confirmMetric.metric)} recebida de ${bodySourceLabel(confirmMetric.source) ?? 'origem desconhecida'}?`
          : ''}
        confirmLabel={C.removeAction}
        onConfirm={() => confirmMetric && removerMedicao(confirmMetric)}
        onCancel={() => setConfirmMetric(null)}
      />
    </div>
  )
}
