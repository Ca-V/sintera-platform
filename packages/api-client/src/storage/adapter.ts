// @sintera/api-client — Abstração de armazenamento GENÉRICA.
// Não conhece Supabase, Expo, Browser nem SecureStore. Cada plataforma injeta sua implementação:
// LocalStorageAdapter (web) · SecureStoreAdapter (mobile). Permite trocar a implementação sem tocar no domínio.
export interface StorageAdapter {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
}
