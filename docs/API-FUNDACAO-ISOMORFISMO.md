# Fundação de API — serviços isomórficos e a fronteira cliente↔servidor

**Status:** fundação consolidada. Regra permanente da camada `src/lib/api/` e dos
serviços de domínio `src/lib/<módulo>/service.ts`.

## Causa estrutural eliminada
`src/lib/api/http.ts` misturava **dois concerns**:
- **client-safe:** os erros de domínio `ValidationError` / `BadRequestError` (lançados
  pelos serviços);
- **só-servidor:** o envelope `authed()`, que importa `getAuthedSupabase` →
  `supabase/server` → **`next/headers`**.

Como os **serviços de domínio importavam `ValidationError` desse módulo**, e as **páginas
cliente importam os serviços** (para helpers puros como `buildMedPayload`), o bundle do
cliente arrastava `next/headers`. Resultado: **`next build` quebrava** (Turbopack:
"You're importing a module that depends on next/headers … in the Pages Router").

## Conceito permanente: o serviço de domínio é ISOMÓRFICO
Um `service.ts` é consumido por **dois lados**:
- pela **rota** (`api/<módulo>/route.ts`, servidor) — CRUD completo;
- pela **página** (cliente) — helpers puros (validação/parse) e tipos.

Logo, um serviço só pode depender de **módulos client-safe**. A fronteira:

| Módulo | Concern | Importa `next/headers`? | Quem importa |
|---|---|---|---|
| `src/lib/api/errors.ts` | erros de domínio (422/400) | **não** | serviços **e** rotas |
| `src/lib/api/db.ts` | helpers CRUD (supabase-js) | não | serviços |
| `src/lib/api/http.ts` | envelope `authed`, `errorToResponse`, `requiredId` | **sim** (via getAuthedSupabase) | **só rotas** |

Regra: **serviços importam erros de `@/lib/api/errors`** (nunca de `http.ts`).
`http.ts` reexporta os erros por conveniência das rotas, mas continua sendo o único
lugar só-servidor. `errors.ts` não importa nada de `next/*` nem de Supabase.

## Reauditoria
`next build` compila, passa o TypeScript e gera todas as páginas (o erro restante em
ambiente sem segredos é só `NEXT_PUBLIC_SUPABASE_*` ausente no prerender — não é código).
Nenhum componente cliente arrasta `next/headers`.

## Preparação para as próximas fases
Novas integrações (wearables, laboratórios, FHIR, Apple Health, Health Connect) seguem a
mesma fronteira: a lógica de domínio vive em serviços isomórficos (client-safe); o
envelope de rota autenticada permanece isolado no servidor.
