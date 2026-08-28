// Teste de regressão do Config Plugin que declara o rationale de permissões de saúde (HIP-014 §5).
//
// POR QUE ESTE TESTE EXISTE:
// A falha que ele protege é SILENCIOSA. Sem estas declarações no AndroidManifest o build passa, o APK
// instala, o app abre — e o Health Connect simplesmente não lista a SINTERA. Não há erro, não há log: a
// integração inteira fica invisível, e só se descobre depois de um build completo e de instalar no aparelho.
//
// São DUAS declarações porque o Android mudou o mecanismo na 14: intent-filter de rationale para ≤13 e
// activity-alias de VIEW_PERMISSION_USAGE para ≥14. Cobrir só uma deixa metade dos aparelhos sem caminho.
//
// Como o withAndroidCmakeVersion, testa a transformação PURA — sem toolchain nativo, sem `expo prebuild`.
import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const plugin = require('../../apps/mobile/plugins/withHealthConnectRationale.js') as {
  declararRationale: (m: unknown) => Record<string, never>
  ACTION_RATIONALE: string
  ACTION_VIEW_USAGE: string
  CATEGORY_HEALTH: string
  ALIAS_NAME: string
}
const { declararRationale, ACTION_RATIONALE, ACTION_VIEW_USAGE, CATEGORY_HEALTH, ALIAS_NAME } = plugin

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Manifesto representativo do gerado pelo `expo prebuild`. */
function manifestoExpo(): any {
  return {
    manifest: {
      application: [
        {
          $: { 'android:name': '.MainApplication' },
          activity: [
            {
              $: { 'android:name': '.MainActivity', 'android:exported': 'true' },
              'intent-filter': [
                {
                  action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
                  category: [{ $: { 'android:name': 'android.intent.category.LAUNCHER' } }],
                },
              ],
            },
          ],
        },
      ],
    },
  }
}

const acoesDaMain = (m: any) =>
  (m.manifest.application[0].activity[0]['intent-filter'] as any[])
    .flatMap((f) => f.action ?? [])
    .map((a) => a.$['android:name'])

describe('HIP-014 · rationale de permissões de saúde', () => {
  it('Android ≤13: acrescenta o intent-filter de rationale na Activity principal', () => {
    const m = declararRationale(manifestoExpo()) as any
    expect(acoesDaMain(m)).toContain(ACTION_RATIONALE)
  })

  it('não destrói o intent-filter de LAUNCHER que já existia', () => {
    const m = declararRationale(manifestoExpo()) as any
    expect(acoesDaMain(m)).toContain('android.intent.action.MAIN')
  })

  it('Android ≥14: acrescenta o activity-alias de uso de permissão', () => {
    const m = declararRationale(manifestoExpo()) as any
    const alias = m.manifest.application[0]['activity-alias'][0]
    expect(alias.$['android:name']).toBe(ALIAS_NAME)
    expect(alias.$['android:targetActivity']).toBe('.MainActivity')
    expect(alias['intent-filter'][0].action[0].$['android:name']).toBe(ACTION_VIEW_USAGE)
    expect(alias['intent-filter'][0].category[0].$['android:name']).toBe(CATEGORY_HEALTH)
  })

  it('o alias é protegido — só o sistema pode abri-lo', () => {
    // Sem esta permissão, qualquer aplicativo instalado poderia invocar o alias.
    const m = declararRationale(manifestoExpo()) as any
    expect(m.manifest.application[0]['activity-alias'][0].$['android:permission'])
      .toBe('android.permission.START_VIEW_PERMISSION_USAGE')
  })

  it('é IDEMPOTENTE — o prebuild roda a cada build e não pode duplicar', () => {
    const uma = declararRationale(manifestoExpo()) as any
    const duas = declararRationale(declararRationale(manifestoExpo())) as any
    const conta = (m: any) => ({
      filtros: m.manifest.application[0].activity[0]['intent-filter'].length,
      alias: m.manifest.application[0]['activity-alias'].length,
    })
    expect(conta(duas)).toEqual(conta(uma))
    expect(conta(duas).alias).toBe(1)
  })

  it('FALHA ALTO se o template do Expo mudar de forma, em vez de aplicar no vazio', () => {
    expect(() => declararRationale({ manifest: {} })).toThrow(/application/i)
    expect(() => declararRationale({ manifest: { application: [{ activity: [] }] } })).toThrow(/MainActivity/i)
  })
})
