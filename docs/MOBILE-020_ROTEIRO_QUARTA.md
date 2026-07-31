# MOBILE-020 — Roteiro operacional da quarta (integração do Inc 4)

> Runbook curto para não perder contexto. **Pré‑condição:** a preparação estrutural + camada de dados já
> está pronta e testada (DS · api-client `profile` · reducer · harness · CI). A quarta é **só integração**.

## Fase 0 — Validação de ambiente (pós‑upgrade 8→16 GB)

O gargalo presumido eram ANRs de host por falta de RAM ([MOBILE-011](MOBILE-011_ESTABILIDADE_AMBIENTE_VALIDACAO_ANDROID.md)).
Antes de integrar, **confirmar que o gargalo sumiu de fato** — não só o AVD:

- [ ] **RAM total** = 16 GB (Task Manager / `systeminfo`).
- [ ] **AVD** `hw.ramSize` 3072→**4096** + **cold boot** (deixa ~12 GB p/ o host).
- [ ] **Android Emulator** sobe estável (sem ANR no boot).
- [ ] **Node** versão esperada (`node -v`) · **Metro** inicia sem erro.
- [ ] **Gradle** — 1º build limpo conclui; anotar **tempo de build** (baseline).
- [ ] **Watchman** (se instalado) ativo; senão, Metro em modo padrão.
- [ ] **Consumo de memória** durante `run android` estável (sem swap agressivo/ANR).

> Se qualquer item falhar, tratar **antes** de integrar — não presumir que o upgrade resolveu.

## Fase 1 — Homologar o Inc 3 (gate)

- [ ] Rodar o roteiro [MOBILE-017](MOBILE-017_HOMOLOGACAO_INCREMENTO3.md) (Home Shell) no emulador.
- [ ] **Aceite** → tag `mobile-inc3-accepted`.

## Fase 2 — Integração do Inc 4 (só após o aceite)

Sequência (a camada de dados e a lógica pura já existem e estão testadas — ver [MOBILE-019 §7](MOBILE-019_ESPECIFICACAO_OPERACIONAL_INC4.md)):

| Passo | Ação | Já pronto (reusar) |
|------|------|--------------------|
| 1 | Branch do Inc 4 a partir de `mobile-inc3-accepted` | — |
| 2 | **Encapsular o hook** `useProfile` sobre o reducer | `profileMachine.ts` (testado) + `api-client.profile` (testado) |
| 3 | **Montar a tela** `ProfileScreen` (name/phone edição; age_range/goals/avatar exibição) | `FieldRow` · `Input` · `Switch` · `Avatar` · `Button` |
| 4 | **Navegação** — ponto de entrada na aba "Mais" | stacks do Inc 2 |
| 5 | **Testes** (estáticos + hook) + **homologar Inc 4** | disciplina Inc 2/3 |

**Decisões já congeladas (não reabrir):** contrato `getProfile` (null=vazio, throw=falha) · whitelist name/phone ·
timeout 10 s · last‑write‑wins · sem cache/retry · escopo enxuto (D1/D3). Ver MOBILE-019 §8.

## Linha do tempo de referência (ajustável)

```
Instalar 16 GB → Cold boot AVD → Fase 0 (validação) → Homologar Inc 3 → aceite/tag
      → branch Inc 4 → hook → tela → navegação → testes → homologar Inc 4
```

---
*Fecha o ciclo de preparação das 48h. A partir daqui, trabalho de integração — sem definição arquitetural nem camada de dados a implementar.*
