// ARCH · CARE-003 §3.3 — a regra do vínculo é imposta pelo BANCO, não pela tela.
//
// POR QUE ESTE TESTE LÊ SQL. Testar RLS de verdade exige um Postgres, e o CI não tem banco. Sem alguma
// guarda, a policy que protege dado de saúde de terceiro seria a única coisa do repositório sem catraca —
// justamente a que mais precisa. Este teste lê o texto das migrações e verifica as invariantes que dá para
// verificar estaticamente. Não substitui o teste em banco; garante que ninguém as apague sem perceber.
//
// A invariante central: o profissional lê dado de paciente SOMENTE por vínculo ATIVO com o módulo dentro do
// escopo. Toda policy futura que libere leitura ao profissional tem de passar por
// `profissional_tem_vinculo_ativo`.

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const DIR = join(process.cwd(), 'supabase', 'migrations')
const arquivo = (parte: string) => {
  const nome = readdirSync(DIR).find(f => f.includes(parte))
  if (!nome) throw new Error(`migração ${parte} não encontrada`)
  return readFileSync(join(DIR, nome), 'utf8')
}

const sql158 = arquivo('158_care_links')
const semEspacos = (s: string) => s.replace(/\s+/g, ' ')

describe('CARE-003 · a tabela de vínculo', () => {
  it('tem RLS ligada — sem isso toda a proteção é decorativa', () => {
    expect(sql158).toMatch(/alter table public\.care_links enable row level security/i)
  })

  it('NÃO tem policy de DELETE: vínculo encerrado é histórico e prova de auditoria', () => {
    expect(sql158).not.toMatch(/create policy[\s\S]*?on public\.care_links\s+for delete/i)
  })

  it('o estado ativo exige instante de aceite — nada vira ativo em silêncio', () => {
    expect(semEspacos(sql158)).toMatch(/check \(status <> 'ativo' or aceito_em is not null\)/i)
  })

  it('revogação exige quem e quando', () => {
    expect(semEspacos(sql158)).toMatch(/status <> 'revogado' or \(revogado_em is not null and revogado_por is not null\)/i)
  })

  it('convite do profissional exige declaração de relação assistencial', () => {
    expect(semEspacos(sql158)).toMatch(/iniciado_por <> 'profissional' or declaracao_relacao is not null/i)
  })
})

describe('CARE-003 · CATRACA — o profissional não se autoconcede acesso', () => {
  it('a policy de update do profissional só admite estados que ENCERRAM, nunca `ativo`', () => {
    const bloco = sql158.match(/create policy care_links_profissional_update[\s\S]*?;/i)?.[0] ?? ''
    expect(bloco, 'policy de update do profissional não encontrada').not.toBe('')
    expect(semEspacos(bloco)).toMatch(/status in \('recusado','encerrado','revogado'\)/i)
    expect(bloco).not.toMatch(/'ativo'/)
  })

  it('toda policy do profissional confere que o perfil profissional é dele', () => {
    const policies = sql158.match(/create policy care_links_profissional_\w+[\s\S]*?;/gi) ?? []
    expect(policies.length, 'nenhuma policy de profissional encontrada').toBeGreaterThan(0)
    for (const p of policies) {
      expect(semEspacos(p), 'policy sem amarração ao dono do perfil').toMatch(/pp\.user_id = auth\.uid\(\)/)
    }
  })
})

describe('CARE-003 · a função que as tabelas de dado vão consultar', () => {
  const fn = sql158.match(/create or replace function public\.profissional_tem_vinculo_ativo[\s\S]*?\$\$;/i)?.[0] ?? ''

  it('existe', () => {
    expect(fn).not.toBe('')
  })

  it('exige vínculo ATIVO e módulo dentro do escopo — as duas condições', () => {
    expect(semEspacos(fn)).toMatch(/cl\.status = 'ativo'/)
    expect(semEspacos(fn)).toMatch(/p_modulo = any\(cl\.escopo\)/)
  })

  it('é SECURITY INVOKER — menos privilégio, e não cai no alerta de definer executável', () => {
    expect(fn).toMatch(/security invoker/i)
    expect(fn).not.toMatch(/security definer/i)
  })

  it('tem search_path fixo — função sem ele é falha que o próprio linter do projeto acusa', () => {
    expect(fn).toMatch(/set search_path\s*=/i)
  })
})

