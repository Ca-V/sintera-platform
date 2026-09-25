// Adaptador Web — carregamento TÉCNICO das fontes que o DS-002 escolheu (BRAND-002 v2.1). Três camadas:
//   Fraunces (títulos) · Hanken Grotesk (interface/leitura) · IBM Plex Mono (dados científicos).
// A DECISÃO tipográfica está no token; aqui só disponibilizamos os arquivos.
//
// ============================================================================================
// POR QUE OS ARQUIVOS ESTÃO NO REPOSITÓRIO (25/09/2026)
// ============================================================================================
// O `next/font/google` JÁ auto-hospedava: ele baixa do Google NO BUILD, emite os arquivos e gera o CSS. O
// runtime nunca falou com o Google. O ponto frágil era só o download durante o build — e ele derrubou o CI
// duas vezes em dois dias, com `module-not-found` no `.module.css` gerado para a Hanken. Cada queda custava
// uma reexecução e travava um merge.
//
// Um build que depende de uma requisição externa falha por motivo que não é do código. A correção é tirar a
// requisição, não repetir a tentativa.
//
// OS ARQUIVOS SÃO OS MESMOS BYTES. Não foram baixados de novo: saíram de `.next/static/media/`, o resultado
// do próprio build de 25/09/2026 com `next/font/google`. Glifo por glifo, é a mesma fonte que já estava em
// produção. Isto NÃO é evolução do DS-002 congelado — mesmas famílias, mesmos pesos, mesmos tokens. O que
// mudou é de onde o build pega o arquivo.
//
// SUBCONJUNTO LATINO APENAS, e é decisão consciente. O Google servia três faixas por família (latin,
// latin-ext, vietnamita) — 17 arquivos, 244 KB. O `next/font/local` não expõe `unicode-range`, então ou se
// leva só uma faixa ou se carregam todas sempre. O latino cobre TODO o português: ã, õ, ç, é, á, à, â, ê, í,
// ó, ú, ü estão no Latin-1 Supplement.
//   Consequência que fica registrada: um nome próprio com caractere fora do latino (ł, ā, ş) renderiza na
//   fonte de fallback naquele caractere. Não quebra nada; fica levemente diferente. É decisão, não defeito.
//
// AS MÉTRICAS DE FALLBACK SÃO DECLARADAS À MÃO, e foi medição que obrigou a isso.
//
// A primeira tentativa usou `adjustFontFallback: 'Times New Roman' | 'Arial'`, supondo que o Next
// recalcularia os mesmos números a partir dos mesmos bytes. Não recalcula iguais — e a diferença é grande:
//
//        Fraunces        antes size-adjust 115.45%   com adjustFontFallback  126.68%
//        Hanken Grotesk  antes            100.94%                            101.56%
//        IBM Plex Mono   antes            134.59%                            131.49%
//
// O motivo: pelo caminho do Google, o Next usa as métricas da FAMÍLIA INTEIRA (dados de capsize). Pelo
// caminho local, ele deriva do arquivo que recebe — e o nosso é o subconjunto latino, cuja largura média de
// caractere é calculada sobre menos glifos. O número do Google é o mais fiel à fonte real; o local é enviesado
// pelo recorte.
//
// Então `adjustFontFallback: false` e as três faces de fallback escritas em `globals.css` com os valores
// EXATOS que produção renderiza hoje. Sem isso, um título em Fraunces apareceria ~10% maior antes da troca,
// e o salto no primeiro paint seria visível — coisa que hoje não acontece.
//
// AS FONTES CONGELAM NESTA VERSÃO. Deixam de receber correções do upstream — que sob o DS-002 congelado é o
// comportamento desejado, não efeito colateral. Para atualizar: trocar o arquivo e conferir as métricas.
//
// Licenças OFL em `fontes/OFL-*.txt`, exigidas pela redistribuição.
//
// Uma catraca (`tests/ui/ARCH-fontes-locais.test.ts`) falha se `next/font/google` reaparecer em qualquer
// arquivo — é o que impede o problema de voltar pela porta dos fundos.
// ============================================================================================
import localFont from 'next/font/local'

// Fraunces e Hanken Grotesk são VARIÁVEIS: um arquivo cobre toda a faixa de peso declarada.
// As faixas são exatamente as que a plataforma usa hoje — nada a mais, nada a menos.
export const frauncesFont = localFont({
  src: [{ path: './fontes/Fraunces-latin.woff2', weight: '400 600', style: 'normal' }],
  variable: '--font-fraunces',
  display: 'swap',
  // Ver o bloco do cabeçalho: o cálculo automático diverge do que produção renderiza hoje.
  adjustFontFallback: false,
  fallback: ['Fraunces Fallback', 'Georgia', 'Times New Roman', 'serif'],
})

export const hankenFont = localFont({
  src: [{ path: './fontes/HankenGrotesk-latin.woff2', weight: '300 700', style: 'normal' }],
  variable: '--font-hanken',
  display: 'swap',
  adjustFontFallback: false,
  fallback: ['Hanken Grotesk Fallback', 'system-ui', '-apple-system', 'sans-serif'],
})

// Mono só para DADOS (valores/índices/IDs/códigos) — pesos enxutos (regular/medium) bastam. Estática: um
// arquivo por peso, como o Google servia.
export const monoFont = localFont({
  src: [
    { path: './fontes/IBMPlexMono-400-latin.woff2', weight: '400', style: 'normal' },
    { path: './fontes/IBMPlexMono-500-latin.woff2', weight: '500', style: 'normal' },
  ],
  // SEM `variable` de propósito. A mono nunca teve uma, e `--font-mono` é nome que o Tailwind já usa para a
  // própria família monoespaçada padrão — declará-la aqui sobrescreveria a utilitária `font-mono` do
  // framework. Quem precisa da IBM Plex Mono a obtém pelo token, via `resolveFontFamily`.
  display: 'swap',
  adjustFontFallback: false,
  fallback: ['IBM Plex Mono Fallback', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
})

/** Mapeia a família declarada no token (ex.: "'Fraunces', …") para a fonte realmente carregada. */
export function resolveFontFamily(tokenFamily: string): string {
  if (tokenFamily.includes('Fraunces')) return frauncesFont.style.fontFamily
  if (tokenFamily.includes('Hanken')) return hankenFont.style.fontFamily
  if (tokenFamily.includes('IBM Plex Mono')) return monoFont.style.fontFamily
  return tokenFamily
}
