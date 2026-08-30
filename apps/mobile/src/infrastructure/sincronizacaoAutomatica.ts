// SINCRONIZAÇÃO AUTOMÁTICA — o dado entra sozinho, sem ninguém pedir.
//
// DECISÃO DA FUNDADORA (28/08): "a importação tem que ser automática, sem precisar que o usuário fique
// demandando essa informação. A informação vai pra plataforma SINTERA" — e ela autoriza a fonte UMA VEZ, não a
// cada lote que chega.
//
// O QUE ISSO RESOLVE. Até aqui, o dado do Health Connect só entrava quando alguém abria Conexões e tocava em
// "sincronizar". Quem esquecesse ficaria sem dado, e a plataforma pareceria vazia mesmo com o relógio medindo
// todo dia. Um registro de saúde que depende de disciplina diária não é registro — é tarefa.
//
// COMO. Uma tarefa do sistema operacional que roda de tempos em tempos e sincroniza a janela desde a última vez.
// Quem decide o momento exato é o Android, não nós: ele agrupa tarefas de vários apps para poupar bateria. O
// intervalo abaixo é um PEDIDO, não uma promessa — pode rodar mais espaçado se o aparelho estiver economizando.
//
// VALE NOS DOIS: Health Connect no Android, Apple Saúde no iPhone. A única diferença é o cofre; janela, marca
// d'água e tratamento de falha são os mesmos, porque a regra é a mesma.
//
// No Android exige `READ_HEALTH_DATA_IN_BACKGROUND`, declarada no app.json — sem ela o sistema entrega vazio
// com o app fechado, em silêncio.
//
// LIMITE HONESTO DO IPHONE: o iOS não garante execução periódica. Ele decide quando acordar a tarefa, com base
// em uso e bateria, e pode não acordá-la por dias num aparelho pouco usado. Por isso a sincronização manual em
// Conexões continua sendo o caminho confiável ali — e a automática é ganho, não promessa.
import * as BackgroundTask from 'expo-background-task'
import * as TaskManager from 'expo-task-manager'
// A marca d'água usa o MESMO armazenamento da sessão, já no projeto. Não é segredo — é um horário —, mas
// acrescentar uma segunda biblioteca de armazenamento para guardar uma data seria criar onde já dá para
// acomodar (princípio de Estabilidade Arquitetural).
import { secureStoreAdapter } from './secureStoreAdapter'
import { Platform } from 'react-native'
import { janelaImportacaoSegundoPlano } from '@sintera/core'
import { sincronizarHealthConnect } from './healthConnect'
import { sincronizarAppleHealth } from './appleHealth'

/** Nome da tarefa no sistema. Estável: mudá-lo faria o Android tratar como tarefa nova e perder o agendamento. */
export const TAREFA_SYNC = 'sintera-sync-health-connect'

/** Quando a última sincronização automática terminou com sucesso — define o início da próxima janela. */
// Sem dois-pontos: o SecureStore só aceita letras, números, ponto, hífen e sublinhado na chave.
const CHAVE_ULTIMA_SYNC = 'sintera.ultima-sync-automatica'

/**
 * Intervalo PEDIDO ao sistema, em minutos.
 *
 * Quinze minutos é o mínimo que o Android aceita; abaixo disso ele ignora e usa o próprio critério. Na prática
 * roda com menos frequência quando a bateria está baixa ou o aparelho ocioso — e tudo bem: sincronizar de hora
 * em hora já torna o dado presente sem que ninguém peça, que é o objetivo.
 */
const INTERVALO_MINUTOS = 60

// A janela da primeira sincronização em segundo plano mudou de casa: vive em `janelaImportacaoSegundoPlano`,
// no núcleo, ao lado da regra geral que ela excepciona. Ficava aqui, numa constante isolada, e a exceção era
// invisível para quem lesse só a regra.

