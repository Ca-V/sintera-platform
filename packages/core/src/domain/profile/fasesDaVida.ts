// @sintera/core — A FASE DA VIDA, calculada a partir da data de nascimento.
//
// POR QUE A DATA DE NASCIMENTO PASSOU A EXISTIR (decisão da fundadora, 31/08). O perfil guardava FAIXA ETÁRIA,
// e faixa não serve para o começo da vida: entre os 2 e os 8 meses um bebê muda de tudo, e "0 a 5 anos" trata
// um recém-nascido e uma criança de cinco anos como a mesma coisa. Curva de crescimento, marcos e calendário
// dependem da idade EXATA.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// O QUE ESTE ARQUIVO NÃO FAZ, e é o mais importante:
//
// Ele NÃO diz o que fazer em cada fase. Não indica exame, não sugere consulta, não afirma o que é esperado
// para a idade. Isso é conteúdo clínico, exige responsável técnico com CRM (ADR-CK-001), e não está aqui.
//
// Ele calcula IDADE e nomeia a FASE. É aritmética de calendário e vocabulário — do mesmo tipo de "este
// documento é uma receita". A fronteira entre ORGANIZAR e INTERPRETAR passa exatamente aqui, e é ela que
// separa a SINTERA de software médico.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
//
// LGPD. A data de nascimento é dado pessoal, e a plataforma a trata como tal:
//   - OPCIONAL. Nada deixa de funcionar sem ela; o que muda é a precisão da organização.
//   - FINALIDADE DECLARADA na própria tela, antes de pedir (ver `MOTIVO_DATA_NASCIMENTO`).
//   - REMOVÍVEL a qualquer momento, e apagá-la volta a plataforma ao estado anterior.
//   - MINIMIZAÇÃO: guarda-se a data e deriva-se o resto. Guardar data E faixa seria manter dois registros do
//     mesmo fato, e o segundo envelheceria — a pessoa faria aniversário e a faixa continuaria a antiga.

/**
 * As fases, na ordem da vida.
 *
 * Os cortes são os de USO CORRENTE em saúde e não são afirmação clínica — servem para a plataforma saber
 * organizar, e para a pessoa se reconhecer. `lactente` e `bebê` existem separados porque é justamente aí que a
 * faixa etária falhava.
 */
export type FaseDaVida =
  | 'recem-nascido' | 'lactente' | 'primeira-infancia' | 'infancia'
  | 'adolescencia' | 'adulto-jovem' | 'adulto' | 'idoso'

export const FASES: readonly { id: FaseDaVida; label: string; desde: string }[] = [
  { id: 'recem-nascido',     label: 'Recém-nascido',     desde: 'até 28 dias' },
  { id: 'lactente',          label: 'Lactente',          desde: '29 dias a 2 anos' },
  { id: 'primeira-infancia', label: 'Primeira infância', desde: '2 a 6 anos' },
  { id: 'infancia',          label: 'Infância',          desde: '6 a 10 anos' },
  { id: 'adolescencia',      label: 'Adolescência',      desde: '10 a 19 anos' },
  { id: 'adulto-jovem',      label: 'Adulto jovem',      desde: '19 a 30 anos' },
  { id: 'adulto',            label: 'Adulto',            desde: '30 a 60 anos' },
  { id: 'idoso',             label: 'Pessoa idosa',      desde: '60 anos ou mais' },
]

const LABELS = Object.fromEntries(FASES.map(f => [f.id, f.label])) as Record<FaseDaVida, string>
export function faseLabel(f: FaseDaVida): string { return LABELS[f] ?? 'Fase não informada' }

/** Idade decomposta. Meses e dias importam no começo da vida — e é só lá que importam. */
export interface Idade {
  readonly anos: number
  readonly meses: number
  readonly dias: number
  /** Dias completos desde o nascimento. É por ele que se decide "recém-nascido". */
  readonly totalDias: number
}

/** 'AAAA-MM-DD' → data local ao meio-dia. */
function dataLocal(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return null
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])]
  // MEIO-DIA, e não meia-noite: em fusos negativos, meia-noite UTC cai no dia anterior e a idade sairia um dia
  // menor. Para um recém-nascido, um dia é a diferença entre duas fases.
  const d = new Date(ano, mes - 1, dia, 12, 0, 0)
  if (Number.isNaN(d.getTime())) return null
  // CONFERE SE A DATA VOLTOU IGUAL. O construtor do JavaScript não recusa mês 13 nem 31 de fevereiro: ele
  // ROLA para o mês seguinte, em silêncio. "1990-13-01" viraria janeiro de 1991 e a idade sairia plausível e
  // errada — que é exatamente a família de defeito que esta plataforma passa a semana corrigindo.
  if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) return null
  return d
}

/**
 * Idade em anos, meses e dias.
 *
 * `hoje` entra por parâmetro para a função ser PURA — data do relógio dentro de regra de domínio é o que torna
 * um comportamento impossível de verificar. Data inválida, futura ou implausível devolve `null`: idade
 * inventada num registro de saúde é pior que idade ausente.
 */
