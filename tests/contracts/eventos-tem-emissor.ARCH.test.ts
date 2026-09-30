// ARCH · VAL-001 — evento no catálogo tem que ter quem o emita, e quem emite tem que validar.
//
// ============================================================================================
// O PADRÃO QUE ISTO IMPEDE
// ============================================================================================
// Em 29/09/2026, ao ligar a telemetria, encontrei o estado clássico do "especificado mas nunca ligado":
//
//   · o catálogo de eventos existia (`EVENTOS`, no core)
//   · a lista de metadados proibidos existia (`METADATA_PROIBIDA`)
//   · as duas funções que julgam isso existiam, com testes próprios
//   · **nada no runtime as chamava**, e NENHUM evento do vínculo era emitido
//
// Catálogo, regra e teste de um lado; o caminho por onde o evento realmente passa do outro, sem se falarem.
//
// O CUSTO É ESPECÍFICO E DEMORA A APARECER. Um nome digitado errado — `conviteEnviado` em vez de
// `convite_enviado` — grava sem reclamar e some da análise. Meses depois a coorte não fecha e ninguém sabe
// por quê, porque o dado nunca existiu sob o nome que a consulta procura. É o tipo de defeito que só se
// descobre quando já não dá para recuperar o período.
//
// ============================================================================================
// O QUE ESTA CATRACA EXIGE
// ============================================================================================
// 1. Todo evento do catálogo tem pelo menos um lugar que o emite — ou está declarado como pendente, com
//    motivo. Um evento sem emissor é uma promessa de medição que ninguém cumpre.
// 2. O caminho de escrita valida contra o catálogo e contra os metadados. A regra que não é consultada no
//    ponto de escrita não é regra: é documentação.
//
// LIMITE DECLARADO: a varredura é textual. Um emissor que monte o nome do evento dinamicamente não é visto —
// e é por isso que a validação em tempo de execução (item 2) existe: ela pega o que a busca não pega.

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { EVENTOS, EVENTOS_LEGADOS, METADATA_PERMITIDA } from '@sintera/core'

const ROOT = process.cwd()
const FONTES = ['packages/api-client/src', 'packages/core/src', 'src', 'apps/mobile/src']

/**
 * Eventos que AINDA não têm emissor, com o motivo. A lista é o contrário de uma exceção: ela obriga a
 * declarar por escrito o que falta, em vez de deixar o buraco passar despercebido.
 *
 * Cada linha aqui é dívida nomeada. Quando o fluxo existir, o evento sai desta lista — e se alguém tentar
 * remover a linha sem ligar o emissor, a catraca reprova.
 */
const SEM_EMISSOR_AINDA: Readonly<Record<string, string>> = {
  // Ciclo de vida — dependem do onboarding e da definição de "primeiro valor", que é deliberadamente estrita.
  cadastro_concluido: 'o cadastro ainda não emite; entra junto com a revisão do onboarding',
  onboarding_concluido: 'idem',
  primeiro_valor: 'definição estrita (ver a pessoa o próprio dado organizado) — precisa de um ponto único de leitura, não de um palpite por tela',
  sessao_iniciada: 'exige decidir o que conta como sessão; medir errado é pior do que não medir',

  // Comercial — nada disso existe ainda: não há compra, plano nem pagamento na plataforma.
  plano_visualizado: 'BILLING-003 sem consumidor: não existe tela de plano',
  checkout_iniciado: 'não existe caminho de compra',
  assinatura_criada: 'idem',
  assinatura_cancelada: 'idem',
  pagamento_falhou: 'não existe meio de pagamento',

  // Documentos propostos pelo profissional — depende da questão 3 do Briefing Jurídico.
  documento_proposto: 'fluxo bloqueado pela questão 3 do Briefing Jurídico',
  documento_aceito: 'idem',
  documento_recusado: 'idem',

  // Conectores — emitidos por outro caminho (runtime.server), com nomes próprios daquele fluxo.
  conexao_iniciada: 'os conectores emitem por `logConnectorEvent`; unificar é frente própria',
  conexao_concluida: 'idem',
  conexao_falhou: 'idem',
  documento_proprio_enviado: 'a captura ainda não emite; entra com a revisão do fluxo de anexo',

  coorte_atribuida: 'gravado no cadastro, que ainda não emite',
}

function varrer(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out
  for (const n of readdirSync(dir)) {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) varrer(p, out)
    else if (/\.(ts|tsx)$/.test(n) && !/\.test\.tsx?$/.test(n)) out.push(p)
  }
  return out
}

