# MOBILE-014 — Planejamento do Incremento 3 (Home Shell)

- **Status:** **PLANEJAMENTO** — aguardando revisão/aprovação. Nenhuma implementação neste documento.
- **Onda:** 1 · **Incremento:** 3 (Home)
- **Pré-condição:** Incremento 2 [ACCEPTED](MOBILE-013_INCREMENTO2_ACEITE.md). Branch de implementação nasce de `mobile-inc2-accepted` (`7f40e42`).
- **Relaciona-se com:** [MOBILE-001](MOBILE-001_PLANO_EXECUTIVO_RN.md) (ordem fixa) · [MOBILE-009](MOBILE-009_PLANEJAMENTO_INCREMENTO2_NAVEGACAO.md) (padrão de planejamento/execução) · [ADR-010](adr/ADR-010_IDENTIDADE_VISUAL_UNICA.md) (identidade) · [ADR-011](adr/ADR-011_ARQUITETURA_COMPONENTES_CROSSPLATFORM.md) · `src/app/dashboard/page.tsx` (Painel Inicial da Web, referência)

## 1. Objetivo

Entregar a **estrutura permanente da tela inicial (Home Shell)** do app móvel — **não** um dashboard funcional.
A Home passa a ser a **"casca" definitiva** da aplicação: layout, identidade e regiões reservadas sobre os
quais os **incrementos futuros** apenas **preencherão** widgets e funcionalidades, **sem redesenhar** a Home nem
alterar a navegação/arquitetura já homologadas no Incremento 2.

Princípio norteador: **um incremento = uma capacidade.** Aqui a capacidade é a **infraestrutura da Home**,
explicitamente **sem lógica de domínio**.

## 2. Decisões arquiteturais (fundadora, 2026-07-24)

| # | Decisão | Valor |
|---|---------|-------|
| D1 | Natureza do incremento | **Home Shell** — infraestrutura de tela, **sem lógica de domínio** |
| D2 | Dados permitidos | Apenas os já suportados pela sessão autenticada (ex.: identificação do usuário) |
| D3 | Componentes de domínio | **Fora de escopo** — cada um terá seu próprio incremento |
| D4 | Identidade | **DS-002** (tokens/tipografia compartilhados) |
| D5 | Este documento | Planejamento apenas — nenhuma linha de código |

> **Princípio de evolução:** a Home é projetada para que **cada domínio adicione seus widgets futuramente**
> nas regiões reservadas, **sem redesenhar** a Home. Reestruturações da Home exigem ADR próprio.

## 3. Escopo

### 3.1 Incluído
- **Saudação ao usuário** a partir de dados da **sessão autenticada** (ex.: e-mail/nome do usuário).
- **Identidade visual DS-002** (cor, tipografia, gradientes, superfícies via tokens do DS).
- **Estrutura visual da Home**: layout, espaçamentos, hierarquia, safe-area.
- **Regiões reservadas** para futuros widgets (slots nomeados/documentados, ainda vazios), de modo que os
  próximos incrementos preencham sem redesenho.
- **Pontos de entrada** para as áreas principais — desde que **não introduzam lógica de negócio nova**
  (apenas navegação, reusando o `AppNavigator`/tabs do Incremento 2).
- **Substituição do placeholder** atual da tab "Início" pela Home Shell (preservando o logout já existente —
  não é lógica nova).

### 3.2 Excluído (explicitamente fora de escopo — cada um é um incremento próprio)
`RegistrationHub` completo · Insights · Daily Score · Activity Feed · gráficos/WeeklyChart · MetricCard/RingCard ·
CycleTracker/composição corporal · exames · **qualquer chamada adicional ao Supabase para dados de domínio** ·
**agregações de múltiplos domínios** · qualquer regra de negócio.

### 3.3 Fora de decisão (não revisitar durante a implementação)
Widgets de dados · integrações de domínio · notificações · deep linking · analytics · animações complexas.

## 4. Projeção da referência Web (sem copiar a lógica)

A Web (`Painel Inicial`) é um dashboard **orientado a dados** que agrega muitos domínios. A Home Shell mobile
**projeta a estrutura conceitual** (uma tela inicial acolhedora, com identidade e pontos de entrada), **sem**
trazer os widgets de dados. Correspondência **conceitual, não literal** (mesma lógica do Incremento 2, D7 do
MOBILE-009): a arquitetura de informação é única; a Home mobile começa como casca e cresce por domínio.

## 5. Critérios de aceite

1. **Home Shell substitui o placeholder** da tab "Início", com identidade **DS-002**.
2. **Saudação** usando dados da sessão (sem novas chamadas de dados de domínio).
3. **Estrutura visual** (layout/espaçamento/hierarquia/safe-area) consistente com o DS.
4. **Regiões reservadas** para widgets futuros presentes e **documentadas** (slots vazios, sem conteúdo de domínio).
5. **Pontos de entrada** navegam corretamente para as áreas principais **sem lógica de negócio nova** (só navegação).
6. **Sem lógica de domínio** na Home: **zero** regra de negócio, **zero** chamada ao Supabase para dados de domínio (auditoria).
7. **Sem regressão** do Incremento 2: gate, navegação, logout e **restauração de sessão** permanecem íntegros.
8. **Build** nativo verde · **tsc(mobile)** verde · topologia íntegra.
9. **Auditoria arquitetural**: nenhum acesso direto ao SDK Supabase em `apps/mobile` (mantém a fronteira do Inc. 1); identidade DS-002 preservada.
10. **Relatório executivo** objetivo (funcionalidade · impactos · evidências · riscos).

## 6. Riscos

- **R1 — Scope creep para widgets de domínio.** Mitigado por §3.2/§3.3 explícitos; regiões reservadas ficam **vazias**.
- **R2 — Pontos de entrada acumularem lógica de negócio.** Devem ser **apenas navegação** (reusar `AppNavigator`); nenhuma consulta/estado de domínio.
- **R3 — Regiões reservadas mal generalizadas.** Devem ser genéricas o suficiente para acomodar widgets futuros (score, insights, gráficos etc.) **sem redesenhar** a Home; caso contrário, retrabalho nos próximos incrementos.
- **R4 — Regressão de auth/navegação.** Substituir o conteúdo da tab "Início" não pode afetar gate/logout/restauração de sessão (revalidar o fluxo homologado no Inc. 2).

## 7. Dependências para incrementos futuros

- Os **incrementos de domínio seguintes** (exames, composição corporal, ciclo, agenda, insights, score…)
  **preencherão as regiões reservadas** com seus widgets, consumindo dados via `@sintera/api-client`
  (mantendo a fronteira: nenhum Supabase direto em `apps/mobile`).
- O **RegistrationHub** (HUB-001) terá incremento próprio; a Home Shell **não** o antecipa.
- A Home Shell **não deve precisar de redesenho** para receber esses widgets — é o critério de sucesso
  arquitetural deste incremento.

## 8. Governança e sequência (execução PÓS-aprovação)

Mesma disciplina do MOBILE-010/Incremento 2: **uma mudança estrutural por commit**, cada uma verificável e
reversível. Branch de implementação `feat/mobile-inc3-home` a partir de `mobile-inc2-accepted`. Sequência a
detalhar na aprovação (ex.: estrutura da Home → saudação/sessão → regiões reservadas → pontos de entrada →
substituição do placeholder → validação). Integração ao ramo principal permanece condicionada ao fim da Onda 1.
