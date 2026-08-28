// Config plugin (CNG) — declara no AndroidManifest como o app explica ao usuário POR QUE pede permissões
// de saúde. Sem isto o build passa, o app instala, e o Health Connect simplesmente NÃO LISTA a SINTERA —
// falha silenciosa, que é a pior forma de descobrir isso (só depois de um build inteiro).
//
// O Google exige DUAS declarações, porque o mecanismo mudou no Android 14:
//   • Android ≤ 13 → intent-filter `ACTION_SHOW_PERMISSIONS_RATIONALE` na própria Activity principal.
//   • Android ≥ 14 → um `activity-alias` que responde a `VIEW_PERMISSION_USAGE` na categoria
//     `HEALTH_PERMISSIONS`, protegido por `START_VIEW_PERMISSION_USAGE` (só o sistema pode invocá-lo).
// Cobrir só uma deixa metade dos aparelhos sem caminho para a explicação. Declaramos as duas.
//
// POR QUE UM CONFIG PLUGIN, e não editar android/app/src/main/AndroidManifest.xml direto: `apps/mobile/android/`
// é GERADO por `expo prebuild` e está no .gitignore (projeto CNG). Edição manual ali não é versionada e some no
// próximo prebuild. Mesma razão do withAndroidCmakeVersion.
//
// A biblioteca `react-native-health-connect` registra sozinha o *delegate* de permissão no lado nativo — isso
// ela faz. O que a documentação dela NÃO garante é a declaração de rationale/uso; por isso está aqui, explícita.
//
// Ver docs/HIP-014 §5.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- config plugin do Expo é CommonJS: o prebuild o carrega com require() do Node, e um import ESM aqui não seria resolvido.
const { withAndroidManifest } = require('@expo/config-plugins')

const ACTION_RATIONALE = 'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE'
const ACTION_VIEW_USAGE = 'android.intent.action.VIEW_PERMISSION_USAGE'
const CATEGORY_HEALTH = 'android.intent.category.HEALTH_PERMISSIONS'
const ALIAS_NAME = 'ViewPermissionUsageActivity'

/** A Activity principal gerada pelo Expo. */
function acharMainActivity(app) {
  return (app.activity || []).find((a) => a?.$?.['android:name'] === '.MainActivity')
}

function jaTemAcao(activity, acao) {
  return (activity['intent-filter'] || []).some((f) =>
    (f.action || []).some((a) => a?.$?.['android:name'] === acao),
  )
}

/**
 * Transformação PURA sobre o objeto do AndroidManifest (formato do @expo/config-plugins).
 * Idempotente: rodar duas vezes não duplica nada. Lança se a Activity principal não existir — o que
 * significaria que o template do Expo mudou de forma, e falhar alto é melhor que aplicar no vazio.
 * Exportada separadamente para permitir teste sem rodar `expo prebuild` (ver tests/mobile).
 */
function declararRationale(androidManifest) {
  const app = androidManifest?.manifest?.application?.[0]
  if (!app) throw new Error('AndroidManifest sem <application> — template do Expo mudou de forma')

  const main = acharMainActivity(app)
  if (!main) throw new Error('AndroidManifest sem .MainActivity — template do Expo mudou de forma')

  // ── Android ≤ 13
  if (!jaTemAcao(main, ACTION_RATIONALE)) {
    main['intent-filter'] = main['intent-filter'] || []
    main['intent-filter'].push({
      action: [{ $: { 'android:name': ACTION_RATIONALE } }],
      category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
    })
  }

  // ── Android ≥ 14
  app['activity-alias'] = app['activity-alias'] || []
  const jaTemAlias = app['activity-alias'].some((a) => a?.$?.['android:name'] === ALIAS_NAME)
  if (!jaTemAlias) {
    app['activity-alias'].push({
      $: {
        'android:name': ALIAS_NAME,
        'android:exported': 'true',
        'android:targetActivity': '.MainActivity',
        // Só o sistema pode abrir este alias. Sem esta permissão qualquer app poderia invocá-lo.
        'android:permission': 'android.permission.START_VIEW_PERMISSION_USAGE',
      },
      'intent-filter': [
        {
          action: [{ $: { 'android:name': ACTION_VIEW_USAGE } }],
          category: [{ $: { 'android:name': CATEGORY_HEALTH } }],
        },
      ],
    })
  }

  return androidManifest
}

const withHealthConnectRationale = (config) =>
  withAndroidManifest(config, (cfg) => {
    cfg.modResults = declararRationale(cfg.modResults)
    return cfg
  })

module.exports = withHealthConnectRationale
module.exports.declararRationale = declararRationale
module.exports.ACTION_RATIONALE = ACTION_RATIONALE
module.exports.ACTION_VIEW_USAGE = ACTION_VIEW_USAGE
module.exports.CATEGORY_HEALTH = CATEGORY_HEALTH
module.exports.ALIAS_NAME = ALIAS_NAME
