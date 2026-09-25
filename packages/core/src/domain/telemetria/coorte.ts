// @sintera/core — VAL-001 §2.1, mitigação 4: o único braço do experimento que é sorteável.
//
// ============================================================================================
// O PROBLEMA QUE ISTO RESOLVE
// ============================================================================================
// O plano §42 propõe comparar quem usa sozinho, quem tem profissional vinculado, e quem além disso recebe
// documentos. Mas **ninguém pode ser sorteado para "ter um nutricionista que aceita entrar na plataforma"**.
// Quem tem profissional acompanhando provavelmente já é mais organizada e mais disposta a pagar ANTES de
// conhecer a SINTERA.
//
// Então a diferença observada entre os grupos mistura o efeito do vínculo com a seleção de quem o tem — e
// atribuir tudo ao vínculo SUPERESTIMA exatamente a aposta central do negócio.
//
// O que É sorteável: **oferecer o convite**. Metade dos cadastros novos recebe o passo de convidar
// profissional no onboarding; metade não. Isso mede o efeito de OFERECER o vínculo, que é o que a plataforma
// controla — e mede sem viés, porque o sorteio não olha para quem é a pessoa.
//
// ============================================================================================
// DUAS PROPRIEDADES QUE O SORTEIO PRECISA TER
// ============================================================================================
// 1. DETERMINÍSTICO por pessoa. A mesma pessoa cai sempre no mesmo braço, em qualquer aparelho e em qualquer
//    recarregamento. Um sorteio aleatório a cada abertura faria a pessoa ver o passo num dia e não no outro —
//    experiência errática e medição sem sentido.
// 2. Independente de qualquer atributo dela. Não olha e-mail, idade, região nem origem. Só o identificador.

export type BracoDoConvite = 'oferece' | 'nao_oferece'

/**
 * Hash determinístico e estável (FNV-1a de 32 bits).
 *
 * Escolhido por ser pequeno, sem dependência, e igual em qualquer runtime — Web, Hermes ou Node. NÃO é
 * criptográfico, e não precisa ser: ninguém ganha nada prevendo o próprio braço, e o que se exige aqui é
 * reprodutibilidade, não segredo.
 */
export function hashEstavel(valor: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < valor.length; i++) {
    h ^= valor.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

/**
 * O braço desta pessoa. Metade recebe o passo de convidar profissional no onboarding, metade não.
 *
 * `semente` separa este experimento de qualquer outro que venha depois: sem ela, dois experimentos usando o
 * mesmo `userId` dariam braços correlacionados, e uma diferença de um apareceria disfarçada no outro.
 */
export function bracoDoConvite(userId: string, semente = 'convite-no-onboarding-v1'): BracoDoConvite {
  return hashEstavel(`${semente}:${userId}`) % 2 === 0 ? 'oferece' : 'nao_oferece'
}

/** O onboarding mostra o passo de convidar profissional? */
export function deveOferecerConvite(userId: string, semente?: string): boolean {
  return bracoDoConvite(userId, semente) === 'oferece'
}

/**
 * O que vai em `metadata` do evento `coorte_atribuida`. Só o braço e a semente — nada sobre a pessoa.
 *
 * A semente entra porque, sem ela, uma análise futura não saberia de QUAL experimento aquele braço veio.
 */
export function metadataDaCoorte(userId: string, semente = 'convite-no-onboarding-v1'): { coorte: string; versao: string } {
  return { coorte: bracoDoConvite(userId, semente), versao: semente }
}
