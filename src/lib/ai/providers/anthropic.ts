import Anthropic from '@anthropic-ai/sdk'
import type { Message } from '@anthropic-ai/sdk/resources/messages'
import type { AIProvider, ExtractionInput, ProviderResult } from '../types'

const TIMEOUT_MS = 60_000 // aumentado para PDF nativo (maior payload)

// DMEAV F1-M2: PDF nativo usa beta header 'pdfs-2024-09-25'.
// Dependência externa sujeita a alteração pela Anthropic.
const PDF_BETA_HEADER = 'pdfs-2024-09-25'

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
    let msg: Message

    if (input.extractionPath === 'pdf_native' && input.pdfBuffer) {
      // Path B — PDF nativo: envia o arquivo diretamente ao modelo
      const pdfBase64 = input.pdfBuffer.toString('base64')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      msg = await (this.client.beta.messages.create as any)({
        model: this.model,
        max_tokens: input.maxTokens,
        temperature: input.temperature,
        system: input.systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 },
              },
              {
                type: 'text',
                text: input.userTemplate.replace('{{examText}}', '').trim() ||
                  'Extraia todos os biomarcadores deste laudo laboratorial conforme as instruções do sistema.',
              },
            ],
          },
        ],
        betas: [PDF_BETA_HEADER],
      }) as Message
    } else {
      // Path A — texto extraído
      const userMessage = input.userTemplate.replace('{{examText}}', input.examText ?? '')
      msg = await this.client.messages.create({
        model: this.model,
        max_tokens: input.maxTokens,
        temperature: input.temperature,
        system: input.systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }) as Message
    }

    const rawResponse = msg.content[0].type === 'text' ? msg.content[0].text : ''

    return {
      rawResponse,
      promptTokens: msg.usage.input_tokens,
      completionTokens: msg.usage.output_tokens,
      model: msg.model,
      durationMs: Date.now() - startTime,
    }
  }
}