async function ultimaSync(): Promise<Date | null> {
  try {
    const v = await secureStoreAdapter.get(CHAVE_ULTIMA_SYNC)
    if (!v) return null
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}

async function marcarSync(quando: Date): Promise<void> {
  try { await secureStoreAdapter.set(CHAVE_ULTIMA_SYNC, quando.toISOString()) } catch { /* volta a usar a janela padrão */ }
}

/**
 * O que a tarefa faz quando o sistema a acorda.
 *
 * NUNCA LANÇA. Uma tarefa de segundo plano que falha alto pode ser desagendada pelo sistema — e o app perderia a
 * sincronização automática para sempre, sem ninguém perceber. Falha vira "nada novo" e a próxima janela tenta de
 * novo, com o mesmo início (a marca d'água só avança no sucesso).
 */
TaskManager.defineTask(TAREFA_SYNC, async () => {
  try {
    const agora = new Date()
    const anterior = await ultimaSync()
    // O ALCANCE vem do núcleo, inclusive a exceção do segundo plano: a folga de uma hora sobre a última marca
    // (dado que chega ao aparelho com atraso ainda entra) e a janela curta da primeira vez moram lá, ao lado da
    // regra que excepcionam. A gravação é idempotente, então a sobreposição não duplica.
    const { desde } = janelaImportacaoSegundoPlano(agora, anterior)

    // O COFRE DEPENDE DA PLATAFORMA, e é a única diferença: Health Connect no Android, Apple Saúde no iPhone.
    // Tudo o mais — janela, marca d'água, tratamento de falha — é idêntico, porque a regra é a mesma.
    //
    // Chamar o do Android no iPhone devolveria "indisponível" para sempre, e a marca d'água nunca avançaria:
    // a sincronização automática existiria no código e não existiria no aparelho. É o defeito de "especificado
    // e nunca ligado", que aqui seria invisível justamente por ser em segundo plano — ninguém veria nada
    // acontecer, porque nada aparece quando funciona.
    const r = Platform.OS === 'ios'
      ? await sincronizarAppleHealth(desde, agora)
      : await sincronizarHealthConnect(desde, agora)

    // Só avança a marca quando houve autorização e leitura de fato. Sem isso, um período sem permissão faria a
    // janela avançar sobre dias que nunca foram lidos — e eles nunca mais seriam buscados.
    if (r.autorizado) await marcarSync(agora)

    // "Nada novo" também é SUCESSO. Reportar falha num dia sem dado ensinaria o Android a considerar a tarefa
    // inútil e a acordá-la cada vez menos — justamente no app que precisa dela todo dia.
    return BackgroundTask.BackgroundTaskResult.Success
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed
  }
})

/**
 * Pede ao sistema que passe a acordar a tarefa. Idempotente: registrar duas vezes não cria duas tarefas.
 *
 * Chamada na abertura do app, e não numa tela: a sincronização automática não pertence a Conexões — ela é da
 * plataforma. Amarrá-la a uma tela faria depender de a pessoa visitar aquela tela, que é exatamente o que se
 * está eliminando.
 */
export async function registrarSincronizacaoAutomatica(): Promise<void> {
  try {
    const jaRegistrada = await TaskManager.isTaskRegisteredAsync(TAREFA_SYNC)
    if (jaRegistrada) return
    await BackgroundTask.registerTaskAsync(TAREFA_SYNC, { minimumInterval: INTERVALO_MINUTOS })
  } catch {
    // Sistema sem suporte, ou usuário com execução em segundo plano restrita. A sincronização manual em
    // Conexões continua funcionando — degrada, não quebra.
  }
}

/** Desliga a sincronização automática. Existe para a pessoa poder revogar sem desinstalar o app. */
export async function cancelarSincronizacaoAutomatica(): Promise<void> {
  try {
    if (await TaskManager.isTaskRegisteredAsync(TAREFA_SYNC)) {
      await BackgroundTask.unregisterTaskAsync(TAREFA_SYNC)
    }
  } catch { /* já não estava registrada */ }
}

/** A sincronização automática está ligada? Para a tela poder dizer, em vez de a pessoa adivinhar. */
export async function sincronizacaoAutomaticaAtiva(): Promise<boolean> {
  try { return await TaskManager.isTaskRegisteredAsync(TAREFA_SYNC) } catch { return false }
}
