# INC4-INTEGRATION-PLAN — Plano operacional de integração do Incremento 4 (Perfil)

> **Foco a partir de agora: integração e homologação — não mais desenvolvimento de base.** A infraestrutura
> compartilhada está consolidada e revisada. Este doc é o roteiro para a quarta‑feira (pós‑instalação da RAM).
> Base de decisões: [MOBILE‑016](MOBILE-016_PLANEJAMENTO_INCREMENTO4_PERFIL.md) · [MOBILE‑019](MOBILE-019_ESPECIFICACAO_OPERACIONAL_INC4.md) (contratos) · [MOBILE‑020](MOBILE-020_ROTEIRO_QUARTA.md) (ambiente).

## 0. Estratégia de branch (pré‑requisito)

A infra madura está distribuída em duas branches (a `pre-inc4-ready`/`feat/ds-switch-avatar` tem DS + profile +
reducer; a `feat/api-client-exams` tem, além disso, validation + @sintera/types + exams + asError consolidado).
**Ação:** a branch de implementação do Inc 4 nasce da **`feat/api-client-exams`** (a mais madura), que já contém
tudo que o Inc 4 consome. *(As duas convergem; `feat/api-client-exams` é superconjunto da `pre-inc4-ready`.)*

## 1. Ordem de integração

1. **api‑client/profile** — `getProfile`/`updateProfile`/`withTimeout` (pronto).
2. **validation** — `validateName`/`validatePhone`/`validateProfileEditable` (pronto).
3. **Design System** — `FieldRow` · `Input` · `Switch` · `Avatar` · `Button` · `Text` (pronto).
4. **reducer** — `profileMachine` (pronto) → encapsular no hook `useProfile`.
5. **tela** — `ProfileScreen` (compõe DS + hook).
6. **navegação** — entrada Perfil na aba "Mais".
7. **testes** — estáticos (sem supabase) + hook.
8. **homologação** — fluxo autenticado com a fundadora.

## 2. Dependências (o que está pronto × conectar × escrever na quarta)

| Camada | Estado | Ação na quarta |
|---|---|---|
| api‑client `profile` (getProfile/updateProfile/withTimeout) | ✅ **Pronto e testado** | **conectar** (o hook chama) |
| `@sintera/validation` (name/phone) | ✅ **Pronto e testado** | **conectar** (a tela valida antes de salvar) |
| DS (FieldRow/Input/Switch/Avatar/Button/Text) | ✅ **Pronto e testado** | **conectar** (montar a tela) |
| `profileMachine` (reducer puro) | ✅ **Pronto e testado** | **conectar** (o hook despacha) |
| `initials` (@sintera/utils) | ✅ Pronto | **conectar** no Avatar (consolida a duplicata) |
| **hook `useProfile`** | ⏳ **A escrever** | encapsula reducer + efeitos (getProfile no mount c/ abort; updateProfile no salvar) |
| **`ProfileScreen`** | ⏳ **A escrever** | compõe DS + consome o hook (name/phone edição; age_range/goals/avatar exibição) |
| **Navegação** (Mais → Perfil) | ⏳ **A escrever** | ponto de entrada no stack (Inc 2) |
| Testes de integração + estáticos | ⏳ **A escrever** | guarda "sem supabase direto"; transições do hook |

**Resumo:** camada de **dados + validação + DS + lógica de estado = prontas** (só conectar). O que se **escreve
na quarta** é a **camada RN** (hook wiring + tela + navegação) — o que depende do emulador.

## 3. Checklist de integração (quarta)

**Ambiente (Fase 0 — [MOBILE‑020](MOBILE-020_ROTEIRO_QUARTA.md)):**
- [ ] instalar RAM (16 GB) · [ ] validar ambiente (Node/Watchman) · [ ] abrir emulador (AVD 4 GB, cold boot)
- [ ] validar **Metro** (inicia sem erro) · [ ] validar **Gradle** (1º build limpo; anotar tempo)

**Gate:**
- [ ] homologar **Inc 3** (MOBILE‑017) → aceite/tag `mobile-inc3-accepted`

**Integração (só após o aceite):**
- [ ] branch do Inc 4 a partir de `feat/api-client-exams`
- [ ] **conectar api‑client** (profile no hook) · [ ] **conectar validation** (name/phone na tela)
- [ ] **conectar reducer** (useProfile encapsula profileMachine) · [ ] **conectar DS** (montar ProfileScreen)
- [ ] navegação (Mais → Perfil) · [ ] **validar fluxo completo** (abrir → editar → salvar → reabrir → persistido)
- [ ] **executar testes** (estáticos + hook + suíte) · [ ] **homologar** Inc 4 com a fundadora

## 4. Critérios de aceite (Inc 4 concluído quando)

1. A tela de Perfil **exibe** os campos centrais (via api‑client) + identificação da sessão.
2. **Editar nome/telefone + Salvar** persiste (`updateProfile`); reabrir reflete o salvo (persistência real pós logout→login).
3. **Validação** de name/phone na tela (via `@sintera/validation`) antes de gravar; erro claro no `FieldRow`.
4. Estados cobertos (MOBILE‑019 §4): carregando · vazio(defaults) · salvando(pessimista) · salvo · erro · offline · timeout.
5. **Fronteira Inc 1:** zero acesso direto ao SDK Supabase em `apps/mobile` (tudo via api‑client).
6. **Escopo limpo:** sem campos de outros domínios; preferências de notificação **fora** (D3); age_range/goals **exibição** (D1).
7. **Sem regressão** de auth/navegação/Home (Inc 1–3).
8. `tsc` + testes + **CI** verdes; homologação autenticada aprovada; **relatório executivo**.

---
*A partir daqui: NÃO iniciar novos domínios/packages/abstrações/utilitários. Foco = integração e homologação.*
