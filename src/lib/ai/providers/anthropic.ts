import Anthropic from '@anthropic-ai/sdk'
import type { AIProvider, ExtractionInput, ProviderResult } from '../types'

const TIMEOUT_MS = 30_000

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic'
  readonly model = 'claude-haiku-4-5-20251001'

  private client: Anthropic

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: TIMEOUT_MS,
    })
  }

  async extractBiomarkers(input: ExtractionInput): Promise<ProviderResult> {
    const startTime = Date.now()

    const userMessage = input.userTemplate.replace('{{examText}}', input.examText)

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: input.maxTokens,
      temperature: input.temperature,
      system: input.systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const rawResponse =
      response.content[0].type === 'text' ? response.content[0].text : ''

    return {
      rawResponse,
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      model: response.model,
      durationMs: Date.now() - startTime,
    }
  }
}
