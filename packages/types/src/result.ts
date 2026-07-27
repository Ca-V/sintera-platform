// @sintera/types — Result discriminado (canônico). Só o CONTRATO; helpers (ok/err) ficam em @sintera/validation.
export type Result<T, E = string> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E }
