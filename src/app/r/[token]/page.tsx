// ============================================================
// Visualização pública do relatório (link compartilhado)
// ============================================================
// Somente-leitura. Renderizada NO SERVIDOR com service role, apenas para
// tokens válidos (não revogados e não expirados). Sem login. A usuária gera e
// revoga o link no app. Não indexável.
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { DOMAIN_LABEL, type OmicsDomain } from '@/lib/omics/domains'
import { resolvePeriod, inPeriod, overlapsPeriod, type Period } from '@/lib/communication/period'
import { selectFinancial } from '@/lib/agenda/event' // Despesas = mesma projeção financeira do domínio (SSOT)
import { eventServicesFor, professionalKindLabel } from '@/lib/agenda' // EVT-C1: leitura canônica (legado+canônico) também no compartilhamento
import { contraceptiveLabel } from '@/lib/cycle' // SSOT dos métodos contraceptivos

export const metadata = { robots: { index: false, follow: false } }

const TYPE_LABEL: Record<string, string> = {
  consulta: 'Consulta', vacina: 'Vacina', procedimento: 'Procedimento',
  estetico: 'Procedimento estético', medicamento: 'Medicamento', exame: 'Exame', outro: 'Evento',
}
const METRIC_LABEL: Record<string, string> = {
  peso: 'Peso', altura: 'Altura', circunferencia_cintura: 'Circunferência (cintura)',
  imc: 'IMC', gordura_corporal: 'Gordura corporal', massa_muscular: 'Massa muscular',
  agua_corporal: 'Água corporal', gordura_visceral: 'Gordura visceral', massa_ossea: 'Massa óssea',
  taxa_metabolica: 'Taxa metabólica basal',
  pressao_arterial: 'Pressão arterial', frequencia_cardiaca: 'Frequência cardíaca', glicemia: 'Glicemia',
  saturacao: 'Saturação (SpO₂)', temperatura: 'Temperatura', outro_sinal: 'Outro sinal',
  outro: 'Outra medida',
}
const VITAL_METRICS = ['pressao_arterial', 'frequencia_cardiaca', 'glicemia', 'saturacao', 'temperatura', 'outro_sinal']
const isVital = (m: string) => VITAL_METRICS.includes(m)
const HABIT_LABEL: Record<string, string> = {
  atividade_fisica: 'Atividade física', sono: 'Sono', tabagismo: 'Tabagismo',
  alcool: 'Álcool', alimentacao: 'Alimentação', hidratacao: 'Hidratação', outro: 'Outro',
}

function periodo(start: string | null, until: string | null): string {
  if (start && until) return ` (de ${fmt(start)} até ${fmt(until)})`
  if (start) return ` (desde ${fmt(start)})`
  if (until) return ` (até ${fmt(until)})`
  return ''
}

function fmt(date: string | null): string {
  if (!date) return '—'
  const d = new Date(date.length <= 10 ? `${date}T00:00:00` : date)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 640, margin: '60px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif', textAlign: 'center', color: '#5F6A62' }}>
      {children}
    </div>
  )
}

