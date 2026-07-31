# MOBILE-015 — Roadmap oficial dos Incrementos Mobile (Onda 1)

- **Status:** **OFICIALIZADO** (fundadora, 2026-07-24). **Refina/supersede a ordem de incrementos do
  [MOBILE-001](MOBILE-001_PLANO_EXECUTIVO_RN.md)** para refletir a evolução do produto (mobile como interface
  principal; a Home como **composição** preparada para receber capacidades independentes — [ADR-018](adr/ADR-018_HOME_COMPOSICAO_DE_SLOTS.md)).
- **Natureza:** documento de planejamento. **Nenhuma implementação.** Governança da Onda 1 preservada.

## Lógica arquitetural da ordem

A sequência segue quatro fases, do estável para o dependente:

1. **Infraestrutura** — navegação e Home (a casca sobre a qual tudo é composto).
2. **Domínios fundamentais** — Perfil e o pilar de Exames (visualizar → adicionar → registrar).
3. **Orquestração** — o RegistrationHub, que passa a encaminhar para **funcionalidades reais** (não placeholders).
4. **Features dependentes de dados** — Composição Corporal, Agenda e Insights, que só entregam valor com uma
   base de saúde já existente.

## Roadmap

| # | Incremento | Status | Justificativa (fundadora) |
|---|------------|--------|---------------------------|
| 1 | **Autenticação** | ✅ ACCEPTED ([MOBILE-008](MOBILE-008_INCREMENTO1_ACEITE.md)) | Base da experiência autenticada. |
| 2 | **Navegação** | ✅ ACCEPTED ([MOBILE-013](MOBILE-013_INCREMENTO2_ACEITE.md)) | Infraestrutura de navegação (Bottom Tabs + stacks; projeção do SSOT). |
| 3 | **Home Shell** | ✅ ACCEPTED (2026-07-30, dispositivo físico via nuvem-first — [MOBILE-021](MOBILE-021_INCREMENTO3_ACEITE.md); tag `mobile-inc3-accepted`) | Casca da Home como composição de slots (ADR-018). |
| 4 | **Perfil** | ⬜ próximo | Domínio autocontido; fornece dados que vários módulos usarão; não depende de exames/insights; completa a base autenticada. |
| 5 | **Histórico de Exames** | ⬜ | Pilar da proposta de valor da SINTERA; base para diversos recursos posteriores. |
| 6 | **Upload de Exames** | ⬜ | Complementa o histórico (visualizar → adicionar); sequência intuitiva para o usuário. |
| 7 | **Registro Manual** | ⬜ | Outra forma de alimentar o mesmo domínio de dados. |
| 8 | **RegistrationHub** | ⬜ | Orquestração — só faz sentido quando já houver **destinos úteis reais** (não placeholders). HUB-001. |
| 9 | **Composição Corporal** | ⬜ | Depende de base de saúde existente. |
| 10 | **Agenda** | ⬜ | Depende de base existente. |
| 11 | **Insights** | ⬜ | Consome informações de **múltiplos domínios** — precisa da consolidação dos dados. |

## Notas de sequenciamento

- **RegistrationHub adiado para o #8 (e não agora):** embora central para a experiência, hoje ele apontaria
  para capacidades ainda inexistentes no mobile — viraria uma camada de navegação para telas incompletas. É
  mais consistente introduzi-lo quando já houver destinos úteis (Perfil + domínio de Exames prontos).
- **Insights por último (#11):** por depender da consolidação de dados de vários domínios.
- Cada domínio futuro **preenche um slot** da Home Shell (ADR-018) **sem redesenhá-la** — a Home já está pronta
  para isso (Summary/Timeline/Insights reservados).

## Governança (Onda 1)

- **Nenhum incremento funcional novo começa antes da homologação/aceite do anterior.** O Incremento 4 (Perfil)
  só inicia após o aceite do Incremento 3.
- Cada incremento aceito = **marco verificável (tag)**, base do seguinte (nasce do tag do anterior).
- Integração ao ramo principal permanece condicionada ao **encerramento da Onda 1** + critérios de integração.
- Reordenações futuras deste roadmap são decisão de produto da fundadora (documentar a mudança).

## Política de Validação (nuvem-first) — 2026-07-29

> **Decisão da fundadora (ratifica [ADR-012](adr/ADR-012_CONTINUIDADE_OPERACIONAL.md) / [GOV-002](GOV-002_ONBOARDING_HANDOVER.md)):** o notebook de
> desenvolvimento é **apenas um ponto de acesso** ao projeto; o projeto vive no **GitHub (fonte única da
> verdade)**. A infraestrutura de desenvolvimento se adapta ao projeto — nunca o contrário.

**Princípio:** **nenhum incremento é bloqueado por limitação de hardware do notebook** (ex.: RAM insuficiente
para o emulador Android local). Editar código, `typecheck` e testes rodam **localmente e sem limite**; o
**build pesado e a homologação** rodam **na nuvem (EAS Build) + dispositivo físico**.

**Fluxo oficial de validação:**

```
edição local → GitHub → EAS Build (Expo Cloud) → APK → celular Android → homologação → tag de aceite → próximo incremento
```

> **Runbook de comandos reproduzível** (login → whoami → project:info → build → homologação): [MOBILE-003 §3.1](./MOBILE-003_PROVISIONAMENTO_EXPO_EAS.md).

**Definição de "incremento concluído"** (encaixa no LIFECYCLE existente — não é régua paralela). Um
incremento só é ACCEPTED quando reúne, todos:
1. **código no GitHub** (branch do incremento, nascida do tag do anterior);
2. **documentação atualizada** (planejamento + aceite + roteiro de homologação);
3. **`typecheck` verde** (`npm run typecheck:mobile`);
4. **testes verdes** (arquitetura/contrato — `tests/mobile`, `tests/contracts`);
5. **build EAS bem-sucedido** (perfil `preview` → APK);
6. **homologação em dispositivo físico** (roteiro do incremento) sem regressões;
7. **tag de aceite** (`mobile-incN-accepted`).

**Notas operacionais:**
- **EAS grátis tem limite mensal de builds** → validar **por incremento** (em lote), não a cada commit. O ciclo
  de código (editar/typecheck/testar) permanece local e contínuo.
- **Transferibilidade:** os **templates de ambiente** (`.env.example`, sem valores) são **versionados**; segredos
  (`.env`, chaves, certificados) **nunca**. Assim qualquer dev clona o repo e sabe o que preencher.
- **Ambiente remoto (VM/nuvem) = último recurso**, só se o notebook deixar de dar conta até de editar/testar —
  não é o caso hoje. Só a compilação já está na nuvem (EAS).
