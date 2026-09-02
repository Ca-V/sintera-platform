// @sintera/core — O QUE A SINCRONIZAÇÃO VIU, dito em português.
//
// O CASO QUE ORIGINOU ESTE ARQUIVO (homologação da fundadora, 30/08). Ela autorizou a SINTERA, autorizou o
// Samsung Health, autorizou o Strava, tocou em sincronizar — e leu "Nada novo desde a última vez". Três vezes.
//
// A frase era VERDADEIRA e INÚTIL. Nada novo é o resultado de pelo menos cinco situações completamente
// diferentes, e a plataforma sabia distinguir todas elas:
//
//   1. Nenhuma permissão concedida.
//   2. Permissões concedidas, cofre genuinamente vazio (nenhum app escreveu ainda).
//   3. O Health Connect RECUSOU as leituras — tipicamente por pedirmos além da janela permitida.
//   4. Registros lidos, mas nenhum gravado — defeito nosso, do lado da nuvem.
//   5. Registros gravados, mas sem tela onde apareçam.
//
// Do lado de fora as cinco eram a mesma frase. E a terceira era invisível de propósito: a leitura de cada tipo
// estava dentro de um `catch` que devolvia lista vazia. Um erro convertido em zero deixa de ser erro e vira
// fato — a pior transformação que um programa pode fazer com uma informação.
//
// POR QUE MORA NO CORE. É função pura sobre contagens: dá para testar sem Android, que é justamente o que não
// existe no ambiente de desenvolvimento. E Web e aplicativo dizem a MESMA frase (BASE ÚNICA) — a explicação de
// por que não veio dado não pode divergir entre as duas pontas.

/** O que a leitura de UM tipo de registro produziu. Erro é registrado, nunca convertido em zero. */
export interface LeituraPorTipo {
  readonly tipo: string
  readonly registros: number
  /** Presente quando o Health Connect recusou ou falhou. Distingue "não veio nada" de "não deu para pedir". */
  readonly erro?: string
}

export interface DiagnosticoSync {
  /** Tipos que a pessoa autorizou. */
  readonly concedidas: readonly string[]
  /** Tipos pedidos e não autorizados. Concessão parcial é normal — mas precisa ser DITA. */
  readonly negadas: readonly string[]
  /**
   * A permissão de HISTÓRICO foi concedida?
   *
   * Sem ela o Health Connect só entrega os 30 dias anteriores à PRIMEIRA autorização, e recusa com erro
   * qualquer pedido que ultrapasse esse limite — não devolve menos, recusa tudo.
   */
  readonly historico: boolean
  /** Quantos dias para trás foram pedidos. */
  readonly diasJanela: number
  readonly porTipo: readonly LeituraPorTipo[]
  /** Amostras e sessões CONSTRUÍDAS a partir do que foi lido. */
  readonly amostras: number
  readonly sessoes: number
  /** O que a nuvem confirmou ter guardado. */
  readonly gravadas: number
  readonly visiveis: number
  readonly gravadasSessoes: number
  /**
   * Registros que JÁ EXISTIAM e foram COMPLETADOS por esta sincronização.
   *
   * FALTAVA AQUI, e a falta produziu uma mentira. Na homologação de 31/08 a sincronização corrigiu 31
   * atividades — pôs o tipo certo em 26 "Outra atividade" e a distância em 4 corridas — e a tela disse:
   * "Li 65 registros no aparelho, mas NENHUM chegou à nuvem. O problema é nosso."
   *
   * A plataforma tinha acabado de fazer exatamente o que devia, e se acusou de ter falhado. Isso é pior que
   * um erro silencioso: é a plataforma desmentindo o próprio acerto. Quem lê isso deixa de acreditar em TODAS
   * as outras mensagens — inclusive nas verdadeiras.
   *
   * A causa: `atualizadas` existia em `IngestResult` desde 30/08 e nunca foi levada até aqui. Especificado e
   * nunca ligado, outra vez, e desta vez o resultado foi a plataforma falar mal de si mesma.
   */
  readonly atualizadas: number
}

