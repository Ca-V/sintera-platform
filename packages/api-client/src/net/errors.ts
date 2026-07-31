// @sintera/api-client — normalização de erro (uniforme em todo o pacote). Garante que toda falha vire um Error.
export function asError(e: unknown): Error {
  return e instanceof Error ? e : new Error(typeof e === 'string' ? e : 'Erro desconhecido')
}
