// @sintera/core — A ROTINA DECLARADA ENCONTRA AS SESSÕES OBSERVADAS.
//
// Por que este arquivo existe (homologação de 31/08/2026).
//
// A fundadora abriu Hábitos e Monitoramento e viu atividade física nos dois. Não eram cópias: em Hábitos
// estava "Musculação, diário" — uma declaração, sem data; em Monitoramento estavam 26 sessões de musculação
// com horário, duração e calorias — o fato. A plataforma guardava as duas metades e nunca as encostava.
//
// Encostar as duas É o dossiê. Nos dados reais dela:
//
//     declarado "Musculação, diário"        → 26 sessões em 27 dias
//     declarado "Corrida, 2x por semana"    →  4 sessões em 4 semanas
//     declarado "Tênis, 1x por semana"      →  nenhuma sessão registrada
//
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// A PLATAFORMA NÃO INTERPRETA (ADR-000 / RDC 657/2022).
//
// Este módulo CONTA e APRESENTA. Ele nunca diz "você cumpriu", "está abaixo da meta", "precisa melhorar",
// nem atribui cor, nota ou juízo. Quem lê a contagem ao lado da declaração tira a própria conclusão — e é
// essa a leitura que se leva ao profissional de saúde.
//
// A tentação de escrever "meta atingida ✅" é grande e é exatamente o que não se pode fazer: "2x por semana"
// é texto livre, não é número comparável, e transformar frequência declarada em avaliação de desempenho é
// interpretar. Contamos sessões; a frase diz sessões.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
import { activityTypeLabel } from './activity'

/** A intenção declarada — hoje uma linha de `life_habits`, guardada como sempre foi. */
export interface RotinaDeclarada {
  readonly id: string
  /** O que a pessoa escreveu: "Musculação", "Corrida", "Tênis". */
  readonly descricao: string
  /** Como ela escreveu a frequência: "Diário", "2 vezes por semana". TEXTO LIVRE — nunca comparado a número. */
  readonly frequencia: string | null
}

/** O fato observado — uma sessão, vinda de dispositivo ou digitada. */
export interface SessaoObservada {
  readonly activity_type?: string | null
  readonly title?: string | null
  /** ISO-8601. Registro sem instante legível é ignorado, nunca contado como hoje. */
  readonly started_at?: string | null
}

export interface RotinaConfrontada {
  readonly id: string
  readonly descricao: string
  readonly frequencia: string | null
  /** Quantas sessões correspondentes caíram na janela. */
  readonly sessoes: number
  readonly dias: number
  /** Frase factual, pronta para a tela. Sem juízo. */
  readonly frase: string
}

/** Janela padrão de observação. 30 dias cobre o que um mês de consulta cobre. */
export const JANELA_ROTINA_DIAS = 30

/** minúsculas, sem acento, sem espaço sobrando. "Musculação" e "musculacao" viram a mesma coisa. */
export function normalizarAtividade(s: string | null | undefined): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // marcas de acento EM ESCAPE: caractere invisivel no fonte e armadilha
    .toLowerCase()
    .trim()
}

/**
 * Esta sessão corresponde a esta rotina?
 *
 * Três caminhos, do mais forte ao mais fraco, porque a pessoa escreve livremente e o dispositivo não:
 *   1. o tipo bate com o que ela escreveu   ("Musculação" ↔ activity_type 'musculacao')
 *   2. o RÓTULO do tipo bate                 ("Corrida"    ↔ rótulo 'Corrida')
 *   3. o título da sessão contém o texto     ("Tênis"      ↔ título "Tênis com a Ana")
 *
 * NÃO tenta ser esperta além disso. Uma correspondência inventada contaria uma sessão que não aconteceu —
 * e um número errado sobre a própria saúde é pior que um número ausente.
 */
export function sessaoCorrespondeARotina(sessao: SessaoObservada, descricao: string): boolean {
  const alvo = normalizarAtividade(descricao)
  if (!alvo) return false
  const tipo = normalizarAtividade(sessao.activity_type)
  if (tipo && tipo === alvo) return true
  if (tipo && normalizarAtividade(activityTypeLabel(sessao.activity_type)) === alvo) return true
  const titulo = normalizarAtividade(sessao.title)
  return titulo ? titulo.includes(alvo) : false
}

/** A sessão caiu dentro da janela que termina em `agora`? Instante ilegível NÃO conta. */
function dentroDaJanela(sessao: SessaoObservada, agora: Date, dias: number): boolean {
  if (!sessao.started_at) return false
  const t = new Date(sessao.started_at).getTime()
  if (!Number.isFinite(t)) return false
  const fim = agora.getTime()
  return t <= fim && t >= fim - dias * 24 * 60 * 60 * 1000
}

/** A frase que vai à tela. Factual: conta sessões, não avalia ninguém. */
export function fraseDaRotina(sessoes: number, dias: number): string {
  if (sessoes === 0) return `Nenhuma sessão registrada nos últimos ${dias} dias`
  return `${sessoes} ${sessoes === 1 ? 'sessão registrada' : 'sessões registradas'} nos últimos ${dias} dias`
}

/**
 * Confronta cada rotina declarada com as sessões observadas. PURA — recebe `agora`, não o consulta.
 *
 * Recebe `agora` de propósito: uma função que lê o relógio não é testável, e uma contagem de saúde que muda
 * conforme a hora do teste não é conferível.
 */
export function confrontarRotinas(
  rotinas: readonly RotinaDeclarada[],
  sessoes: readonly SessaoObservada[],
  agora: Date,
  dias: number = JANELA_ROTINA_DIAS,
): RotinaConfrontada[] {
  const naJanela = sessoes.filter(s => dentroDaJanela(s, agora, dias))
  return rotinas.map(r => {
    const n = naJanela.filter(s => sessaoCorrespondeARotina(s, r.descricao)).length
    return {
      id: r.id,
      descricao: r.descricao,
      frequencia: r.frequencia,
      sessoes: n,
      dias,
      frase: fraseDaRotina(n, dias),
    }
  })
}

/**
 * Separa, de tudo que está guardado em `life_habits`, o que é ROTINA DE ATIVIDADE FÍSICA.
 *
 * Fica aqui, e não em cada tela, porque as duas pontas precisam concordar sobre o que é rotina de atividade —
 * e um filtro escrito duas vezes é a forma exata como o sinal do peso e a lista de formatos divergiram.
 */
export function rotinasDeAtividade(
  habitos: readonly { id: string; category?: string | null; description?: string | null; frequency?: string | null }[],
): RotinaDeclarada[] {
  return habitos
    .filter(h => (h.category ?? '') === CATEGORIA_ROTINA_ATIVIDADE && (h.description ?? '').trim())
    .map(h => ({ id: h.id, descricao: (h.description ?? '').trim(), frequencia: h.frequency ?? null }))
}

/** A categoria sob a qual a rotina é guardada. Continua sendo `life_habits` — nenhum dado foi migrado. */
export const CATEGORIA_ROTINA_ATIVIDADE = 'atividade_fisica'

/** "Musculação · declarado: diário" — ou só a descrição, quando não houve frequência declarada. */
export function rotinaLinha(r: Pick<RotinaConfrontada, 'descricao' | 'frequencia'>): string {
  const f = r.frequencia?.trim()
  return f ? `${r.descricao} · declarado: ${f}` : r.descricao
}
