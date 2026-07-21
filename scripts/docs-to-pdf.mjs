// Gera PDF oficial a partir do Markdown canônico (diretriz da fundadora 20/07):
// "todo documento Approved/Frozen gera também um PDF, preservando a mesma versão".
// Markdown (.md) = documento vivo/versionado no Git · PDF = versão oficial p/ distribuição/arquivamento.
// Pipeline: Markdown → HTML (marked) → PDF (Chrome headless). Sem pandoc/LaTeX.
//
// Uso:  node scripts/docs-to-pdf.mjs <arquivo.md> [<arquivo2.md> ...]
//       node scripts/docs-to-pdf.mjs --approved     (gera todos os docs Approved/Frozen)
//
// Requer: Google Chrome (CHROME_PATH para sobrescrever o caminho).

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { basename, join, resolve } from 'node:path'
import { marked } from 'marked'

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const DOCS = resolve('docs')
const OUT = resolve('docs/pdf')
const TMP = resolve('docs/pdf/.tmp')
mkdirSync(OUT, { recursive: true })
mkdirSync(TMP, { recursive: true })

// Estilo de impressão sóbrio (documento técnico, não landing page).
const CSS = `<style>
  @page { margin: 20mm 18mm; }
  :root { --ink:#1a1a1a; --muted:#555; --rule:#dcdcdc; --accent:#0f766e; --code-bg:#f5f5f4; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: var(--ink);
    font-size: 10.5pt; line-height: 1.5; max-width: 100%; }
  h1 { font-size: 20pt; border-bottom: 2px solid var(--accent); padding-bottom: 6px; }
  h2 { font-size: 14pt; margin-top: 1.4em; border-bottom: 1px solid var(--rule); padding-bottom: 3px; }
  h3 { font-size: 11.5pt; color:#333; }
  a { color: var(--accent); text-decoration: none; }
  code { background: var(--code-bg); padding: 1px 4px; border-radius: 3px; font-size: 9.5pt;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; }
  pre { background: var(--code-bg); padding: 10px 12px; border-radius: 6px; overflow-x: auto; font-size: 9pt; }
  pre code { background: none; padding: 0; }
  table { border-collapse: collapse; width: 100%; font-size: 9.5pt; }
  th, td { border: 1px solid var(--rule); padding: 5px 8px; text-align: left; vertical-align: top; }
  th { background: #f0f5f4; }
  blockquote { border-left: 3px solid var(--accent); margin: 0.6em 0; padding: 2px 12px; color: var(--muted); }
  hr { border: none; border-top: 1px solid var(--rule); margin: 1.4em 0; }
  .footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid var(--rule); color: var(--muted); font-size: 8pt; }
</style>`

// Documentos Approved/Frozen (diretriz: só estes geram PDF). Drafts/Superseded ficam de fora.
const APPROVED = [
  'ADR-000_ARCHITECTURAL_PRINCIPLES.md', 'ADR-001_PROJECAO_SEM_DUPLICACAO_SSOT.md',
  'ARCH-000_DOCUMENT_ARCHITECTURE.md', 'ARCH-002_MOBILE_FIRST_API_FIRST.md',
  'ARCH-003_ARQUITETURA_GERAL_PLATAFORMA.md', 'ARCH-004_ARQUITETURA_INTEGRACOES.md',
  'HIP-001_PLATAFORMA_INTEGRACOES.md', 'HIP-003_ECOSSISTEMA_WEARABLES_ESTUDO.md',
  'HIP-006_ROADMAP_ARQUITETURAL_INTEGRACOES.md', 'HIP-007_ARQUITETURA_ECOSSISTEMA_WEARABLES.md',
  'HIP-008_ARQUITETURA_APP_MOVEL.md', 'HIP-009_ARQUITETURA_SINCRONIZACAO.md',
  'HIP-010_PLANO_EXECUTIVO_ETAPA4.md', 'HIP-011_ARQUITETURA_PRODUTO_MOBILE.md',
  'HIP-012_MASTER_IMPLEMENTATION_PLAN.md', 'IMPLEMENTATION_ROADMAP.md',
  'CATALOGO_PLATAFORMA.md', 'MASTER_DOCUMENT_INDEX.md', 'DOCUMENTATION_GOVERNANCE.md', 'PROJECT_STATUS.md',
  'adr/ADR-002_MOBILE_FIRST.md', 'adr/ADR-003_API_FIRST.md', 'adr/ADR-004_ARQUITETURA_OBSERVACIONAL.md',
  'adr/ADR-005_SSOT_BRUTO_IMUTAVEL.md', 'adr/ADR-006_REACT_NATIVE_EXPO.md', 'adr/ADR-007_MONOREPO.md',
  'adr/ADR-008_ARQUITETURA_SINCRONIZACAO.md', 'adr/ADR-009_ARQUITETURA_BASEADA_EM_DOMINIO.md',
  'adr/ADR-010_IDENTIDADE_VISUAL_UNICA.md', 'adr/ADR-011_ARQUITETURA_COMPONENTES_CROSSPLATFORM.md', 'HIP-013_ARQUITETURA_INTERNA_APP_MOVEL.md',
  'BRAND-001_SISTEMA_IDENTIDADE.md', 'BRAND-002_ESTUDO_TIPOGRAFICO.md', 'COLOR-001_ESTUDO_CROMATICO.md',
  'DS-002_DESIGN_SYSTEM_UNIFICADO.md',
]

const args = process.argv.slice(2)
let targets
if (args.includes('--approved')) {
  targets = APPROVED.map((f) => join(DOCS, f)).filter((f) => { try { readFileSync(f); return true } catch { return false } })
} else if (args.length) {
  targets = args.map((f) => resolve(f))
} else {
  console.error('uso: node scripts/docs-to-pdf.mjs <arquivo.md ...> | --approved'); process.exit(1)
}

let ok = 0
for (const f of targets) {
  const raw = readFileSync(f, 'utf8')
    .replace(/\[\[[^\]|]*\|([^\]]+)\]\]/g, '$1') // [[slug|Rótulo]] -> Rótulo
    .replace(/\[\[([^\]]+)\]\]/g, '$1')          // [[slug]] -> slug
  const base = basename(f, '.md')
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">${CSS}</head><body>${marked.parse(raw)}<div class="footer">SINTERA — documento oficial (PDF gerado do Markdown canônico ${base}.md). Fonte de verdade: Git.</div></body></html>`
  const htmlPath = join(TMP, base + '.html')
  const pdfPath = join(OUT, base + '.pdf')
  writeFileSync(htmlPath, html)
  execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--no-pdf-header-footer',
    `--print-to-pdf=${pdfPath}`, 'file:///' + htmlPath.replace(/\\/g, '/'),
  ], { stdio: 'ignore' })
  console.log('PDF:', 'docs/pdf/' + base + '.pdf')
  ok++
}
console.log(`\n${ok} PDF(s) gerado(s) em docs/pdf/.`)
