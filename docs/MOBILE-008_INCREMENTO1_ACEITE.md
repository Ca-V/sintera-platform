# MOBILE-008 — Incremento 1 (Autenticação): Registro de Aceite

- **Status:** **ACCEPTED** — 2026-07-23
- **Onda:** 1 · **Incremento:** 1 (Autenticação)
- **Branch:** `upg/expo-sdk-54` · **último commit:** `9b5bb0e`
- **Relaciona-se com:** [MOBILE-001](MOBILE-001_PLANO_EXECUTIVO_RN.md) · [MOBILE-002](MOBILE-002_ADAPTADOR_DS_RN.md) · [ADR-011](adr/ADR-011_ARQUITETURA_COMPONENTES_CROSSPLATFORM.md) · [ADR-016](adr/ADR-016_INSTANCIA_UNICA_REACT.md) · [ADR-017](adr/ADR-017_GUARDA_REENTRANCIA_LOGOUT.md)

## Escopo entregue

Autenticação móvel completa: tela de login (identidade DS-002), autenticação real via Supabase,
persistência de sessão e navegação para a Home placeholder. Regra de fronteira respeitada: **nenhum
arquivo em `apps/mobile` chama o SDK do Supabase diretamente** — todo acesso passa pelo
`@sintera/api-client` (ponto único de `createClient()`, cliente singleton).

## Registro de aceite

```
Incremento 1
Status: ACCEPTED

Arquitetura ............... PASS
Implementação ............. PASS
Build ..................... PASS
Design System ............. PASS
Autenticação .............. PASS
Persistência .............. PASS
Logout .................... PASS
Force-stop Recovery ....... PASS
Auditoria Arquitetural .... PASS
Guarda de reentrância ..... PASS (comportamental; estado visual verificado por implementação)

Sem pendências bloqueantes.
```

## Evidências (validação no emulador Pixel 8 · API 35 · Expo SDK 54)

| Critério | Evidência |
|----------|-----------|
| Build Gradle | `BUILD SUCCESSFUL in 1m 45s` |
| APK instalado | `health.sintera.app` instalado e executando |
| Login inválido | msg "Credenciais inválidas…", permanece no login, campos em estado de erro |
| Login válido | Home "Autenticado como carinaleite.br@gmail.com" |
| Persistência (force-stop) | processo morto (`am force-stop`) → reabertura → **Home restaurada**; `SecureStore.xml` sobreviveu ao kill |
| Logout | `SecureStore.xml` esvaziado/removido → Login |
| Retorno ao Login | logout → Login; force-stop+reabrir → permanece no Login |
| Auditoria arquitetural | zero imports de `@supabase/supabase-js` / `createClient(` / `supabase.auth.*` em `apps/mobile` |
| Guarda de reentrância | triple-tap rápido em "Sair" → **um único logout limpo** → Login; SecureStore removido; force-stop → Login |

## Decisões estruturais registradas nesta entrega

- **ADR-016** — Instância única de React no Metro (web 19.2.4 × mobile 19.1.0). Solução **temporária**;
  reavaliar na convergência de versões.
- **ADR-017** — Guarda de reentrância no logout (medida preventiva; causa raiz da anomalia isolada
  permaneceu inconclusiva e não bloqueia a aceitação).

## Anomalia investigada (não bloqueante)

Foi observada **uma ocorrência isolada** de persistência de sessão após múltiplos toques no botão de
logout. A reprodução controlada **não** reproduziu o comportamento de forma determinística. Como medida
preventiva, foi implementada a guarda de reentrância (ADR-017), eliminando a classe de múltiplas
invocações concorrentes de `signOut()`. A causa raiz permaneceu inconclusiva.

## Congelamento

A partir deste aceite, a implementação do Incremento 1 está **congelada**: nenhuma alteração de código
adicional nesta branch antes do merge. O próximo passo é **exclusivamente administrativo** — planejamento
e escopo do Incremento 2 —, sem misturar nova implementação.
