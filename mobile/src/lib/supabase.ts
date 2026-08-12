// Cliente Supabase para React Native — sessão persistida em AsyncStorage.
// Mesma instância de projeto da Web; o Mobile só faz AUTH aqui (login/sessão/token).
// As LEITURAS/ESCRITAS de domínio vão pelas rotas /api via Bearer (ver lib/api.ts),
// reutilizando as regras já implementadas no backend.
import 'react-native-url-polyfill/auto'
import { AppState } from 'react-native'
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

// Em React Native, o timer de auto-refresh do Supabase precisa ser atrelado ao AppState
// (requisito do guia oficial Expo+Supabase): renova o token só em primeiro plano e para
// quando em segundo plano. Sem isto, a sessão pode expirar silenciosamente (~1h) e TODAS
// as chamadas /api passam a retornar 401 — o app parece "quebrado" depois de um tempo.
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh()
  else supabase.auth.stopAutoRefresh()
})
