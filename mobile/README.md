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
- `src/components/EventList.tsx` — lista/ações de eventos da Jornada (Agenda/Histórico/Gastos).
- `src/lib/upload.ts` — persistência de documento (câmera → storage), espelho de `api/storage.ts`.
- `app/` — rotas (expo-router, navegação por pilha): `(auth)/login`, `(app)/` (hub +
  agenda, histórico, gastos, exames, captura de exame, indicadores, condições,
  sinais-vitais, medidas, ciclo, medicamentos, recursos, hábitos, perfil).

## Como rodar
1. `cd mobile && npm install`
2. `cp .env.example .env` e preencher `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_URL`.
3. `npm run start` — abrir no Expo Go, simulador iOS ou emulador Android.

## Status
Núcleo funcional completo (Cenário A — paridade funcional). Implementado, reutilizando
100% as rotas `/api` da Web via Bearer:
- **Auth**: login, cadastro, logout.
- **Jornada**: Agenda (criar · concluir · cancelar · reabrir · excluir), Histórico, Gastos.
- **Exames**: lista + captura por câmera/galeria (upload → extração no backend).
- **Saúde**: Indicadores (biomarcadores organizados), Sinais vitais, Medidas, Ciclo,
  Medicamentos, Recursos, Hábitos, Condições.

Em desenvolvimento (pós-núcleo): Ômica (painéis/resultados), visões de Relatório/Insights,
preferências de notificação e push nativo.

Distribuição via TestFlight / Play Internal Testing. **Requer ambiente com toolchain
Expo/RN + dispositivo/simulador para build, execução e validação** — não realizável neste
container (etapa de homologação).
