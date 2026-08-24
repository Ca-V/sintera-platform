// Telefone com código de país — fonte única Web↔Mobile.
//
// PROBLEMA QUE ISTO RESOLVE: o envio de WhatsApp adivinhava o país ("se não começa
// com 55, prefixa 55"). Duas falhas reais:
//   1. usuária fora do Brasil tinha a mensagem enviada para um número brasileiro
//      que não é dela;
//   2. números do DDD 55 (Santa Maria/RS) já começam com "55", então a regra não
//      prefixava nada e o número saía sem DDD — nunca chegava.
// A correção é não adivinhar: o país é escolhido explicitamente e guardado junto.
//
// FORMATO DE ARMAZENAMENTO: E.164 com "+" — `+5511999999999`.
// COMPATIBILIDADE: valores antigos foram gravados só com dígitos, sem "+" e sem DDI
// (ex.: `11999999999`). Esses continuam sendo lidos como Brasil, que é o que sempre
// foram na prática. Ao editar e salvar, o número passa a carregar o "+DDI" explícito.
// Não é preciso migrar dado: a leitura cobre os dois formatos.

/** País discável: ISO 3166-1 alfa-2, nome em português e código de discagem. */
export interface DialCountry {
  readonly iso: string
  readonly name: string
  readonly dial: string
}

/** País padrão quando nada foi escolhido nem consta do valor gravado. */
export const DEFAULT_DIAL_ISO = 'BR'

/**
 * Países discáveis. Brasil e Portugal primeiro por serem os públicos diretos;
 * o restante em ordem alfabética. Lista aberta — acrescentar não quebra nada,
 * e o seletor liga a busca sozinho porque passa de 8 opções.
 */
export const DIAL_COUNTRIES: readonly DialCountry[] = [
  { iso: 'BR', name: 'Brasil',              dial: '55'  },
  { iso: 'PT', name: 'Portugal',            dial: '351' },
  { iso: 'DE', name: 'Alemanha',            dial: '49'  },
  { iso: 'AO', name: 'Angola',              dial: '244' },
  { iso: 'AR', name: 'Argentina',           dial: '54'  },
  { iso: 'AU', name: 'Austrália',           dial: '61'  },
  { iso: 'BE', name: 'Bélgica',             dial: '32'  },
  { iso: 'BO', name: 'Bolívia',             dial: '591' },
  { iso: 'CA', name: 'Canadá',              dial: '1'   },
  { iso: 'CL', name: 'Chile',               dial: '56'  },
  { iso: 'CN', name: 'China',               dial: '86'  },
  { iso: 'CO', name: 'Colômbia',            dial: '57'  },
  { iso: 'KR', name: 'Coreia do Sul',       dial: '82'  },
  { iso: 'ES', name: 'Espanha',             dial: '34'  },
  { iso: 'US', name: 'Estados Unidos',      dial: '1'   },
  { iso: 'FR', name: 'França',              dial: '33'  },
  { iso: 'IN', name: 'Índia',               dial: '91'  },
  { iso: 'IE', name: 'Irlanda',             dial: '353' },
  { iso: 'IL', name: 'Israel',              dial: '972' },
  { iso: 'IT', name: 'Itália',              dial: '39'  },
  { iso: 'JP', name: 'Japão',               dial: '81'  },
  { iso: 'MX', name: 'México',              dial: '52'  },
  { iso: 'MZ', name: 'Moçambique',          dial: '258' },
  { iso: 'NL', name: 'Países Baixos',       dial: '31'  },
  { iso: 'PY', name: 'Paraguai',            dial: '595' },
  { iso: 'PE', name: 'Peru',                dial: '51'  },
  { iso: 'GB', name: 'Reino Unido',         dial: '44'  },
  { iso: 'CZ', name: 'República Tcheca',    dial: '420' },
  { iso: 'ZA', name: 'África do Sul',       dial: '27'  },
  { iso: 'SE', name: 'Suécia',              dial: '46'  },
  { iso: 'CH', name: 'Suíça',               dial: '41'  },
  { iso: 'UY', name: 'Uruguai',             dial: '598' },
]

