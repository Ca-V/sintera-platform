// ARCH · HIP-010 — FRONTEIRA DA CAMADA DE CONECTORES.
//
// DUAS REGRAS, com motivos diferentes:
//
//   1. A lógica PURA de conector vive em `packages/core`, alcançável pelas duas pontas.
//      Porque o Health Connect roda NO APARELHO: o Mobile precisa da camada, não só a Web.
//      Em 25/08 os 10 módulos viviam em `src/lib/connectors/`, onde o Mobile não chega — e isso
//      não era dívida estética, era impedimento: não havia como sincronizar wearables no Android
//      com o código onde estava.
//
//   2. Escrita PRIVILEGIADA (service-role) NUNCA entra em `packages/`.
//      Porque `packages/` é empacotado no aplicativo. Um cliente service-role ali levaria
//      credencial de escrita irrestrita para dentro de um binário distribuído a usuários.
//      A regra 1 empurra código para `packages/`; esta existe para que o empurrão não leve junto
//      o que não pode ir.
//
//      A distinção fina, e que é fácil errar: o que não pode migrar é a CREDENCIAL, não o código
//      que a usa. `persist.ts` (antes `supabase-persist.ts`) foi para `@sintera/api-client` porque
//      é agnóstico — recebe um cliente e não sabe qual. O servidor lhe entrega um cliente
//      service-role; o aparelho, o cliente da sessão da pessoa. Já `runtime.server.ts`, que RESOLVE
//      a chave a partir do ambiente, permanece na Web e nunca pode sair de lá.
//
// Nenhuma das duas admite lista de dívida: são invariantes, não catracas. Ambas valiam no
// momento em que este arquivo foi escrito e devem continuar valendo.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()

/** Os módulos puros da camada de conectores — contratos + lógica determinística, IO injetada. */
const MODULOS_PUROS = [
  'connector', 'oauth', 'registry', 'persistence', 'orchestrator',
  'connections', 'syncService', 'webhook', 'mock',
] as const

/** Marcas de credencial privilegiada. Qualquer uma delas dentro de `packages/` é falha. */
const MARCAS_SERVICE_ROLE = [/SERVICE_ROLE/, /service_role/, /serviceRole/]

function varrer(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out
  for (const nome of readdirSync(dir)) {
    if (nome === 'node_modules' || nome === 'dist' || nome.startsWith('.')) continue
    const p = join(dir, nome)
    if (statSync(p).isDirectory()) varrer(p, out)
    else if (/\.tsx?$/.test(nome)) out.push(p)
  }
  return out
}

const rel = (p: string) => relative(ROOT, p).split('\\').join('/')

describe('HIP-010 · fronteira da camada de conectores', () => {
  it('os módulos puros vivem em packages/core, alcançáveis pelo Mobile', () => {
    const faltando = MODULOS_PUROS.filter(
      m => !existsSync(join(ROOT, 'packages/core/src/domain/connectors', `${m}.ts`)),
    )
    expect(faltando, 'módulo puro ausente de packages/core/src/domain/connectors').toEqual([])
  })

  it('nenhum módulo puro reaparece em src/lib/connectors (onde o Mobile não alcança)', () => {
    const voltaram = MODULOS_PUROS.filter(
      m => existsSync(join(ROOT, 'src/lib/connectors', `${m}.ts`)),
    )
    expect(voltaram, 'módulo puro de volta na Web — o Mobile deixa de alcançá-lo').toEqual([])
  })

  it('o core exporta a camada, senão nenhuma ponta a consome', () => {
    const index = readFileSync(join(ROOT, 'packages/core/src/index.ts'), 'utf8')
    const naoExportados = MODULOS_PUROS.filter(m => !index.includes(`./domain/connectors/${m}`))
    expect(naoExportados, 'módulo em packages/core sem export no index — inalcançável na prática').toEqual([])
  })

  it('NENHUM código com credencial service-role dentro de packages/', () => {
    const infratores = varrer(join(ROOT, 'packages'))
      .filter(f => {
        const corpo = readFileSync(f, 'utf8')
        return MARCAS_SERVICE_ROLE.some(re => re.test(corpo))
      })
      .map(rel)
    expect(infratores, 'escrita privilegiada em pacote empacotado no aplicativo').toEqual([])
  })

  it('packages/ não importa de src/ — a dependência só aponta para dentro', () => {
    const infratores = varrer(join(ROOT, 'packages'))
      .filter(f => /from\s+'@\/|from\s+'(\.\.\/)+src\//.test(readFileSync(f, 'utf8')))
      .map(rel)
    expect(infratores, 'pacote compartilhado dependendo da Web').toEqual([])
  })
})
