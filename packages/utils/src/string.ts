// @sintera/utils — utilidades de string genuinamente genéricas (sem domínio, sem IO).

/** Iniciais de um nome: primeira + última palavra, em maiúsculas. Vazio se não houver nome.
 *  Consolida a lógica hoje embutida no primitivo Avatar (DS) — mesma regra, um só lugar. */
export function initials(name: string | null | undefined): string {
  if (!name) return ''
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  const first = parts[0][0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}
