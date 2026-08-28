// @sintera/core — identificador único. FONTE ÚNICA Web + Mobile.
//
// DISPONIBILIDADE UNIVERSAL (princípio da fundadora, 27/08, OBRIGATÓRIO): a plataforma abre em QUALQUER
// navegador e em QUALQUER aparelho. Nenhuma tela pode depender de uma API que só alguns têm.
//
// `crypto.randomUUID` parece universal e não é:
//   • Safari só a partir da 15.4 (março/2022) — em iOS 15.3 ou anterior, `undefined`;
//   • exige CONTEXTO SEGURO — em http (rede local, preview antigo) some até no Chrome atual;
//   • o Hermes, do React Native, não a traz.
//
// O sintoma é cruel: a pessoa escolhe o arquivo, e nada acontece. Sem erro visível, porque a exceção morre no
// meio do fluxo de upload. Ela conclui que a plataforma não funciona.
//
// A escada abaixo desce até o pior caso sem nunca quebrar.

/**
 * Forma MÍNIMA do que precisamos, declarada aqui em vez de usar o tipo `Crypto` do DOM: o core é agnóstico de
 * ambiente (roda no navegador, no React Native e no Node) e não carrega as tipagens do DOM. Descrever só o que
 * se usa também deixa explícito o quão pouco se depende.
 */
interface FonteAleatoria {
  randomUUID?: () => string
  getRandomValues?: <T extends Uint8Array>(array: T) => T
}

/** Fonte de aleatoriedade disponível, se houver. */
function cripto(): FonteAleatoria | undefined {
  return (globalThis as { crypto?: FonteAleatoria }).crypto
}

/** Monta um UUID v4 a partir de 16 bytes, conforme a RFC 4122 (versão e variante nos bits certos). */
function v4DeBytes(bytes: Uint8Array): string {
  bytes[6] = (bytes[6] & 0x0f) | 0x40   // versão 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80   // variante RFC
  const hex: string[] = []
  for (let i = 0; i < 16; i++) hex.push(bytes[i].toString(16).padStart(2, '0'))
  return [
    hex.slice(0, 4).join(''), hex.slice(4, 6).join(''), hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''), hex.slice(10, 16).join(''),
  ].join('-')
}

/**
 * Identificador único, em qualquer ambiente. Três degraus, do melhor ao aceitável:
 *
 *   1. `crypto.randomUUID` — quando existe;
 *   2. `crypto.getRandomValues` — presente desde o Safari 6.1 e em todo navegador que interessa, inclusive
 *      sem contexto seguro. É este degrau que resolve o caso real;
 *   3. `Math.random` — último recurso. NÃO é criptograficamente seguro, e por isso este identificador nunca
 *      deve ser usado como segredo, token ou chave: serve para nomear arquivo e distinguir item em lista.
 *      Para segredo, use uma fonte que EXIJA aleatoriedade forte e falhe quando não houver.
 */
export function uuid(): string {
  const c = cripto()

  if (c && typeof c.randomUUID === 'function') {
    try { return c.randomUUID() } catch { /* segue para o próximo degrau */ }
  }

  if (c && typeof c.getRandomValues === 'function') {
    try { return v4DeBytes(c.getRandomValues(new Uint8Array(16))) } catch { /* segue */ }
  }

  const bytes = new Uint8Array(16)
  for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256)
  return v4DeBytes(bytes)
}

/**
 * Segredo — token de compartilhamento, chave de link público. EXIGE aleatoriedade forte e **LANÇA** quando não
 * há: aqui a compatibilidade NÃO pode vencer a segurança.
 *
 * A diferença para `uuid()` é deliberada. Um identificador de arquivo que degrada para `Math.random` é
 * aceitável — o pior caso é uma colisão improvável. Um token de link para o prontuário de alguém, gerado por
 * `Math.random`, é adivinhável: quem souber o instante aproximado da criação reduz o espaço de busca a algo
 * viável. Falhar alto e pedir para tentar de novo é melhor que gerar um link fraco em silêncio.
 *
 * `getRandomValues` existe desde o Safari 6.1 e em todo navegador em uso — na prática isto nunca lança; o
 * `throw` é a garantia de que, se um dia não houver, ninguém receberá um link fraco sem saber.
 */
export function secureToken(bytes = 32): string {
  const c = cripto()
  if (!c || typeof c.getRandomValues !== 'function') {
    throw new Error('Este navegador não oferece aleatoriedade segura para gerar o link.')
  }
  const b = c.getRandomValues(new Uint8Array(bytes))
  let hex = ''
  for (let i = 0; i < b.length; i++) hex += b[i].toString(16).padStart(2, '0')
  return hex
}

/**
 * Nome de arquivo único para o armazenamento, preservando a extensão.
 * A extensão é higienizada: só letras e números, no máximo 10 caracteres — nome de arquivo vindo de fora
 * não entra em caminho de storage sem passar por aqui.
 */
export function storageFileName(originalName: string): string {
  const bruto = originalName.split('.').pop() ?? ''
  const ext = /^[A-Za-z0-9]{1,10}$/.test(bruto) ? bruto.toLowerCase() : ''
  return ext ? `${uuid()}.${ext}` : uuid()
}
