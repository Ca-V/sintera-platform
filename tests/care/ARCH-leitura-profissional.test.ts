// ARCH · CARE-003 §3.3 — a leitura do profissional é só leitura, e só do que a pessoa autorizou.
//
// Este é o teste que guarda a mudança de RLS de maior alcance da plataforma. Ele lê o SQL da migração 161 e
// verifica quatro coisas que, se alguém desfizer, ninguém perceberia até vazar dado de saúde de terceiro:
//
//   1. Toda policy nova é `for select`. Nenhuma escrita é concedida a profissional — o CARE-001 §3.6 diz que
//      ele NUNCA altera a base do paciente, e aqui isso vira forma do arquivo, não disciplina de quem escreve.
//   2. Toda policy passa por `profissional_tem_vinculo_ativo`, que exige vínculo ATIVO e módulo no escopo.
//   3. Cada tabela usa o módulo CERTO. Trocar 'medidas' por 'exames' numa delas abriria uma porta que a pessoa
//      não autorizou, e o teste passaria se só conferisse "chama a função".
//   4. Nenhuma tabela FORA do escopo declarado ganhou policy. Hábitos, ciclo, contracepção, medicamentos e
//      saúde da mulher ficam de fora por decisão (CARE-003 §3.2) — são os dados em que a exposição indesejada
//      custa mais caro.

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const DIR = join(process.cwd(), 'supabase', 'migrations')
const nome = readdirSync(DIR).find(f => f.includes('161_leitura_do_profissional'))
const sql = nome ? readFileSync(join(DIR, nome), 'utf8') : ''

/** Tabela → módulo do escopo que a libera. É o contrato desta migração. */
const ESPERADO: Readonly<Record<string, string>> = {
  exams: 'exames',
  biomarkers: 'exames',
  clinical_results: 'exames',
  body_metrics: 'medidas',
  patient_documents: 'documentos',
  patient_document_files: 'documentos',
  patient_document_links: 'documentos',
  health_events: 'historico-saude',
}

/** Não podem aparecer aqui. Entram, se um dia entrarem, por migração própria e decisão explícita. */
const FORA_DO_ESCOPO = [
  'life_habits', 'menstrual_periods', 'contraceptive_methods', 'medications',
  'health_conditions', 'daily_logs', 'omics_results', 'care_invites',
]

const policies = sql.match(/create policy[\s\S]*?;/gi) ?? []

describe('CARE-003 §3.3 · a migração existe e cobre o escopo declarado', () => {
  it('a migração 161 foi encontrada', () => {
    expect(nome, 'migração 161 ausente').toBeTruthy()
  })

  it('há uma policy para cada tabela do escopo, e nenhuma a mais', () => {
    const tabelas = policies
      .map(p => p.match(/on public\.(\w+)/)?.[1] ?? '')
      .filter(Boolean)
      .sort()
    expect(tabelas).toEqual(Object.keys(ESPERADO).sort())
  })
})

describe('CARE-003 §3.6 · CATRACA — o profissional NÃO escreve', () => {
  it('toda policy da migração é `for select`', () => {
    const escritas = policies.filter(p => /for\s+(insert|update|delete|all)\b/i.test(p))
    expect(
      escritas.map(p => p.match(/create policy (\w+)/i)?.[1]),
      'CARE-001 §3.6: o profissional nunca altera a base do paciente',
    ).toEqual([])
  })

  it('nenhuma policy da migração tem `with check` — isso seria escrita', () => {
    expect(policies.filter(p => /with\s+check/i.test(p))).toEqual([])
  })

  it('a migração não altera nem remove policy existente do dono', () => {
    // Só pode derrubar as que ela própria cria. Um `drop policy` de outra seria reescrever a regra do dono.
    const drops = [...sql.matchAll(/drop policy if exists (\w+)/gi)].map(m => m[1])
    for (const d of drops) {
      expect(d, `derruba policy que não é dela: ${d}`).toMatch(/_profissional_select$/)
    }
  })
})

describe('CARE-003 §3.3 · CATRACA — vínculo ativo e módulo certo', () => {
  it.each(Object.entries(ESPERADO))('%s libera pelo módulo "%s", e só por ele', (tabela, modulo) => {
    const p = policies.find(x => new RegExp(`on public\\.${tabela}\\b`).test(x))
    expect(p, `sem policy para ${tabela}`).toBeTruthy()
    expect(p!, `${tabela} não passa pelo vínculo`).toMatch(/profissional_tem_vinculo_ativo\s*\(/)
    expect(p!, `${tabela} deveria usar o módulo ${modulo}`).toContain(`'${modulo}'`)

    // E não pode usar OUTRO módulo: liberar exames pelo escopo de medidas abriria porta não autorizada.
    const outros = [...new Set(Object.values(ESPERADO))].filter(m => m !== modulo)
    for (const o of outros) expect(p!, `${tabela} usa também o módulo ${o}`).not.toContain(`'${o}'`)
  })

  it('a função é chamada sempre com o `user_id` da linha — nunca com valor fixo', () => {
    for (const p of policies) {
      expect(p, 'chamada sem user_id da linha').toMatch(/profissional_tem_vinculo_ativo\(\s*user_id\s*,/)
    }
  })
})

describe('CARE-003 §3.2 · CATRACA — o que fica de fora continua de fora', () => {
  it.each(FORA_DO_ESCOPO)('%s não ganha policy de profissional', (tabela) => {
    expect(sql, `${tabela} entrou no escopo sem decisão explícita`).not.toMatch(
      new RegExp(`on public\\.${tabela}\\b`),
    )
  })

  it('nenhuma outra migração libera essas tabelas ao profissional', () => {
    const vazamentos: string[] = []
    for (const f of readdirSync(DIR).filter(x => x.endsWith('.sql'))) {
      const s = readFileSync(join(DIR, f), 'utf8')
      for (const p of s.match(/create policy[\s\S]*?;/gi) ?? []) {
        if (!/profissional_tem_vinculo_ativo/i.test(p)) continue
        const t = p.match(/on public\.(\w+)/)?.[1] ?? ''
        if (FORA_DO_ESCOPO.includes(t)) vazamentos.push(`${f}: ${t}`)
      }
    }
    expect(vazamentos, `tabela fora do escopo liberada ao profissional: ${vazamentos.join(' · ')}`).toEqual([])
  })
})
