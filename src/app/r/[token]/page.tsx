// ============================================================
// Visualização pública do relatório (link compartilhado)
// ============================================================
// Somente-leitura. Renderizada NO SERVIDOR com service role, apenas para
// tokens válidos (não revogados e não expirados). Sem login. A usuária gera e
// revoga o link no app. Não indexável.
//
// Dados: MESMO read-model do relatório privado (loadReportDataset) — a projeção
// de 11 tabelas é única, então o link público e a página /dashboard/relatorio NUNCA
// divergem. Aqui o cliente é o service-role (sem sessão); lá é o RLS do usuário.
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { DOMAIN_LABEL, type OmicsDomain } from '@/lib/omics/domains'
import { resolvePeriod, inPeriod, overlapsPeriod, type Period } from '@/lib/communication/period'
import { loadReportDataset } from '@/lib/communication/reportDataset' // read-model ÚNICO do dataset de comunicação
import { selectFinancial } from '@/lib/agenda' // Despesas = projeção financeira do domínio (SSOT)
import { contraceptiveLabel } from '@/lib/cycle' // SSOT dos métodos contraceptivos

export const metadata = { robots: { index: false, follow: false } }

const TYPE_LABEL: Record<string, string> = {
  consulta: 'Consulta', vacina: 'Vacina', procedimento: 'Procedimento',
  estetico: 'Procedimento estético', medicamento: 'Medicamento', exame: 'Exame', outro: 'Evento',
}
const PROF_LABEL: Record<string, string> = {
  medico: 'Médico(a)', psicologo: 'Psicólogo(a)', nutricionista: 'Nutricionista',
  fisioterapeuta: 'Fisioterapeuta', dentista: 'Dentista', outro: 'Outro profissional',
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
const EYEWEAR_LABEL: Record<string, string> = { oculos: 'Óculos', lentes_contato: 'Lentes de contato' }

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

function grauStr(sph: string | null, cyl: string | null, axis: string | null, add: string | null): string {
  return [sph ? `Esf ${sph}` : null, cyl ? `Cil ${cyl}` : null, axis ? `Eixo ${axis}` : null, add ? `Adição ${add}` : null].filter(Boolean).join(', ')
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
  // Dataset factual completo (read-model ÚNICO). O e-mail de fallback do nome exige
  // service-role (auth.admin), então fica fora do dataset.
  const [ds, { data: authUser }] = await Promise.all([
    loadReportDataset(admin, uid),
    admin.auth.admin.getUserById(uid),
  ])

  const nome = ds.profile.name || authUser?.user?.email || '—'
  const alturaCm = ds.profile.heightCm
  const ewArr = ds.eyewear
  const omArr = ds.omics.filter(o => inPeriod(o.date, rp))
  const medsEmUso = ds.medications.filter(m => m.status === 'em_uso')
  const medsSusp = ds.medications.filter(m => m.status === 'suspenso' && overlapsPeriod(m.startedOn, m.untilOn, rp))
  const evArr = ds.events.filter(e => inPeriod(e.date, rp))
  const exArr = ds.exams.filter(e => inPeriod(e.date, rp))
  const mzArr = ds.measures.filter(m => !isVital(m.metric) && inPeriod(m.date, rp))
  const vitalArr = ds.measures.filter(m => isVital(m.metric) && inPeriod(m.date, rp))
  // Vínculo medida → laudo (documento original) + resumo antropométrico (estado atual).
  const examById = new Map(ds.exams.map(e => [e.id, e]))
  const latestPeso = ds.measures.find(m => m.metric === 'peso') ?? null
  const pesoNum = latestPeso ? parseFloat(String(latestPeso.valueText).replace(',', '.')) : NaN
  const imcVal = !Number.isNaN(pesoNum) && alturaCm != null ? pesoNum / Math.pow(alturaCm / 100, 2) : null
  // Laudos vinculados às medidas (bioimpedância etc.): documento (nome + data + link),
  // como em Exames, em vez de discriminar cada métrica. Dedup por exame.
  const medLaudos = Array.from(new Set(mzArr.map(m => m.examId).filter(Boolean) as string[]))
    .map(id => examById.get(id)).filter((e): e is (typeof ds.exams)[number] => !!e)
  const condProprias = ds.conditions.filter(c => c.scope === 'propria')
  const condFamiliar = ds.conditions.filter(c => c.scope === 'familiar')
  const hbArr = ds.habits
  // Despesas = MESMA projeção financeira do domínio (selectFinancial), sem reimplementar a regra.
  const expArr = selectFinancial(ds.events).filter(x => inPeriod(x.date, rp))
  const ccArr = ds.contraceptives
  const mpArr = ds.menstruations.filter(m => inPeriod(m.startedOn, rp))
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
              const d = `${[m.dose, m.frequency].filter(Boolean).join(', ')}${periodo(m.startedOn, m.untilOn)}`.trim()
              return (
              <li key={i}><strong>{m.name}</strong>{m.kind === 'suplemento' ? ' (suplemento)' : ''}{d ? <span style={{ display: 'block', fontSize: 12, color: '#5F6A62' }}>{d}</span> : null}</li>
              )
            })}
          </ul>
        )}
        {medsSusp.length > 0 && <p style={{ fontSize: 12, color: '#5F6A62' }}>Suspensos: {medsSusp.map(m => m.name).join(', ')}.</p>}
      </section>
      )}

      {show('condicoes') && (
      <section style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 15 }}>Condições de saúde</h2>
        {condProprias.length === 0 ? <p style={{ color: '#5F6A62', fontSize: 14 }}>Nenhuma condição registrada.</p> : (
          <ul style={{ paddingLeft: 18, fontSize: 14 }}>
            {condProprias.map((c, i) => (
              <li key={i}><strong>{c.name}</strong>{c.since ? ` (desde ${c.since})` : ''}{c.notes ? <span style={{ display: 'block', fontSize: 12, color: '#5F6A62' }}>{c.notes}</span> : null}</li>
            ))}
          </ul>
        )}
        {condFamiliar.length > 0 && (
          <>
            <h3 style={{ fontSize: 12, color: '#5F6A62', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 12, marginBottom: 4 }}>Histórico familiar</h3>
            <ul style={{ paddingLeft: 18, fontSize: 14 }}>
              {condFamiliar.map((c, i) => (
                <li key={i}><strong>{c.name}</strong>{c.relative ? ` — ${c.relative}` : ''}{c.since ? ` (desde ${c.since})` : ''}{c.notes ? <span style={{ display: 'block', fontSize: 12, color: '#5F6A62' }}>{c.notes}</span> : null}</li>
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
              <li key={i}><span style={{ color: '#5F6A62' }}>{HABIT_LABEL[h.category] ?? 'Hábito'}:</span> {h.description}{h.frequency ? ` — ${h.frequency}` : ''}{h.notes ? <span style={{ display: 'block', fontSize: 12, color: '#5F6A62' }}>{h.notes}</span> : null}</li>
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
                e.prescribedOn ? fmt(e.prescribedOn) : null, e.prescriber].filter(Boolean)
              const od = grauStr(e.odSph, e.odCyl, e.odAxis, e.odAdd)
              const oe = grauStr(e.oeSph, e.oeCyl, e.oeAxis, e.oeAdd)
              return (
                <li key={i}><strong>{EYEWEAR_LABEL[e.kind] ?? 'Óculos'}</strong>
                  {od ? <span style={{ display: 'block', fontSize: 12, color: '#5F6A62' }}>OD: {od}</span> : null}
                  {oe ? <span style={{ display: 'block', fontSize: 12, color: '#5F6A62' }}>OE: {oe}</span> : null}
                  {extras.length ? <span style={{ display: 'block', fontSize: 12, color: '#5F6A62' }}>{extras.join(' · ')}</span> : null}
                  {e.fileUrl ? <span style={{ display: 'block', fontSize: 13, marginTop: 2 }}><a href={e.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#0E7580', textDecoration: 'none' }}>Ver documento original</a></span> : null}
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
                    <span style={{ color: '#5F6A62' }}>{TYPE_LABEL[e.type] ?? 'Evento'}{e.professionalKind && PROF_LABEL[e.professionalKind] ? ` (${PROF_LABEL[e.professionalKind]})` : ''}:</span> {e.title}
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
              <li key={i}>{fmt(e.date)} — {e.type}
                {e.fileUrl ? <>{'  ·  '}<a href={e.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#0E7580', textDecoration: 'none', fontSize: 13 }}>Ver documento original</a></> : null}
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
              const extra = [o.laboratory, o.totalFeatures != null ? `${o.totalFeatures.toLocaleString('pt-BR')} marcadores` : null].filter(Boolean).join(', ')
              return <li key={i}>{o.date ? `${fmt(o.date)} — ` : ''}<strong>{DOMAIN_LABEL[o.domain as OmicsDomain] ?? 'Ômica'}</strong>{extra ? ` (${extra})` : ''}</li>
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
              latestPeso ? `Peso ${latestPeso.valueText}${latestPeso.unit ? ` ${latestPeso.unit}` : ''} (${fmt(latestPeso.date)})` : null,
              alturaCm != null ? `Altura ${alturaCm} cm` : null,
              imcVal != null ? `IMC ${imcVal.toFixed(1)} kg/m²` : null,
            ].filter(Boolean).join('  ·  ')}
          </p>
        )}
        {medLaudos.length > 0 ? (
          <ul style={{ paddingLeft: 18, fontSize: 14, margin: 0 }}>
            {medLaudos.map((ex, i) => (
              <li key={i}>
                {ex.type || 'Exame'}{ex.date ? ` · ${fmt(ex.date)}` : ''}
                {ex.fileUrl ? <>{'  ·  '}<a href={ex.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#0E7580', textDecoration: 'none', fontSize: 13 }}>Ver documento original</a></> : null}
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
        <h2 style={{ fontSize: 15 }}>Sinais vitais</h2>
        {vitalArr.length === 0 ? <p style={{ color: '#5F6A62', fontSize: 14 }}>Nenhum registrado.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <tbody>
              {vitalArr.map((m, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #DCE8E3' }}>
                  <td style={{ padding: '6px 12px 6px 0', color: '#5F6A62', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{fmt(m.date)}</td>
                  <td style={{ padding: '6px 0' }}><span style={{ color: '#5F6A62' }}>{m.metric === 'outro_sinal' && m.label ? m.label : METRIC_LABEL[m.metric] ?? 'Sinal'}:</span> {m.valueText}{m.unit ? ` ${m.unit}` : ''}</td>
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
                  <li key={i}><strong>{contraceptiveLabel(c.kind)}</strong>{c.brand ? ` (${c.brand})` : ''}
                    {c.startedOn ? ` — desde ${fmt(c.startedOn)}` : ''}{c.replaceOn ? ` · troca prevista ${fmt(c.replaceOn)}` : ''}
                    {c.status && c.status !== 'ativo' ? ` (${c.status})` : ''}</li>
                ))}
              </ul>
            )}
            {mpArr.length > 0 && (
              <>
                <h3 style={{ fontSize: 12, color: '#5F6A62', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 12, marginBottom: 4 }}>Menstruação</h3>
                <p style={{ fontSize: 14 }}>{mpArr.map(m => fmt(m.startedOn)).join(' · ')}</p>
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