export interface ResumoSync {
  /** A frase principal, colada no botão. */
  readonly frase: string
  /** As linhas de fato, para quem quiser conferir. Nunca vazias quando o resultado é zero. */
  readonly fatos: readonly string[]
  /** Terminou sem trazer nada? É quando o passo a passo deixa de ser opcional. */
  readonly vazio: boolean
}

function plural(n: number, um: string, muitos: string): string {
  return `${n} ${n === 1 ? um : muitos}`
}

/**
 * Como cada tipo é DITO à pessoa. O nome técnico ('OxygenSaturation') não pertence à tela — mas a lista é
 * ABERTA: tipo desconhecido aparece com o nome que veio, em vez de desaparecer.
 */
const NOME_TIPO: Record<string, string> = {
  BloodPressure: 'pressão arterial',
  BloodGlucose: 'glicemia',
  HeartRate: 'frequência cardíaca',
  OxygenSaturation: 'saturação de oxigênio',
  BodyTemperature: 'temperatura',
  Weight: 'peso',
  Height: 'altura',
  Steps: 'passos',
  ExerciseSession: 'atividades',
  // FALTAVAM, e a falta apareceu na tela da fundadora em 31/08: o relatório de sincronização mostrava
  // "Distance: 4 registros" e "TotalCaloriesBurned: 30 registros" — nome de campo de banco, em inglês, para
  // uma pessoa que não programa. Os três tipos foram acrescentados em 30/08 e o rótulo ficou para trás.
  //
  // É exatamente o padrão que esta semana repetiu: campo novo criado, um consumidor esquecido. A catraca
  // `campo-novo-propagado` existe por causa deste caso, e o pegou na primeira execução.
  Distance: 'distância',
  ActiveCaloriesBurned: 'calorias da atividade',
  TotalCaloriesBurned: 'calorias totais',
}
export function nomeTipoHc(t: string): string {
  return NOME_TIPO[t] ?? t
}

/**
 * A frase que a pessoa lê depois de tocar em sincronizar, e os fatos que a sustentam.
 *
 * REGRA: quando o resultado é zero, a frase diz POR QUE e o que fazer. "Nada novo" sozinho é a resposta que
 * fez a fundadora concluir três vezes que a plataforma não funcionava.
 */