export function idadeEm(nascimento: string | null | undefined, hoje: Date): Idade | null {
  if (!nascimento) return null
  const n = dataLocal(nascimento)
  if (!n) return null
  const h = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 12, 0, 0)
  if (n.getTime() > h.getTime()) return null
  // 150 anos: o teto existe para pegar erro de digitação (1092 em vez de 1992), não para julgar longevidade.
  const totalDias = Math.floor((h.getTime() - n.getTime()) / 86_400_000)
  if (totalDias > 150 * 366) return null

  // ANOS e MESES por comparação de calendário; DIAS pela distância até o último "aniversário mensal".
  //
  // A conta ingênua — subtrair os dias e "emprestar" do mês anterior — produz DIAS NEGATIVOS quando o dia do
  // nascimento não existe no mês emprestado: de 31/01 a 01/03 ela dava −2. Um número negativo num campo de
  // idade é o tipo de coisa que ninguém confere e que aparece num relatório levado ao médico.
  let anos = h.getFullYear() - n.getFullYear()
  let meses = h.getMonth() - n.getMonth()
  if (h.getDate() < n.getDate()) meses -= 1
  if (meses < 0) { anos -= 1; meses += 12 }

  // O aniversário mensal mais recente. `min(dia, último dia do mês)` porque quem nasceu em 31 "faz mês" em 28
  // de fevereiro — o dia 31 não existe lá, e inventá-lo empurraria a data para março.
  const alvoMes = n.getMonth() + meses
  const anoAlvo = n.getFullYear() + anos + Math.floor(alvoMes / 12)
  const mesAlvo = ((alvoMes % 12) + 12) % 12
  const ultimoDia = new Date(anoAlvo, mesAlvo + 1, 0).getDate()
  const aniversarioMensal = new Date(anoAlvo, mesAlvo, Math.min(n.getDate(), ultimoDia), 12, 0, 0)
  const dias = Math.max(0, Math.floor((h.getTime() - aniversarioMensal.getTime()) / 86_400_000))

  return { anos, meses, dias, totalDias }
}

/** A fase da vida correspondente à idade. `null` sem data — ausência permanece ausência. */
export function faseDaVida(nascimento: string | null | undefined, hoje: Date): FaseDaVida | null {
  const i = idadeEm(nascimento, hoje)
  if (!i) return null
  if (i.totalDias <= 28) return 'recem-nascido'
  if (i.anos < 2) return 'lactente'
  if (i.anos < 6) return 'primeira-infancia'
  if (i.anos < 10) return 'infancia'
  if (i.anos < 19) return 'adolescencia'
  if (i.anos < 30) return 'adulto-jovem'
  if (i.anos < 60) return 'adulto'
  return 'idoso'
}

/**
 * A idade como a pessoa a diz.
 *
 * Antes dos dois anos conta-se em meses, e no primeiro mês em dias — é assim que se fala de um bebê, e é a
 * precisão que a fase exige ali. Depois disso, anos. Dizer "0 anos" para um bebê de três meses seria
 * tecnicamente correto e inútil.
 */
export function idadeLabel(nascimento: string | null | undefined, hoje: Date): string | null {
  const i = idadeEm(nascimento, hoje)
  if (!i) return null
  if (i.totalDias <= 28) return `${i.totalDias} ${i.totalDias === 1 ? 'dia' : 'dias'}`
  if (i.anos < 2) {
    const m = i.anos * 12 + i.meses
    return `${m} ${m === 1 ? 'mês' : 'meses'}`
  }
  return `${i.anos} anos`
}

/**
 * A faixa etária correspondente, DERIVADA da data.
 *
 * O perfil já tinha `age_range`, preenchida à mão. Manter os dois preenchidos separadamente seria guardar duas
 * vezes o mesmo fato — e o segundo envelheceria sozinho: a pessoa faz aniversário e a faixa continua a antiga.
 * Havendo data, a faixa vem dela; não havendo, a que a pessoa escolheu continua valendo.
 */
export function faixaDerivada(nascimento: string | null | undefined, hoje: Date): string | null {
  const i = idadeEm(nascimento, hoje)
  if (!i) return null
  if (i.anos < 18) return '0-17'
  if (i.anos < 25) return '18-24'
  if (i.anos < 35) return '25-34'
  if (i.anos < 45) return '35-44'
  if (i.anos < 55) return '45-54'
  if (i.anos < 65) return '55-64'
  return '65+'
}

/**
 * POR QUE A PLATAFORMA PEDE A DATA — dito ANTES de pedir, não depois.
 *
 * A LGPD exige finalidade específica e informada. Mas há uma razão que vem antes da lei: pedir a data de
 * nascimento de alguém num aplicativo de saúde, sem dizer para quê, é o tipo de coisa que faz a pessoa
 * desconfiar — e ela tem razão em desconfiar.
 *
 * O texto diz o que muda COM e o que continua funcionando SEM. Um pedido de dado que não diz o que se perde ao
 * recusar não é escolha informada; é pressão.
 */
export const MOTIVO_DATA_NASCIMENTO =
  'A data de nascimento serve para a SINTERA organizar o seu registro pela fase da vida — o que importa ' +
  'acompanhar num bebê é diferente do que importa num adulto, e a diferença de poucos meses muda tudo nos ' +
  'primeiros anos. É opcional: sem ela, tudo continua funcionando, apenas sem essa organização. Você pode ' +
  'apagá-la quando quiser, e a plataforma volta ao estado anterior.'

/** O que a plataforma NÃO faz com a data. Dito porque o silêncio aqui seria lido como a promessa oposta. */
export const LIMITE_DATA_NASCIMENTO =
  'A SINTERA não usa a sua idade para avaliar resultados nem para sugerir exames ou tratamentos. Ela organiza ' +
  'o que você registrou; quem interpreta é o seu médico.'
