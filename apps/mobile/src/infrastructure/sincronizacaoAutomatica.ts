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
// LIMITE HONESTO: isto é Android. No iPhone o equivalente será o Apple Saúde, com mecanismo próprio (HIP-014).
// E exige a permissão `READ_HEALTH_DATA_IN_BACKGROUND`, declarada no app.json — sem ela o sistema entrega
// vazio com o app fechado, em silêncio.
import * as BackgroundTask from 'expo-background-task'
import * as TaskManager from 'expo-task-manager'
// A marca d'água usa o MESMO armazenamento da sessão, já no projeto. Não é segredo — é um horário —, mas
// acrescentar uma segunda biblioteca de armazenamento para guardar uma data seria criar onde já dá para
// acomodar (princípio de Estabilidade Arquitetural).
import { secureStoreAdapter } from './secureStoreAdapter'
import { sincronizarHealthConnect } from './healthConnect'

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

/**
 * Janela da primeira sincronização automática, em dias.
 *
 * Sem marca d'água anterior, busca-se o último mês. Puxar o histórico inteiro na primeira vez poderia significar
 * anos de dado numa tarefa de segundo plano com tempo limitado — o sistema mataria a tarefa no meio, e o
 * resultado seria pior que nada. O histórico completo é assunto da sincronização manual, com a tela aberta.
 */
const JANELA_INICIAL_DIAS = 30

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
    // Uma hora de folga sobre a última marca: se um dado chegou ao aparelho com atraso, ele ainda entra. A
    // gravação é idempotente (chave pessoa+fonte+métrica+instante), então repetir não duplica.
    const desde = anterior
      ? new Date(anterior.getTime() - 60 * 60 * 1000)
      : new Date(agora.getTime() - JANELA_INICIAL_DIAS * 24 * 60 * 60 * 1000)

    const r = await sincronizarHealthConnect(desde, agora)

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