describe('CARE-003 §2.3 · o convite', () => {
  const sql159 = arquivo('159_care_invites')

  it('tem RLS ligada', () => {
    expect(sql159).toMatch(/alter table public\.care_invites enable row level security/i)
  })

  it('NÃO tem policy de DELETE — apagar recusa permitiria reenviar sem rastro', () => {
    expect(sql159).not.toMatch(/create policy[\s\S]*?on public\.care_invites\s+for delete/i)
  })

  it('o REMETENTE não pode marcar aceito nem recusado', () => {
    const bloco = sql159.match(/create policy care_invites_remetente_update[\s\S]*?;/i)?.[0] ?? ''
    expect(bloco, 'policy de update do remetente não encontrada').not.toBe('')
    expect(semEspacos(bloco)).toMatch(/status in \('enviado','cancelado','expirado'\)/i)
    expect(bloco).not.toMatch(/'aceito'/)
    expect(bloco).not.toMatch(/'recusado'/)
  })

  it('o DESTINATÁRIO só marca aceito ou recusado — não cancela pelo outro', () => {
    const bloco = sql159.match(/create policy care_invites_destinatario_update[\s\S]*?;/i)?.[0] ?? ''
    expect(semEspacos(bloco)).toMatch(/status in \('aceito','recusado'\)/i)
    expect(bloco).not.toMatch(/'cancelado'/)
  })

  it('o token é gerado no banco, não pelo cliente', () => {
    expect(semEspacos(sql159)).toMatch(/default encode\(gen_random_bytes\(32\), 'hex'\)/i)
  })

  it('aceite exige vínculo, e resposta exige instante', () => {
    expect(semEspacos(sql159)).toMatch(/status <> 'aceito' or care_link_id is not null/i)
    expect(semEspacos(sql159)).toMatch(/status not in \('aceito','recusado'\) or respondido_em is not null/i)
  })

  it('a visão do remetente omite `para_user_id` e `token` — saber se a pessoa tem conta é pressão', () => {
    const view = sql159.match(/create or replace view public\.care_invites_do_remetente[\s\S]*?;/i)?.[0] ?? ''
    expect(view, 'visão do remetente não encontrada').not.toBe('')
    expect(view).not.toMatch(/\bpara_user_id\b/)
    expect(view).not.toMatch(/\btoken\b/)
    expect(view, 'sem security_invoker o RLS deixaria de valer').toMatch(/security_invoker\s*=\s*true/i)
  })

  it('nenhuma coluna do convite é de dado clínico', () => {
    const tabela = sql159.match(/create table if not exists public\.care_invites[\s\S]*?\n\);/i)?.[0] ?? ''
    expect(tabela).not.toBe('')
    for (const proibido of ['exame', 'biomarcador', 'diagnostico', 'medicamento', 'laudo', 'resultado', 'condicao']) {
      expect(semEspacos(tabela).toLowerCase(), `coluna clínica no convite: ${proibido}`).not.toMatch(
        new RegExp(`\\b${proibido}\\w*\\s+(text|uuid|jsonb|numeric|boolean|date|timestamptz)`),
      )
    }
  })
})

describe('CARE-003 · nenhuma porta lateral nas demais migrações', () => {
  it('nenhuma policy libera leitura por perfil profissional sem passar pelo vínculo', () => {
    const suspeitas: string[] = []
    for (const f of readdirSync(DIR).filter(x => x.endsWith('.sql'))) {
      const sql = readFileSync(join(DIR, f), 'utf8')
      for (const p of sql.match(/create policy[\s\S]*?;/gi) ?? []) {
        if (!/professional_profiles/i.test(p)) continue
        // A própria tabela de perfil e a de vínculo são as donas da regra — não são porta lateral.
        if (/on public\.(professional_profiles|care_links)/i.test(p)) continue
        // Duas formas exprimem a MESMA exigência, e as duas valem: chamar a função, ou juntar `care_links`
        // e exigir `status = 'ativo'` na própria policy. A segunda é a que a migração 160 usa, porque ali a
        // condição precisa vir junto com a verificação de conselho, no mesmo `exists`.
        const exigeVinculoAtivo = /profissional_tem_vinculo_ativo/i.test(p)
          || (/care_links/i.test(p) && /status\s*=\s*'ativo'/i.test(p))
        if (!exigeVinculoAtivo) suspeitas.push(`${f}: ${semEspacos(p).slice(0, 90)}`)
      }
    }
    expect(suspeitas, `policy citando perfil profissional sem exigir vínculo ativo: ${suspeitas.join(' · ')}`).toEqual([])
  })
})
