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
- `src/lib/useResource.ts` — espelho-Mobile do `useListResource` da Web (recurso de lista via Bearer).
- `src/components/ui.tsx` — kit de UI (Screen, Card, Button, Field…).
- `src/components/CrudList.tsx` — CRUD genérico de recurso de lista (casa com `useResource`).
- `app/` — rotas (expo-router, navegação por pilha): `(auth)/login`, `(app)/` (hub +
  exames, condições, sinais-vitais, medicamentos, recursos, hábitos, perfil).

## Como rodar
1. `cd mobile && npm install`
2. `cp .env.example .env` e preencher `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_URL`.
3. `npm run start` — abrir no Expo Go, simulador iOS ou emulador Android.

## Status
Fundação + núcleo de saúde implementados: auth (login/cadastro/logout), navegação por
pilha com hub, client de API Bearer, e telas de exames + 5 CRUDs completos (condições,
sinais-vitais, medicamentos, recursos, hábitos) reutilizando as rotas `/api` da Web.
Em desenvolvimento: agenda, timeline, relatórios, indicadores de saúde, gastos, ômica,
ciclo, medidas e captura de exame por câmera. Distribuição via TestFlight / Play Internal
Testing. Requer ambiente com toolchain Expo/RN + dispositivo/simulador para build e validação.
