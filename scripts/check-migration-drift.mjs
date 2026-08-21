#!/usr/bin/env node
// Anti-drift do histórico de migrations.
//
// Motivação: em 21/08/2026 a reconciliação encontrou 13 migrations aplicadas em produção que
// nunca entraram no Git, mais 2 operações aplicadas fora do ledger. A regra "toda mudança de
// schema entra primeiro como arquivo em migrations/" já existia em supabase/README.md e não foi
// seguida. Regra em documento não se sustenta; este check a torna executável.
//
// O que verifica: todo registro de `supabase_migrations.schema_migrations` no banco alvo precisa
// ter um arquivo correspondente em supabase/migrations/. A comparação é por NOME NORMALIZADO,
// não por `version` — os timestamps divergem historicamente entre Git e produção, e comparar por
// `version` produz ruído (102 falsos positivos) em vez de sinal.
//
// Uso:  SUPABASE_DB_URL='postgresql://...' node scripts/check-migration-drift.mjs
// Requer `psql` no PATH.
//
// ESTADO CONHECIDO EM 2026-08-21 — LEIA ANTES DE ATIVAR O WORKFLOW:
// este check acusa 2 drifts que sao FALSOS POSITIVOS conhecidos:
//   - shield_p0_pin_search_path_omics  (ledger 20260711221715)
//   - life_habits_goal_plan_134        (ledger 20260721215043)
// Ambas tem efeito ja produzido por arquivos do Git com NOME diferente
// (shield_p0_pin_search_path e 134_life_habits_goal_plan), comprovado por diff estrutural.
// Nao foram materializadas para nao criar migrations redundantes.
// Ver docs/RECONCILIACAO-SCHEMA-2026-08-21.md secao 7.
// DECISAO PENDENTE: allowlist explicita aqui, ou materializar as duas.
// Ate la, este check falha na primeira execucao. Isso e esperado, nao e drift novo.

import { execFileSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const MIGRATIONS_DIR = join(ROOT, 'supabase', 'migrations')

// Remove o prefixo numérico de sequência ("001_", "022b_", "126_") para comparar nomes lógicos.
const normalize = (name) => name.replace(/^[0-9]+[a-z]?_/, '')

const dbUrl = process.env.SUPABASE_DB_URL
if (!dbUrl) {
  console.error('❌ SUPABASE_DB_URL não definido. Sem ele não há como comparar com o ledger.')
  process.exit(1)
}

// A credencial não vai para o argv: passar a URL como argumento a exporia na lista de processos
// do runner e em eventuais mensagens de erro. Ela é decomposta em variáveis PG* do ambiente.
let pgEnv
try {
  const u = new URL(dbUrl)
  pgEnv = {
    PGHOST: u.hostname,
    PGPORT: u.port || '5432',
    PGUSER: decodeURIComponent(u.username),
    PGPASSWORD: decodeURIComponent(u.password),
    PGDATABASE: u.pathname.replace(/^\//, '') || 'postgres',
    PGSSLMODE: 'require',
  }
} catch {
  console.error('❌ SUPABASE_DB_URL não é uma URL de conexão válida.')
  process.exit(1)
}

let remoteRaw
try {
  remoteRaw = execFileSync(
    'psql',
    ['-At', '-c', 'select name from supabase_migrations.schema_migrations order by version'],
    { encoding: 'utf8', env: { ...process.env, ...pgEnv } },
  )
} catch (err) {
  console.error('❌ Falha ao consultar o ledger:', err.message)
  process.exit(1)
}

const remote = remoteRaw.split('\n').map((s) => s.trim()).filter(Boolean)
const remoteNames = new Set(remote.map(normalize))

const local = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql'))
  .map((f) => f.replace(/\.sql$/, ''))
  .filter((f) => f.length > 15)
  .map((f) => normalize(f.slice(15)))
const localNames = new Set(local)

// DRIFT que bloqueia: aplicado no banco e ausente do Git. É a lacuna que gerou este check.
const orphans = [...remoteNames].filter((n) => !localNames.has(n))

// Informativo: arquivo no Git ainda não registrado no ledger. Esperado enquanto a reconciliação
// do ledger (migration repair) não for executada — não bloqueia.
const unapplied = [...localNames].filter((n) => !remoteNames.has(n))

console.log(`ledger: ${remoteNames.size} migrations · repositório: ${localNames.size} arquivos`)

if (unapplied.length) {
  console.log(`\nℹ️  ${unapplied.length} arquivo(s) sem registro no ledger (não bloqueia):`)
  for (const n of unapplied.sort()) console.log(`   · ${n}`)
}

if (orphans.length) {
  console.error(`\n❌ DRIFT: ${orphans.length} migration(s) aplicada(s) no banco e AUSENTE(S) do Git:`)
  for (const n of orphans.sort()) console.error(`   · ${n}`)
  console.error(
    '\nToda mudança de schema entra primeiro como arquivo em supabase/migrations/ (supabase/README.md).',
  )
  console.error('Recupere o DDL literal de supabase_migrations.schema_migrations e versione-o.')
  process.exit(1)
}

console.log('\n✅ Sem drift: todo registro do ledger tem arquivo correspondente.')