/**
 * Bandeira do país a partir do ISO — calculada, não tabelada. Cada letra vira o
 * "regional indicator symbol" correspondente (A → 🇦), e o par forma a bandeira.
 * Evita mais uma lista para manter em sincronia.
 */
export function flagOf(iso: string): string {
  const up = (iso ?? '').toUpperCase()
  if (!/^[A-Z]{2}$/.test(up)) return ''
  return String.fromCodePoint(...[...up].map(c => 0x1f1e6 + c.charCodeAt(0) - 65))
}

/**
 * Rótulo do país no seletor — fonte única do TEXTO, não só da lista.
 * Todas as telas que oferecem código de país (Perfil e Configurações, Web e
 * Mobile) usam este mesmo rótulo, para o seletor ser reconhecivelmente o mesmo
 * controle em qualquer lugar do produto.
 */
export function dialLabel(c: DialCountry): string {
  return `${flagOf(c.iso)} ${c.name} +${c.dial}`
}

/** Opções prontas para o seletor, na ordem do catálogo. */
export function dialSelectOptions(): { id: string; label: string }[] {
  return DIAL_COUNTRIES.map(c => ({ id: c.iso, label: dialLabel(c) }))
}

/** Só dígitos. */
function digitsOf(raw: string): string {
  return raw.replace(/\D/g, '')
}

/** País pelo ISO; `undefined` se não existir na lista. */
export function dialCountryByIso(iso: string | null | undefined): DialCountry | undefined {
  if (!iso) return undefined
  const up = iso.toUpperCase()
  return DIAL_COUNTRIES.find(c => c.iso === up)
}

/**
 * Separa um telefone guardado em país + número nacional, para exibir no formulário.
 *
 * - `+5511999999999` → { iso: 'BR', national: '11999999999' }
 * - `11999999999`    → { iso: 'BR', national: '11999999999' }   (legado, sem "+")
 * - vazio            → { iso: 'BR', national: '' }
 *
 * Quando há "+", o DDI é lido do próprio valor: **não se adivinha**. Prefixos
 * ambíguos (ex.: "1" dos EUA e Canadá) resolvem para a primeira entrada da lista —
 * o dígito discado é o mesmo, então o envio não muda.
 */
export function splitPhone(stored: string | null | undefined): { iso: string; national: string } {
  const raw = (stored ?? '').trim()
  if (raw.length === 0) return { iso: DEFAULT_DIAL_ISO, national: '' }

  if (!raw.startsWith('+')) {
    // Legado: gravado sem DDI. Sempre foi tratado como Brasil.
    return { iso: DEFAULT_DIAL_ISO, national: digitsOf(raw) }
  }

  const d = digitsOf(raw)
  // Do DDI mais longo para o mais curto, para "351" não ser confundido com "35".
  const byLength = [...DIAL_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length)
  const hit = byLength.find(c => d.startsWith(c.dial))
  if (!hit) return { iso: DEFAULT_DIAL_ISO, national: d }
  return { iso: hit.iso, national: d.slice(hit.dial.length) }
}

/**
 * Monta o valor a gravar: E.164 com "+". Número nacional vazio → `null`
 * (o campo é opcional; vazio limpa).
 */
export function joinPhone(iso: string | null | undefined, national: string | null | undefined): string | null {
  const nat = digitsOf(national ?? '')
  if (nat.length === 0) return null
  const country = dialCountryByIso(iso) ?? dialCountryByIso(DEFAULT_DIAL_ISO)!
  return `+${country.dial}${nat}`
}

/**
 * Destinatário para APIs de mensagem (E.164 só-dígitos, sem "+").
 * Valor com "+" é respeitado como está; valor legado sem "+" recebe o DDI do Brasil,
 * que é o que ele sempre significou. Retorna `null` se for curto demais para ser válido.
 */
export function toDialDigits(stored: string | null | undefined): string | null {
  const raw = (stored ?? '').trim()
  if (raw.length === 0) return null

  if (raw.startsWith('+')) {
    const d = digitsOf(raw)
    return d.length >= 10 ? d : null
  }

  const d = digitsOf(raw)
  if (d.length < 10) return null
  const br = dialCountryByIso('BR')!
  return `${br.dial}${d}`
}
