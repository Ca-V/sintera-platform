// Smoke test executável da normalização do Resolver — sem dependências.
// Rode com: node src/lib/ai/insights/__smoke__/resolver.normalize.mjs
//
// Valida o mapa de remoção de acentos contra nomes REAIS de biomarcadores
// que aparecem em produção (casing/acentos variados). Replica a função
// normalizeBiomarkerName de resolver.ts — manter as duas em sincronia.

const ACCENT_FROM = 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç'
const ACCENT_TO   = 'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc'
const ACCENT_MAP = {}
for (let i = 0; i < ACCENT_FROM.length; i++) ACCENT_MAP[ACCENT_FROM[i]] = ACCENT_TO[i]

function normalizeBiomarkerName(name) {
  let out = ''
  for (const ch of name) out += ACCENT_MAP[ch] ?? ch
  return out.toLowerCase().trim()
}

// [entrada do laudo, chave normalizada esperada (== alias_normalized no banco)]
const cases = [
  ['Hemoglobina', 'hemoglobina'],
  ['HEMOGLOBINA', 'hemoglobina'],
  ['Hematócrito', 'hematocrito'],
  ['Hematocrito', 'hematocrito'],
  ['Basófilos', 'basofilos'],
  ['Basófilos (absoluto)', 'basofilos (absoluto)'],
  ['CREATININA', 'creatinina'],
  ['Creatinina', 'creatinina'],
  ['CÁLCIO IÔNICO', 'calcio ionico'],
  ['SÓDIO (24 HORAS)', 'sodio (24 horas)'],
  ['ÁCIDO CÍTRICO - CITRATO', 'acido citrico - citrato'],
  ['Ritmo de Filtração Glomerular', 'ritmo de filtracao glomerular'],
  ['PARATORMÔNIO PTH INTACTO (MOLÉCULA INTEIRA)', 'paratormonio pth intacto (molecula inteira)'],
  ['Reação (pH)', 'reacao (ph)'],
  ['Urobilinogênio', 'urobilinogenio'],
  ['  Ureia  ', 'ureia'],
]

let failures = 0
for (const [input, expected] of cases) {
  const got = normalizeBiomarkerName(input)
  const ok = got === expected
  if (!ok) failures++
  console.log(`${ok ? 'OK  ' : 'FAIL'}  "${input}" -> "${got}"${ok ? '' : `  (esperado: "${expected}")`}`)
}

console.log(`\n${cases.length - failures}/${cases.length} casos OK`)
if (failures > 0) {
  console.error(`${failures} falha(s) na normalização`)
  process.exit(1)
}
