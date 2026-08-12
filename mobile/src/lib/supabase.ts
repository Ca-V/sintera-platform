// Cliente Supabase para React Native — sessão persistida em AsyncStorage.
// Mesma instância de projeto da Web; o Mobile só faz AUTH aqui (login/sessão/token).
// As LEITURAS/ESCRITAS de domínio vão pelas rotas /api via Bearer (ver lib/api.ts),
// reutilizando as regras já implementadas no backend.
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