const fontes = FONTES.flatMap(b => varrer(join(ROOT, b)))
  .map(p => ({ caminho: p.slice(ROOT.length + 1).replace(/\\/g, '/'), src: readFileSync(p, 'utf8') }))
  // O próprio catálogo cita todos os nomes; contá-lo faria tudo parecer emitido.
  .filter(f => !f.caminho.includes('domain/telemetria/'))

/** Alguém emite este evento? Procura o nome entre aspas numa chamada de registro. */
function temEmissor(nome: string): boolean {
  const re = new RegExp(`(logUsageEvent|logEvent|registrarEvento|event_name)[^\\n]{0,80}['"\`]${nome}['"\`]|['"\`]${nome}['"\`][^\\n]{0,40}\\)`)
  return fontes.some(f => re.test(f.src))
}

describe('ARCH · VAL-001 — todo evento do catálogo tem emissor, ou dívida declarada', () => {
  it('a varredura encontra arquivos — senão a catraca não mede nada', () => {
    expect(fontes.length).toBeGreaterThan(50)
  })

  it('nenhum evento fica sem emissor E sem motivo declarado', () => {
    const orfaos = EVENTOS
      .filter(e => !EVENTOS_LEGADOS.includes(e as never))
      .filter(e => !temEmissor(e) && !SEM_EMISSOR_AINDA[e])
    expect(
      orfaos,
      'Evento no catálogo sem quem o emita é promessa de medição que ninguém cumpre.\n' +
        'Ligue o emissor, ou declare a dívida em SEM_EMISSOR_AINDA com o motivo.\n\n' + orfaos.join('\n'),
    ).toEqual([])
  })

  it('a lista de dívida não guarda evento que JÁ é emitido', () => {
    // Sem isto, a lista viraria depósito: um evento ligado continuaria declarado como pendente, e a catraca
    // pararia de medir justamente o que passou a funcionar.
    const mentirosos = Object.keys(SEM_EMISSOR_AINDA).filter(e => temEmissor(e))
    expect(
      mentirosos,
      'Estes eventos já têm emissor — tire-os de SEM_EMISSOR_AINDA:\n' + mentirosos.join('\n'),
    ).toEqual([])
  })

  it('CASO CONHECIDO · os eventos do vínculo estão ligados', () => {
    // CARE-003 é a frente construída esta semana, e é a que a fundadora vai medir primeiro.
    for (const e of ['convite_enviado', 'convite_aceito', 'convite_recusado', 'vinculo_criado', 'vinculo_revogado']) {
      expect(temEmissor(e), `"${e}" perdeu o emissor`).toBe(true)
    }
  })
})

describe('ARCH · VAL-001 — o ponto de escrita valida', () => {
  const log = readFileSync(join(ROOT, 'packages/api-client/src/events/log.ts'), 'utf8')

  it('o nome do evento é conferido contra o catálogo antes de gravar', () => {
    // Um nome digitado errado grava sem reclamar e some da análise. Meses depois a coorte não fecha.
    expect(log).toContain('ehEventoConhecido')
  })

  it('o metadado é conferido antes de gravar', () => {
    // `usage_events` é telemetria, não prontuário: um campo com dado de saúde passaria a viver fora do
    // regime de acesso que o resto da plataforma respeita.
    expect(log).toContain('problemasNoMetadata')
  })

  it('a validação RECUSA, e não corrige em silêncio', () => {
    // Renomear ou truncar sozinho produziria um dado que ninguém pediu e que parece legítimo na análise.
    expect(log).toMatch(/return \{ error: new Error\(`Evento fora do catálogo/)
  })

  it('todo metadado usado pelos emissores está na lista permitida', () => {
    // A lista existe para impedir que um campo novo entre sem ninguém olhar. Se o emissor usa uma chave que
    // ela não conhece, a gravação seria recusada em produção — e este teste acha isso antes.
    const usadas = new Set<string>()
    for (const f of fontes) {
      for (const m of f.src.matchAll(/logUsageEvent\([^,]+,\s*['"`][\w-]+['"`],\s*\{([^}]*)\}/g)) {
        for (const chave of m[1].matchAll(/(\w+)\s*:/g)) usadas.add(chave[1].toLowerCase())
      }
    }
    const fora = [...usadas].filter(k => !METADATA_PERMITIDA.includes(k))
    expect(fora, 'chaves usadas pelos emissores e ausentes de METADATA_PERMITIDA: ' + fora.join(', ')).toEqual([])
  })
})
