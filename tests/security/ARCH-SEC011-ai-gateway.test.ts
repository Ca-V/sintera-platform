// ARCH · SEC-011 — AI Gateway. Guarda estática: o SDK da Anthropic só pode ser importado pelo GATEWAY e sua
// abstração de provider. Qualquer outro arquivo que fale direto com o SDK é um BYPASS do gateway. Hoje existem
// bypasses conhecidos (caminhos clínicos do Ciclo 1) — eles são allowlistados AQUI, com a intenção de REDUZIR
// ao longo do tempo. A guarda NÃO altera runtime; ela impede a introdução de NOVOS bypasses e mantém a lista honesta.
//
// Consolidação de POLÍTICA (não de chamadas): rotear as chamadas existentes pelo gateway é refatoração gated
// (SEC-011, toca fluxo clínico) — fora deste lote. Ver EXDOC-031.
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const SRC = join(process.cwd(), 'src')
const SDK = /@anthropic-ai\/sdk|new\s+Anthropic\s*\(/

// Sancionados: o gateway central e a abstração de provider (a própria infraestrutura de IA).
const SANCTIONED = ['src/lib/ai/gateway.ts', 'src/lib/ai/providers/']

// Bypasses CONHECIDOS (caminhos clínicos legados) — allowlist a ser REDUZIDA (SEC-011 gated).
const KNOWN_BYPASSES = [
  'src/lib/ai/issuer.ts',
  'src/lib/ai/document-classifier.ts',
  'src/lib/ai/requestingPhysician.ts',
  'src/lib/capture/document-understanding.ts',
  'src/app/api/medications/scan/route.ts',
  'src/app/api/capture/classify/route.ts',
  'src/app/api/vision/eyeglasses/route.ts',
  'src/app/api/vision/condition/route.ts',
  'src/app/api/vision/bioimpedance/route.ts',
  'src/app/api/omics/panels/[id]/ingest-pdf/route.ts',
]

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) { if (e !== 'node_modules') walk(p, out) }
    else if (/\.(ts|tsx)$/.test(e) && !/\.test\.tsx?$/.test(e)) out.push(p)
  }
  return out
}
const rel = (p: string) => relative(process.cwd(), p).replace(/\\/g, '/')
const sanctioned = (r: string) => SANCTIONED.some(s => r === s || r.startsWith(s))

describe('ARCH · SEC-011 — SDK de IA só via gateway (bypasses conhecidos, sem novos)', () => {
  const sdkFiles = walk(SRC).map(rel).filter(f => SDK.test(readFileSync(join(process.cwd(), f), 'utf8')))

  it('há arquivos usando o SDK para auditar', () => {
    expect(sdkFiles.length).toBeGreaterThan(0)
  })

  it('nenhum BYPASS NOVO: todo uso do SDK é sancionado ou está na allowlist conhecida', () => {
    const novos = sdkFiles.filter(f => !sanctioned(f) && !KNOWN_BYPASSES.includes(f))
    expect(
      novos,
      `Novo bypass do AI gateway (roteie pelo gateway ou justifique): ${novos.join(' · ')}`,
    ).toEqual([])
  })

  it('allowlist sem entradas obsoletas: todo bypass conhecido ainda usa o SDK (senão, remova daqui)', () => {
    const stale = KNOWN_BYPASSES.filter(f => !sdkFiles.includes(f))
    expect(stale, `Bypass já removido — retire da allowlist: ${stale.join(' · ')}`).toEqual([])
  })

  it('registro objetivo do débito SEC-011 (não é VERDE): há bypasses a reduzir', () => {
    // Documenta o estado real: enquanto houver bypasses, SEC-011 permanece AMARELO.
    expect(KNOWN_BYPASSES.length).toBeGreaterThan(0)
  })
})
