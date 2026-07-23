# ADR-017 — Guarda de reentrância no logout

- **Status:** Aceito
- **Data:** 2026-07-23
- **Contexto de origem:** Onda 1 · Incremento 1 (Autenticação) — validação funcional no emulador
- **Relaciona-se com:** Incremento 1 (auth) · `apps/mobile/src/presentation/screens/HomePlaceholder.tsx` · `apps/mobile/src/presentation/primitives/Button.tsx`

## Contexto

Durante a validação funcional do Incremento 1, foi observada **uma ocorrência isolada** em que a
sessão persistiu no armazenamento seguro (SecureStore) após uma sequência de **múltiplos toques** no
botão "Sair": a UI voltou ao Login, mas o token permaneceu no disco e um reinício completo do processo
(`am force-stop` + reabertura) **restaurou a sessão** na Home.

Investigação (separando fato de hipótese):

| # | Natureza | Afirmação |
|---|----------|-----------|
| 1 | **Fato** | O logout de **toque único** remove corretamente a sessão persistida; após `force-stop` + reabertura, o app permanece no Login (confirmado 2×). |
| 2 | **Fato** | Houve **1 ocorrência observada** da anomalia, sob uma sequência de múltiplos toques. |
| 3 | **Fato** | Uma **reprodução controlada** (double-tap com ~2,5s de espaçamento) **não reproduziu** o comportamento — resultou em logout limpo. |
| 4 | **Hipótese (não provada)** | Duas invocações concorrentes de `signOut()` (double-tap) disparam uma condição de corrida no armazenamento. O `auth-js` serializa `signOut` com lock interno, então o mecanismo exato não foi isolado. |
| 5 | **Conclusão** | A causa raiz permanece **inconclusiva**. |

## Decisão

Aplicar uma **guarda de reentrância** na operação de logout, independentemente da causa:

- `HomePlaceholder`: estado `isSigningOut`; `handleSignOut()` retorna imediatamente (no-op) se já houver
  um logout em andamento; envolve `await signOut()` em `try/finally`, restaurando o estado no `finally`.
- `Button`: o botão "Sair" recebe `loading={isSigningOut}` — o primitivo já desabilita o `Pressable`
  enquanto `loading` é verdadeiro (dupla proteção: no-op no handler **e** botão desabilitado na UI).
- Como efeito colateral saudável, o primitivo `Button` passou a aceitar `loadingLabel` (default
  preservado: `'Entrando…'`), evitando acoplar o componente ao caso de login e permitindo reúso
  (`'Saindo…'`, `'Salvando…'`, `'Enviando…'`, `'Excluindo…'`) sem proliferar variantes.

## Consequências

- Elimina a classe inteira de **múltiplas invocações concorrentes** de `signOut()`.
- Correção **preventiva**, localizada, na camada de apresentação; não altera a arquitetura de auth
  (api-client, StorageAdapter, cliente singleton permanecem intactos).

## Nota de aceitação

> A guarda de reentrância elimina múltiplas invocações da operação de logout independentemente da causa
> da anomalia originalmente observada. A investigação da causa raiz permaneceu inconclusiva e não bloqueia
> a aceitação do incremento.

## Validação

- `npx tsc --noEmit` (mobile) verde.
- Fluxo de validação da correção (emulador): login válido → Home → **triple-tap rápido** em "Sair"
  (apenas um `signOut`; botão exibe "Saindo…" e fica desabilitado) → Login → `force-stop` + reabertura
  → permanece no Login. *(Evidências anexadas na entrega do Incremento 1.)*
