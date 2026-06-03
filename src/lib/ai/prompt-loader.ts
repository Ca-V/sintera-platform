import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'

export interface LoadedPrompt {
  version: string
  systemPrompt: string
  userTemplate: string
  temperature: number
  maxTokens: number
  contentHash: string
}

export async function loadActivePrompt(operation: string): Promise<LoadedPrompt | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('prompt_registry')
    .select('version, system_prompt, user_prompt_template, temperature, max_tokens, content_hash')
    .eq('operation', operation)
    .eq('status', 'active')
    .single()

  if (error || !data) return null

  return {
    version: data.version as string,
    systemPrompt: data.system_prompt as string,
    userTemplate: data.user_prompt_template as string,
    temperature: Number(data.temperature),
    maxTokens: data.max_tokens as number,
    contentHash: data.content_hash as string,
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
