// Teste de fidelidade: o backfill do Catalog v2 (migration 087) deve inserir em
// `materials`/`panels` EXATAMENTE os rótulos hoje em lib/biomarkers/panels.ts
// (fonte transicional → SSOT no banco). Qualquer drift entre a fonte e a migration
// quebra este teste antes de a migração ser executada (Sprint 3B).
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { SPECIMEN_LABEL, SPECIMEN_ORDER, CATEGORY_LABEL } from './panels'

const MIGR_DIR = join(process.cwd(), 'supabase', 'migrations')

function readMigration(suffix: string): string {
  const file = readdirSync(MIGR_DIR).find((f) => f.endsWith(suffix))
  if (!file) throw new Error(`migration não encontrada: *${suffix}`)
  return readFileSync(join(MIGR_DIR, file), 'utf8')
}

const backfill = readMigration('_087_catalog_v2_backfill.sql')

// escapa aspas simples do SQL ('' ) para casar com o literal JS
const sqlLit = (s: string) => s.replace(/'/g, "''")

describe('Catalog v2 backfill — fidelidade com panels.ts', () => {
  it('materials: cada specimen entra com label e sort_order = SPECIMEN_ORDER', () => {
    for (const key of Object.keys(SPECIMEN_LABEL)) {
      const order = SPECIMEN_ORDER.indexOf(key)
      const expected = `('${key}', '${sqlLit(SPECIMEN_LABEL[key])}', ${order})`
      // normaliza espaços múltiplos do alinhamento do SQL
      const flat = backfill.replace(/\s+/g, ' ')
      expect(flat, `materials deve conter ${expected}`).toContain(expected)
    }
  })

  it('panels: cada category entra com o CATEGORY_LABEL exato', () => {
    const flat = backfill.replace(/\s+/g, ' ')
    for (const [key, label] of Object.entries(CATEGORY_LABEL)) {
      const cell = `('${key}', '${sqlLit(label)}',`
      expect(flat, `panels deve conter ${cell}`).toContain(cell)
    }
  })

  it('não insere material/painel além dos definidos em panels.ts', () => {
    // isola o bloco VALUES de cada INSERT (do "insert into" até o "on conflict")
    const block = (table: string) => {
      const start = backfill.indexOf(`insert into public.${table}`)
      const end = backfill.indexOf('on conflict', start)
      return backfill.slice(start, end)
    }
    const rows = (s: string) => (s.match(/\(\s*'/g) ?? []).length

    expect(rows(block('materials'))).toBe(Object.keys(SPECIMEN_LABEL).length)
    expect(rows(block('panels'))).toBe(Object.keys(CATEGORY_LABEL).length)

    // toda category/material referenciada deve existir em panels.ts (sem id órfão)
    const known = new Set([...Object.keys(SPECIMEN_LABEL), ...Object.keys(CATEGORY_LABEL)])
    for (const m of [...block('materials').matchAll(/\(\s*'([a-z_0-9]+)'/g),
                     ...block('panels').matchAll(/\(\s*'([a-z_0-9]+)'/g)]) {
      expect(known.has(m[1]), `id inesperado no backfill: ${m[1]}`).toBe(true)
    }
  })
})
