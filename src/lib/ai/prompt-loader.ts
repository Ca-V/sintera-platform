import { createHash } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export interface LoadedPrompt {
  version: string
  systemPrompt: string
  userTemplate: string
  temperature: number
  maxTokens: number
  contentHash: string
}

// `client` (opcional): use o cliente AUTENTICADO da requisição (Cookie=Web · Bearer=Mobile). Sem ele, cai no
// cliente por cookie (compat). Corrige NO_ACTIVE_PROMPT em requisições Bearer, onde um cliente cookie novo seria
// anônimo e a RLS de `prompt_registry` bloquearia a leitura. Ponte ADR-020.
export async function loadActivePrompt(operation: string, client?: SupabaseClient): Promise<LoadedPrompt | null> {
  const supabase = client ?? await createClient()

  const { data, error } = await supabase
    .from('prompt_registry')
    .select('version, system_prompt, user_prompt_template, temperature, max_tokens, content_hash')
    .eq('operation', operation)
    .eq('status', 'active')
    .single()

  if (error || !data) return null

  // prompt_registry não está nos tipos gerados — cast necessário
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any

  return {
    version: row.version as string,
    systemPrompt: row.system_prompt as string,
    userTemplate: row.user_prompt_template as string,
    temperature: Number(row.temperature),
    maxTokens: row.max_tokens as number,
    contentHash: row.content_hash as string,
  }
}

// Hash inclui temperature e max_tokens (Ajuste A2 aprovado)
export function computePromptHash(
  systemPrompt: string,
  userTemplate: string,
  temperature: number,
  maxTokens: number,
): string {
  const content = systemPrompt + userTemplate + String(temperature) + String(maxTokens)
  return createHash('sha256').update(content, 'utf8').digest('hex')
}

export function verifyPromptIntegrity(prompt: LoadedPrompt): boolean {
  const computed = computePromptHash(
    prompt.systemPrompt,
    prompt.userTemplate,
    prompt.temperature,
    prompt.maxTokens,
  )
  return computed === prompt.contentHash
}
