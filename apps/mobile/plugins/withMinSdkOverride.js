// Config plugin (CNG) — DISPONIBILIDADE UNIVERSAL: o app instala em todos os aparelhos, e o recurso que exige
// versão nova é que se declara indisponível onde não cabe.
//
// PRINCÍPIO (fundadora, 27/08/2026 — OBRIGATÓRIO): a plataforma tem que estar disponível para qualquer
// aparelho, no máximo de versões possível. Um recurso NÃO pode elevar o piso do app inteiro.
//
// O CASO CONCRETO: `androidx.health.connect:connect-client:1.1.0` declara `minSdk 26`. Sem esta sobreposição,
// o Gradle recusaria compilar com `minSdk 24` e a única saída seria subir o piso — tirando a SINTERA de todo
// aparelho com Android 7. E essas pessoas NUNCA teriam o Health Connect de qualquer forma: ele exige Android 9.
// Ou seja: perderiam o app inteiro por um recurso que jamais usariam.
//
// (A versão 1.2.0-alpha05 da biblioteca baixou o mínimo para 24 e tornaria isto desnecessário. É alpha —
// não entra numa plataforma de saúde. Quando estabilizar, esta sobreposição pode sair.)
//
// O QUE ISTO NÃO FAZ: não torna a biblioteca segura em Android 7. Ela continua exigindo 26 para rodar. O que
// nos protege é o código chamador, que importa a biblioteca SOB DEMANDA (`await import(...)`), envolve tudo em
// `try/catch`, e faz `healthConnectDisponivel()` devolver `false` em qualquer falha — ver
// `apps/mobile/src/infrastructure/healthConnect.ts`.
//
// ⚠️ O RISCO QUE SOBRA, e onde ele mora: a inicialização NATIVA do módulo acontece ANTES do nosso código. Se
// ela tocar algo que só existe do Android 8 em diante, o app fecha ao abrir — e proteção em JavaScript não
// alcança isso. É por isso que o Android documenta a sobreposição como caso raro que exige teste. VERIFICAR
// EM EMULADOR ANDROID 7 antes de publicar. Se falhar, o conserto é subir `minSdkVersion` para 26 no app.json.
//
// Ver docs/HIP-014 §5 e o princípio de disponibilidade universal.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- config plugin do Expo é CommonJS: o prebuild o carrega com require() do Node, e um import ESM aqui não seria resolvido.
const { withAndroidManifest } = require('@expo/config-plugins')

const NS_TOOLS = 'http://schemas.android.com/tools'

/**
 * Bibliotecas cujo `minSdk` é maior que o do app e que aceitamos sobrepor.
 * Lista EXPLÍCITA de propósito: sobrepor em bloco silenciaria a próxima biblioteca incompatível que alguém
 * acrescentar, e essa poderia ser uma que o app usa em caminho crítico.
 */
const BIBLIOTECAS = [
  'dev.matinzd.healthconnect',   // wrapper React Native
  'androidx.health.connect.client', // biblioteca AndroidX (é ela que declara minSdk 26)
]

/**
 * Transformação PURA sobre o objeto do AndroidManifest. Idempotente.
 * Lança se o manifesto não tiver `<manifest>` — significaria que o template do Expo mudou de forma, e falhar
 * alto é melhor que aplicar no vazio e descobrir só quando o app não instalar.
 * Exportada para teste sem `expo prebuild` (ver tests/mobile).
 */
function sobreporMinSdk(androidManifest, bibliotecas = BIBLIOTECAS) {
  const manifest = androidManifest?.manifest
  if (!manifest) throw new Error('AndroidManifest sem <manifest> — template do Expo mudou de forma')

  // O atributo `tools:` só vale se o namespace estiver declarado no elemento raiz.
  manifest.$ = manifest.$ || {}
  manifest.$['xmlns:tools'] = NS_TOOLS

  const lista = [...bibliotecas].join(',')
  manifest['uses-sdk'] = manifest['uses-sdk'] || [{ $: {} }]
  const usesSdk = manifest['uses-sdk'][0]
  usesSdk.$ = usesSdk.$ || {}
  usesSdk.$['tools:overrideLibrary'] = lista

  return androidManifest
}

const withMinSdkOverride = (config) =>
  withAndroidManifest(config, (cfg) => {
    cfg.modResults = sobreporMinSdk(cfg.modResults)
    return cfg
  })

module.exports = withMinSdkOverride
module.exports.sobreporMinSdk = sobreporMinSdk
module.exports.BIBLIOTECAS = BIBLIOTECAS
module.exports.NS_TOOLS = NS_TOOLS