export default async function SharedReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (!serviceKey) return <Aviso>Indisponível no momento.</Aviso>

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: share } = await (admin.from('report_shares') as any)
    .select('user_id, expires_at, revoked, sections, period')
    .eq('token', token)
    .maybeSingle()

  if (!share || share.revoked || new Date(share.expires_at as string) < new Date()) {
    return <Aviso><h1 style={{ fontSize: 20, color: '#26201C' }}>Link inválido ou expirado</h1><p style={{ marginTop: 8 }}>Peça um novo link à pessoa que compartilhou.</p></Aviso>
  }

  const uid = share.user_id as string
  // Contexto Temporal do compartilhamento — mesmo recorte do relatório que gerou o link.
  const rp = resolvePeriod((share.period as Period | null) ?? { preset: 'all' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  const [{ data: prof }, { data: meds }, eventsList, { data: exams }, { data: measures }, { data: conditions }, { data: habits }, { data: eyewear }, { data: omics }, { data: contraceptives }, { data: menstruations }, { data: authUser }] = await Promise.all([
    db.from('profiles').select('name, height_cm').eq('id', uid).maybeSingle(),
    db.from('medications').select('name, kind, dose, frequency, started_on, until_date, status').eq('user_id', uid).order('status'),
    // EVT-C1 (NC-0013/0014): leitura ÚNICA pelo contrato canônico — inclui eventos legados + canônicos (dedup).
    eventServicesFor(db).query.listAll(uid),
    db.from('exams').select('id, type, exam_date, created_at, file_url').eq('user_id', uid).order('created_at', { ascending: false }),
    db.from('body_metrics').select('metric, label, value_text, unit, measured_on, exam_id').eq('user_id', uid).order('measured_on', { ascending: false }),
    db.from('health_conditions').select('scope, name, relative, since_label, notes').eq('user_id', uid).order('created_at', { ascending: false }),
    db.from('life_habits').select('category, description, frequency, notes').eq('user_id', uid).order('created_at', { ascending: false }),
    db.from('health_resources').select('name, resource_type, prescriber, started_on, attributes, file_url').eq('user_id', uid).eq('resource_type', 'correcao_visual').order('created_at', { ascending: false }),
    db.from('omics_panels').select('domain, laboratory, total_features, collected_on, created_at').eq('user_id', uid).order('collected_on', { ascending: false, nullsFirst: false }),
    db.from('contraceptive_methods').select('kind, brand, started_on, replace_on, status').eq('user_id', uid).order('created_at', { ascending: false }),
    db.from('menstrual_periods').select('started_on, notes').eq('user_id', uid).order('started_on', { ascending: false }).limit(24),
    admin.auth.admin.getUserById(uid),
  ])

  const nome = (prof?.name as string) || authUser?.user?.email || '—'
  const alturaCm = (prof?.height_cm as number | null | undefined) ?? null
  // Óculos/lentes agora vivem em health_resources (correcao_visual); normaliza para
  // o mesmo formato plano que esta seção já renderiza.
  const ewArr = ((eyewear ?? []) as Array<Record<string, unknown>>).map(r => {
    const a = (r.attributes as Record<string, unknown>) ?? {}
    const od = (a.od as Record<string, string>) ?? {}
    const oe = (a.oe as Record<string, string>) ?? {}
    return {
      kind: (a.vision_kind as string) ?? 'oculos', prescribed_on: r.started_on ?? null, prescriber: r.prescriber ?? null,
      od_sph: od.sph ?? null, od_cyl: od.cyl ?? null, od_axis: od.axis ?? null, od_add: od.add ?? null,
      oe_sph: oe.sph ?? null, oe_cyl: oe.cyl ?? null, oe_axis: oe.axis ?? null, oe_add: oe.add ?? null,
      dnp: (a.dnp as string) ?? null, bc: (a.bc as string) ?? null, dia: (a.dia as string) ?? null,
      fileUrl: (r.file_url as string) ?? null,
    }
  })
  const omArr = ((omics ?? []) as Array<Record<string, unknown>>).filter(o => inPeriod((o.collected_on as string) ?? (o.created_at as string) ?? null, rp))
  const grauStr = (sph: unknown, cyl: unknown, axis: unknown, add: unknown) =>
    [sph ? `Esf ${sph}` : null, cyl ? `Cil ${cyl}` : null, axis ? `Eixo ${axis}` : null, add ? `Adição ${add}` : null].filter(Boolean).join(', ')
  const EYEWEAR_LABEL: Record<string, string> = { oculos: 'Óculos', lentes_contato: 'Lentes de contato' }
  const medsArr = (meds ?? []) as Array<Record<string, unknown>>
  const medsEmUso = medsArr.filter(m => m.status === 'em_uso')
  const medsSusp = medsArr.filter(m => m.status === 'suspenso' && overlapsPeriod((m.started_on as string) ?? null, (m.until_date as string) ?? null, rp))
  const evArr = eventsList.filter(e => inPeriod(e.date ?? null, rp))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))   // mais recentes primeiro (como antes)
  const exArr = ((exams ?? []) as Array<Record<string, unknown>>).filter(e => inPeriod((e.exam_date as string) ?? (e.created_at as string) ?? null, rp))
  const mzAll = (measures ?? []) as Array<Record<string, unknown>>
  const mzArr = mzAll.filter(m => !isVital(m.metric as string) && inPeriod(m.measured_on as string, rp))
  const vitalArr = mzAll.filter(m => isVital(m.metric as string) && inPeriod(m.measured_on as string, rp))
  // Vínculo medida → laudo (documento original) + resumo antropométrico (estado atual).
  const examById = new Map(((exams ?? []) as Array<Record<string, unknown>>).map(e => [e.id as string, e]))
  const latestPeso = mzAll.find(m => (m.metric as string) === 'peso') ?? null
  const pesoNum = latestPeso ? parseFloat(String(latestPeso.value_text).replace(',', '.')) : NaN
  const imcVal = !Number.isNaN(pesoNum) && alturaCm != null ? pesoNum / Math.pow((alturaCm as number) / 100, 2) : null
  // Laudos vinculados às medidas (bioimpedância etc.): documento (nome + data + link),
  // como em Exames, em vez de discriminar cada métrica. Dedup por exame.
  const medLaudos = Array.from(new Set(mzArr.map(m => m.exam_id).filter(Boolean) as string[]))
    .map(id => examById.get(id)).filter(Boolean) as Array<Record<string, unknown>>
  const cdArr = (conditions ?? []) as Array<Record<string, unknown>>
  const condProprias = cdArr.filter(c => c.scope === 'propria')
  const condFamiliar = cdArr.filter(c => c.scope === 'familiar')
  const hbArr = (habits ?? []) as Array<Record<string, unknown>>
  // Despesas = MESMA projeção financeira do domínio (selectFinancial), sem reimplementar a regra.
  const expArr = selectFinancial(eventsList).filter(x => inPeriod(x.date, rp))
  const ccArr = (contraceptives ?? []) as Array<Record<string, unknown>>
  const mpArr = ((menstruations ?? []) as Array<Record<string, unknown>>).filter(m => inPeriod(m.started_on as string, rp))
  const brl = (cents: number | null | undefined) => `R$ ${((cents ?? 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const allowed = Array.isArray(share.sections) ? (share.sections as string[]) : null
  const show = (k: string) => !allowed || allowed.includes(k)
  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px', fontFamily: 'system-ui, sans-serif', color: '#26201C', lineHeight: 1.5 }}>
      <div style={{ borderBottom: '1px solid #DCE8E3', paddingBottom: 16, marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, margin: 0 }}>Relatório — {nome}</h1>
        <p style={{ fontSize: 12, color: '#5F6A62', marginTop: 6 }}>Gerado em {hoje} · organização dos dados registrados pela própria pessoa (SINTERA).</p>
      </div>

      {show('medicamentos') && (
      <section style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 15 }}>Medicamentos e suplementos em uso</h2>
        {medsEmUso.length === 0 ? <p style={{ color: '#5F6A62', fontSize: 14 }}>Nenhum registrado.</p> : (
          <ul style={{ paddingLeft: 18, fontSize: 14 }}>
            {medsEmUso.map((m, i) => {
              const d = `${[m.dose, m.frequency].filter(Boolean).join(', ')}${periodo((m.started_on as string) ?? null, (m.until_date as string) ?? null)}`.trim()
              return (
              <li key={i}><strong>{m.name as string}</strong>{m.kind === 'suplemento' ? ' (suplemento)' : ''}{d ? <span style={{ display: 'block', fontSize: 12, color: '#5F6A62' }}>{d}</span> : null}</li>
              )
            })}
          </ul>
        )}
        {medsSusp.length > 0 && <p style={{ fontSize: 12, color: '#5F6A62' }}>Suspensos: {medsSusp.map(m => m.name as string).join(', ')}.</p>}
      </section>
      )}

      {show('condicoes') && (
      <section style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 15 }}>Condições de saúde</h2>
        {condProprias.length === 0 ? <p style={{ color: '#5F6A62', fontSize: 14 }}>Nenhuma condição registrada.</p> : (
          <ul style={{ paddingLeft: 18, fontSize: 14 }}>
            {condProprias.map((c, i) => (
              <li key={i}><strong>{c.name as string}</strong>{c.since_label ? ` (desde ${c.since_label as string})` : ''}{c.notes ? <span style={{ display: 'block', fontSize: 12, color: '#5F6A62' }}>{c.notes as string}</span> : null}</li>
            ))}
          </ul>
        )}
        {condFamiliar.length > 0 && (
          <>
            <h3 style={{ fontSize: 12, color: '#5F6A62', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 12, marginBottom: 4 }}>Histórico familiar</h3>
            <ul style={{ paddingLeft: 18, fontSize: 14 }}>
              {condFamiliar.map((c, i) => (
                <li key={i}><strong>{c.name as string}</strong>{c.relative ? ` — ${c.relative as string}` : ''}{c.since_label ? ` (desde ${c.since_label as string})` : ''}{c.notes ? <span style={{ display: 'block', fontSize: 12, color: '#5F6A62' }}>{c.notes as string}</span> : null}</li>
              ))}
            </ul>
          </>
        )}
      </section>
      )}

      {show('habitos') && (
      <section style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 15 }}>Hábitos de vida</h2>
        {hbArr.length === 0 ? <p style={{ color: '#5F6A62', fontSize: 14 }}>Nenhum hábito registrado.</p> : (
          <ul style={{ paddingLeft: 18, fontSize: 14 }}>
            {hbArr.map((h, i) => (
              <li key={i}><span style={{ color: '#5F6A62' }}>{HABIT_LABEL[h.category as string] ?? 'Hábito'}:</span> {h.description as string}{h.frequency ? ` — ${h.frequency as string}` : ''}{h.notes ? <span style={{ display: 'block', fontSize: 12, color: '#5F6A62' }}>{h.notes as string}</span> : null}</li>
            ))}
          </ul>
        )}
      </section>
      )}

      {show('visao') && (
      <section style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 15 }}>Óculos e lentes de contato</h2>
        {ewArr.length === 0 ? <p style={{ color: '#5F6A62', fontSize: 14 }}>Nenhum registro.</p> : (
          <ul style={{ paddingLeft: 18, fontSize: 14 }}>
            {ewArr.map((e, i) => {
              const extras = [e.dnp ? `DNP ${e.dnp}` : null, e.bc ? `BC ${e.bc}` : null, e.dia ? `DIA ${e.dia}` : null,
                e.prescribed_on ? fmt(e.prescribed_on as string) : null, e.prescriber].filter(Boolean)
              const od = grauStr(e.od_sph, e.od_cyl, e.od_axis, e.od_add)
              const oe = grauStr(e.oe_sph, e.oe_cyl, e.oe_axis, e.oe_add)
              return (
                <li key={i}><strong>{EYEWEAR_LABEL[e.kind as string] ?? 'Óculos'}</strong>
                  {od ? <span style={{ display: 'block', fontSize: 12, color: '#5F6A62' }}>OD: {od}</span> : null}
                  {oe ? <span style={{ display: 'block', fontSize: 12, color: '#5F6A62' }}>OE: {oe}</span> : null}
                  {extras.length ? <span style={{ display: 'block', fontSize: 12, color: '#5F6A62' }}>{extras.join(' · ')}</span> : null}
                  {e.fileUrl ? <span style={{ display: 'block', fontSize: 13, marginTop: 2 }}><a href={e.fileUrl as string} target="_blank" rel="noopener noreferrer" style={{ color: '#0E7580', textDecoration: 'none' }}>Ver documento original</a></span> : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>
      )}

      {show('eventos') && (
      <section style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 15 }}>Agenda</h2>
        {evArr.length === 0 ? <p style={{ color: '#5F6A62', fontSize: 14 }}>Nenhum registrado.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <tbody>
              {evArr.map((e, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #DCE8E3' }}>
                  <td style={{ padding: '6px 12px 6px 0', color: '#5F6A62', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{fmt(e.date)}</td>
                  <td style={{ padding: '6px 0' }}>
                    <span style={{ color: '#5F6A62' }}>{TYPE_LABEL[e.type] ?? 'Evento'}{professionalKindLabel(e.professionalKind) ? ` (${professionalKindLabel(e.professionalKind)})` : ''}:</span> {e.title}
                    {e.notes ? <span style={{ display: 'block', fontSize: 12, color: '#5F6A62' }}>{e.notes}</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      )}

      {show('exames') && (
      <section style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 15 }}>Exames enviados</h2>
        {exArr.length === 0 ? <p style={{ color: '#5F6A62', fontSize: 14 }}>Nenhum.</p> : (
          <ul style={{ paddingLeft: 18, fontSize: 14 }}>
            {exArr.map((e, i) => (
              <li key={i}>{fmt((e.exam_date as string) || (e.created_at as string))} — {(e.type as string) || 'Exame'}
                {e.file_url ? <>{'  ·  '}<a href={e.file_url as string} target="_blank" rel="noopener noreferrer" style={{ color: '#0E7580', textDecoration: 'none', fontSize: 13 }}>Ver documento original</a></> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
      )}

      {show('omica') && (
      <section style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 15 }}>Exames de ômica</h2>
        {omArr.length === 0 ? <p style={{ color: '#5F6A62', fontSize: 14 }}>Nenhum registrado.</p> : (
          <ul style={{ paddingLeft: 18, fontSize: 14 }}>
            {omArr.map((o, i) => {
              const extra = [o.laboratory as string | null, o.total_features != null ? `${(o.total_features as number).toLocaleString('pt-BR')} marcadores` : null].filter(Boolean).join(', ')
              const d = (o.collected_on as string) || (o.created_at as string)
              return <li key={i}>{d ? `${fmt(d)} — ` : ''}<strong>{DOMAIN_LABEL[o.domain as OmicsDomain] ?? 'Ômica'}</strong>{extra ? ` (${extra})` : ''}</li>
            })}
          </ul>
        )}
      </section>
      )}

      {show('medidas') && (
      <section style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 15 }}>Medidas corporais</h2>
        {(latestPeso || alturaCm != null || imcVal != null) && (
          <p style={{ fontSize: 14, margin: '0 0 6px' }}>
            {[
              latestPeso ? `Peso ${latestPeso.value_text as string}${latestPeso.unit ? ` ${latestPeso.unit as string}` : ''} (${fmt(latestPeso.measured_on as string)})` : null,
              alturaCm != null ? `Altura ${alturaCm} cm` : null,
              imcVal != null ? `IMC ${imcVal.toFixed(1)} kg/m²` : null,
            ].filter(Boolean).join('  ·  ')}
          </p>
        )}
        {medLaudos.length > 0 ? (
          <ul style={{ paddingLeft: 18, fontSize: 14, margin: 0 }}>
            {medLaudos.map((ex, i) => (
              <li key={i}>
                {(ex.type as string) || 'Exame'}{ex.exam_date ? ` · ${fmt(ex.exam_date as string)}` : ''}
                {ex.file_url ? <>{'  ·  '}<a href={ex.file_url as string} target="_blank" rel="noopener noreferrer" style={{ color: '#0E7580', textDecoration: 'none', fontSize: 13 }}>Ver documento original</a></> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#5F6A62', fontSize: 14 }}>{latestPeso || alturaCm != null ? 'Nenhum laudo vinculado às medidas.' : 'Nenhuma registrada.'}</p>
        )}
      </section>
      )}

      {show('sinais') && (
      <section style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 15 }}>Monitoramento</h2>
        {vitalArr.length === 0 ? <p style={{ color: '#5F6A62', fontSize: 14 }}>Nenhum registrado.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <tbody>
              {vitalArr.map((m, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #DCE8E3' }}>
                  <td style={{ padding: '6px 12px 6px 0', color: '#5F6A62', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{fmt(m.measured_on as string)}</td>
                  <td style={{ padding: '6px 0' }}><span style={{ color: '#5F6A62' }}>{m.metric === 'outro_sinal' && m.label ? (m.label as string) : METRIC_LABEL[m.metric as string] ?? 'Sinal'}:</span> {m.value_text as string}{m.unit ? ` ${m.unit as string}` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      )}

      {show('ciclo') && (
      <section style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 15 }}>Ciclo e Contracepção</h2>
        {ccArr.length === 0 && mpArr.length === 0 ? <p style={{ color: '#5F6A62', fontSize: 14 }}>Nenhum registro de ciclo ou contracepção.</p> : (
          <>
            {ccArr.length > 0 && (
              <ul style={{ paddingLeft: 18, fontSize: 14 }}>
                {ccArr.map((c, i) => (
                  <li key={i}><strong>{contraceptiveLabel(c.kind as string)}</strong>{c.brand ? ` (${c.brand as string})` : ''}
                    {c.started_on ? ` — desde ${fmt(c.started_on as string)}` : ''}{c.replace_on ? ` · troca prevista ${fmt(c.replace_on as string)}` : ''}
                    {c.status && c.status !== 'ativo' ? ` (${c.status as string})` : ''}</li>
                ))}
              </ul>
            )}
            {mpArr.length > 0 && (
              <>
                <h3 style={{ fontSize: 12, color: '#5F6A62', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 12, marginBottom: 4 }}>Menstruação</h3>
                <p style={{ fontSize: 14 }}>{mpArr.map(m => fmt(m.started_on as string)).join(' · ')}</p>
              </>
            )}
          </>
        )}
      </section>
      )}

      {show('gastos') && (
      <section style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 15 }}>Despesas</h2>
        {expArr.length === 0 ? <p style={{ color: '#5F6A62', fontSize: 14 }}>Nenhuma despesa registrada.</p> : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <tbody>
                {expArr.map((x, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #DCE8E3' }}>
                    <td style={{ padding: '6px 12px 6px 0', color: '#5F6A62', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{fmt(x.date)}</td>
                    <td style={{ padding: '6px 0' }}><span style={{ color: '#5F6A62' }}>{TYPE_LABEL[x.type] ?? 'Evento'}:</span> {x.title}</td>
                    <td style={{ padding: '6px 0 6px 12px', textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{brl(x.amountCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: 14, fontWeight: 600, marginTop: 8, textAlign: 'right' }}>Total: {brl(expArr.reduce((s, x) => s + (x.amountCents ?? 0), 0))}</p>
          </>
        )}
      </section>
      )}

      <p style={{ fontSize: 11, color: '#5F6A62', borderTop: '1px solid #DCE8E3', paddingTop: 12 }}>
        Relatório compartilhado pela própria pessoa via SINTERA. Organiza dados autorrelatados — <strong>não é laudo, diagnóstico ou parecer</strong> e não substitui avaliação profissional.
      </p>
    </div>
  )
}