export function resumoSincronizacao(d: DiagnosticoSync): ResumoSync {
  const fatos: string[] = []

  const pedidos = d.concedidas.length + d.negadas.length
  fatos.push(`Permissões: ${d.concedidas.length} de ${pedidos} concedidas`)
  if (d.negadas.length > 0) {
    fatos.push(`Não autorizados: ${d.negadas.map(nomeTipoHc).join(', ')}`)
  }
  fatos.push(
    d.historico
      ? `Janela: ${plural(d.diasJanela, 'dia', 'dias')} (histórico completo autorizado)`
      : `Janela: ${plural(d.diasJanela, 'dia', 'dias')} — sem a autorização de histórico, o Health Connect não entrega nada mais antigo`,
  )

  const falhas = d.porTipo.filter((p) => p.erro)
  const comDado = d.porTipo.filter((p) => !p.erro && p.registros > 0)
  const totalLido = d.porTipo.reduce((s, p) => s + p.registros, 0)

  for (const p of comDado) fatos.push(`${nomeTipoHc(p.tipo)}: ${plural(p.registros, 'registro', 'registros')}`)
  for (const p of falhas) fatos.push(`${nomeTipoHc(p.tipo)}: recusado — ${p.erro}`)

  // ── 1. Nada autorizado ──────────────────────────────────────────────────────
  if (d.concedidas.length === 0) {
    return {
      frase: 'Nenhuma permissão foi concedida. Sem autorização de leitura, não há o que buscar.',
      fatos,
      vazio: true,
    }
  }

  // ── 2. O Health Connect recusou TUDO ────────────────────────────────────────
  // Quase sempre janela: pedir além do limite não devolve menos, devolve erro. Dizer isso é o que separa
  // "a plataforma está quebrada" de "falta um ajuste, e é este".
  if (falhas.length > 0 && comDado.length === 0) {
    return {
      frase: falhas.length === d.porTipo.length
        ? 'O Health Connect recusou todas as leituras. Não é ausência de dado: é o pedido que não foi aceito.'
        : 'O Health Connect recusou parte das leituras e o resto veio vazio.',
      fatos,
      vazio: true,
    }
  }

  // ── 3. COMPLETADO o que já estava lá ────────────────────────────────────────
  // Vem ANTES do caso de falha, e é por não vir que a plataforma se acusou de falhar em 31/08: corrigir 31
  // atividades produz `gravadas = 0`, que era lido como "nada chegou". Corrigir é sucesso, e sucesso do tipo
  // mais valioso — alcança o que já estava errado no registro, sem a pessoa precisar apagar nada.
  if (d.atualizadas > 0) {
    const novas = [
      d.visiveis > 0 ? plural(d.visiveis, 'leitura nova', 'leituras novas') : null,
      d.gravadasSessoes > 0 ? plural(d.gravadasSessoes, 'atividade nova', 'atividades novas') : null,
    ].filter(Boolean) as string[]
    return {
      frase: `${plural(d.atualizadas, 'registro que já estava guardado foi completado', 'registros que já estavam guardados foram completados')}` +
        ` — tipo, distância e calorias que faltavam.` +
        (novas.length ? ` E ${novas.join(' e ')}.` : ''),
      fatos,
      vazio: false,
    }
  }

  // ── 4. Lido e não gravado — defeito NOSSO, e é preciso dizer que é nosso ─────
  if (totalLido > 0 && d.amostras + d.sessoes > 0 && d.gravadas + d.gravadasSessoes === 0) {
    return {
      frase: `Li ${plural(totalLido, 'registro', 'registros')} no aparelho, mas nenhum chegou à nuvem. O problema é nosso, não do seu aparelho.`,
      fatos,
      vazio: false,
    }
  }

  // ── 4. Autorizado e vazio ───────────────────────────────────────────────────
  // O caso mais comum logo depois de configurar, e o mais mal explicado: os aplicativos escrevem no Health
  // Connect a partir do momento em que são ligados. Recém-ligado, o cofre está aberto e vazio — e a pessoa
  // não tem como saber que isso é esperado.
  if (totalLido === 0) {
    return {
      frase: 'O Health Connect respondeu, e está vazio: nenhum aplicativo escreveu dados nesta janela. ' +
        'Os aplicativos passam a escrever a partir do momento em que você os liga — o que já existia neles ' +
        'pode levar algumas horas para aparecer, e às vezes não aparece.',
      fatos,
      vazio: true,
    }
  }

  // ── 5. Veio dado ────────────────────────────────────────────────────────────
  const partes = [
    d.visiveis > 0 ? plural(d.visiveis, 'leitura', 'leituras') : null,
    d.gravadasSessoes > 0 ? plural(d.gravadasSessoes, 'atividade', 'atividades') : null,
  ].filter(Boolean) as string[]

  const guardadas = Math.max(0, d.gravadas - d.visiveis)
  const sobra = guardadas > 0
    ? ` (+${guardadas} ${guardadas === 1 ? 'guardada, ainda sem tela própria' : 'guardadas, ainda sem tela própria'})`
    : ''

  if (partes.length === 0 && guardadas === 0) {
    // Leu e não duplicou: a segunda sincronização da mesma janela cai aqui, e é o único lugar onde
    // "nada novo" continua sendo a resposta certa — agora com os fatos ao lado para prová-la.
    return { frase: 'Nada novo desde a última vez.', fatos, vazio: false }
  }

  return {
    frase: partes.length
      ? `${partes.join(' · ')} — veja em Monitoramento${sobra}`
      : `${plural(guardadas, 'leitura guardada', 'leituras guardadas')}, ainda sem tela própria`,
    fatos,
    vazio: false,
  }
}
