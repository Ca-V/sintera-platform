// Mobile — ÚNICO código específico de plataforma para STORAGE.
// Implementa o StorageAdapter GENÉRICO do @sintera/api-client usando expo-secure-store (armazenamento cifrado).
import * as SecureStore from 'expo-secure-store'
import type { StorageAdapter } from '@sintera/api-client'

export const secureStoreAdapter: StorageAdapter = {
  get: (key) => SecureStore.getItemAsync(key),
  set: (key, value) => SecureStore.setItemAsync(key, value),
  remove: (key) => SecureStore.deleteItemAsync(key),
}
