// @sintera/api-client — leitura dos PASSOS a partir do bruto (`wearable_readings`).
//
// Passos não têm projeção em `body_metrics`: a restrição da coluna não os aceita, e acrescentá-los ali colocaria
// uma contagem ACUMULADA do dia ao lado de medições instantâneas (pressão, glicemia), fazendo a tela mentir
// sobre o que cada número é. Então a tela lê do bruto, onde eles já estão desde a primeira sincronização, com
// procedência.
//
// Ler direto do bruto é exceção, não padrão — vale porque não há nada a projetar, e não porque projetar dá
// trabalho. Se um dia passos ganharem tratamento próprio (metas, comparação semanal), a projeção passa a fazer
// sentido e esta função vira a leitura dessa projeção.
import type { SupabaseClient } from '@supabase/supabase-js'
import { dailySteps, type DailySteps, type StepReading } from '@sintera/core'
import { withTimeout } from '../net/timeout'

/** Quantos dias para trás. Um mês é o que a tela mostra sem virar rolagem infinita. */
const JANELA_DIAS = 30

/**
 * Passos por dia, do mais recente para o mais antigo.
 *
 * NÃO LANÇA: passos são uma seção a mais em Monitoramento; falhar aqui não pode derrubar os sinais vitais.
 * Erro devolve lista vazia, e a seção simplesmente não aparece.
 */
export async function listDailySteps(
  client: SupabaseClient, dias: number = JANELA_DIAS, signal?: AbortSignal,
): Promise<DailySteps[]> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return []

    const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await client.from('wearable_readings')
      .select('recorded_at, value, provider')
      .eq('user_id', session.user.id)
      .eq('metric', 'passos')
      .gte('recorded_at', desde)
      .order('recorded_at', { ascending: false })
      .abortSignal(s)
    // ERRO E AUSÊNCIA SÃO COISAS DIFERENTES, e esta linha tratava as duas igual.
    //
    // "Nenhum passo registrado" é resposta legítima e comum — quem não ligou nenhuma fonte não tem passos. Mas
    // um erro de consulta (coluna renomeada, política de acesso mudada) produzia exatamente a mesma lista
    // vazia, e a seção de Passos sumia da tela sem que ninguém soubesse por quê.
    //
    // É a assinatura EXATA do defeito que matou três domínios da busca: o Supabase não lança nesse caso —
    // devolve `data: null` com o erro no campo `error`. Quem olha só o `data` nunca fica sabendo.
    if (error) {
      console.warn('[SINTERA] passos: a consulta falhou e a seção ficou vazia.', error)
      return []
    }
    if (!data) return []

    const leituras: StepReading[] = (data as Array<Record<string, unknown>>).map(r => ({
      recordedAt: typeof r.recorded_at === 'string' ? r.recorded_at : '',
      value: typeof r.value === 'number' ? r.value : null,
      provider: typeof r.provider === 'string' ? r.provider : '',
    }))
    // A agregação por dia (e a decisão de NÃO somar fontes diferentes) vive no core, testada lá.
    return dailySteps(leituras)
  } catch (e) {
    console.warn('[SINTERA] passos: a leitura lançou e a seção ficou vazia.', e)
    return []
  } finally { cleanup() }
}
