# SINTERA — App Mobile (Expo / React Native)

App nativo (iOS + Android) da plataforma SINTERA. **Reutiliza 100% do backend da Web**:
autentica via Supabase e consome as rotas `/api/*` com o token da sessão no header
`Authorization: Bearer` (a Web já suporta isso — ADR-020, `getAuthedSupabase`). Nenhuma
regra de negócio é reimplementada aqui; o app é um cliente das APIs existentes.

## Arquitetura
- `src/lib/supabase.ts` — auth Supabase (sessão em AsyncStorage).
- `src/lib/api.ts` — client tipado das rotas `/api` com Bearer.
- `src/lib/auth.tsx` — contexto de sessão (login/cadastro/logout).
- `src/lib/theme.ts` — tokens de design (espelham a identidade da Web).
- `app/` — rotas (expo-router): `(auth)/login`, `(app)/` (abas: Início, Exames, Perfil).

## Como rodar
1. `cd mobile && npm install`
2. `cp .env.example .env` e preencher `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_URL`.
3. `npm run start` — abrir no Expo Go, simulador iOS ou emulador Android.

## Status
Fundação implementada (auth + navegação + client de API + telas: login, início, exames,
perfil). Telas de núcleo restantes (agenda, timeline, relatórios, saúde, gastos, 7 CRUDs,
ômica, captura por câmera) em desenvolvimento. Distribuição via TestFlight / Play Internal
Testing. Requer ambiente com toolchain Expo/RN + dispositivo/simulador para build.
