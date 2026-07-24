# MOBILE-013 — Incremento 2 (Navegação): Registro de Aceite

- **Status:** **ACCEPTED** — 2026-07-24
- **Onda:** 1 · **Incremento:** 2 (Navegação)
- **Branch:** `feat/mobile-inc2-navegacao` (nasce de `mobile-inc1-accepted` / `0d2a1f3`) · **tag:** `mobile-inc2-accepted`
- **Relaciona-se com:** [MOBILE-009](MOBILE-009_PLANEJAMENTO_INCREMENTO2_NAVEGACAO.md) (planejamento aprovado) · [MOBILE-008](MOBILE-008_INCREMENTO1_ACEITE.md) (Inc. 1) · [MOBILE-010](MOBILE-010_TOOLCHAIN_WINDOWS_NEW_ARCH.md) (toolchain)

## Escopo entregue

Infraestrutura de navegação: `NavigationContainer` → gate `AuthStack | AppNavigator` → **Bottom Tabs +
Stacks internos** (React Navigation v7), com as tabs **projetando a taxonomia SSOT** da Web (Sidebar) por
correspondência conceitual (não literal). Telas de domínio ficam para os incrementos seguintes (placeholders).
A camada de autenticação do Incremento 1 permaneceu **intocada**.

## Registro de aceite

```
Incremento 2 — Navegação
Status: ACCEPTED

Arquitetura de navegação ............ PASS
Implementação estrutural (E1-E5) .... PASS
Build / tsc / topologia ............. PASS
Gate (sessão → AppNavigator) ........ PASS
Navegação + projeção SSOT ........... PASS
Sem lógica de domínio na navegação .. PASS
Logout → AuthStack .................. PASS
Restauração de sessão (force-stop) .. PASS
Sem regressão de autenticação ....... PASS
Auditoria arquitetural .............. PASS

Sem pendências bloqueantes.
```

## Homologação funcional (executada pela fundadora no emulador, 2026-07-24)

Ciclo completo de autenticação sobre a nova arquitetura de navegação — validado em app real, não por
inspeção de código:

| Passo | Resultado | Evidência |
|-------|-----------|-----------|
| Login válido → Home | ✅ | app na `MainActivity`, abas visíveis |
| Navegação por todas as abas | ✅ | Minha Saúde/Documentos/Início projetam os itens do SSOT |
| Logout → Login | ✅ | volta ao `AuthStack` |
| Sessão removida no logout | ✅ | `SecureStore.xml` = 65 bytes, 0 `auth-token` |
| Login novamente | ✅ | sessão persistida (5493 bytes) |
| **Force-stop** + reabertura | ✅ | processo morto (PID 4359) → novo processo |
| Restauração direta no `AppNavigator` | ✅ | reabriu **nas abas** (não no Login) — `getSession` restaurou e o gate roteou para o AppNavigator |

**Risco principal do incremento mitigado:** a introdução de `NavigationContainer`/`AuthStack`/`AppNavigator`
**não alterou** o comportamento de autenticação nem a restauração de sessão (critério 11).

## Nota sobre a numeração dos critérios (MOBILE-009 §5)

Os 11 critérios estão íntegros. O **critério 9** é *"Relatório executivo"* — um processo de entrega, não um
teste de tela; por isso foi omitido da tabela de testes funcionais (que lista apenas 1–8, 10, 11). Não houve
remoção nem erro de numeração; este documento **é** o relatório executivo (critério 9).

## Execução em 5 etapas isoladas e reversíveis

E1 `ae03b5e` NavigationContainer+SafeAreaProvider · E2 `8fa138a` gate→AuthStack|AppNavigator ·
E3 `72515a5` navegadores reais (native-stack) · E4 `d686f7f` Bottom Tabs projetando o SSOT ·
E5 `ec4c3bc` native-stack interno por tab. Nota metodológica sobre o preview temporário (nunca commitado):
[MOBILE-009 §0](MOBILE-009_PLANEJAMENTO_INCREMENTO2_NAVEGACAO.md).

## Governança

Conforme a regra da Onda 1 (MOBILE-009 §9.1): cada incremento aceito = marco verificável (tag), base do
próximo. A integração ao ramo principal permanece condicionada ao encerramento da Onda 1. Próximo:
**Incremento 3 (Home)**, cuja branch de implementação nasce de `mobile-inc2-accepted`.
