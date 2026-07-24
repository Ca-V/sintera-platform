# MOBILE-014 — Planejamento do Incremento 3 (Home Shell)

- **Status:** ✅ **APPROVED WITH MINOR REFINEMENTS** (fundadora, 2026-07-24) — refinamentos incorporados (definição de slot · princípio da Home · contrato de slots nomeados · independência dos slots · critérios de desempenho e de evolução · risco R5 · pontos de entrada só-navegação). Nenhuma implementação neste documento.
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

### 2.1 Definições e princípios (contrato arquitetural)

**Princípio da Home (permanente):**
> **A Home é uma composição. Nunca é proprietária de lógica de domínio.** A Home apenas **organiza** componentes;
> a **lógica pertence aos módulos de domínio.** Nenhuma consulta ao Supabase de domínio, nenhuma regra de
> negócio e nenhuma priorização vivem na Home — nem agora nem no futuro.

**Definição de _slot_:**
> **Slot** — região **estável** da Home destinada a receber um componente de domínio em incremento futuro,
> mantendo **contrato visual e estrutural**, **sem exigir alteração do layout** da Home.

**Independência dos slots:**
> Cada slot deve poder ser **implementado, removido ou evoluído independentemente** dos demais — sem
> dependências cruzadas e sem afetar o layout-base da Home.

## 3. Escopo

### 3.1 Incluído
- **Saudação ao usuário** a partir de dados da **sessão autenticada** (ex.: e-mail/nome do usuário).
- **Identidade visual DS-002** (cor, tipografia, gradientes, superfícies via tokens do DS).
- **Estrutura visual da Home**: layout, espaçamentos, hierarquia, safe-area.
- **Regiões reservadas** para futuros widgets (slots nomeados/documentados, ainda vazios), de modo que os
  próximos incrementos preencham sem redesenho.
- **Pontos de entrada** para as áreas principais — **apenas navegação**, reusando o `AppNavigator`/tabs do
  Incremento 2. **Restrição explícita (não virar um RegistrationHub disfarçado):** os pontos de entrada
  representam apenas elementos de **navegação para funcionalidades já existentes**, **sem qualquer decisão ou
  priorização baseada em regras de negócio** (não decidem "o que registrar", "qual fluxo abrir" nem "qual
  prioridade mostrar" — isso seria lógica de produto, fora de escopo).
- **Substituição do placeholder** atual da tab "Início" pela Home Shell (preservando o logout já existente —
  não é lógica nova).

### 3.2 Excluído (explicitamente fora de escopo — cada um é um incremento próprio)
`RegistrationHub` completo · Insights · Daily Score · Activity Feed · gráficos/WeeklyChart · MetricCard/RingCard ·
CycleTracker/composição corporal · exames · **qualquer chamada adicional ao Supabase para dados de domínio** ·
**agregações de múltiplos domínios** · qualquer regra de negócio.

### 3.3 Fora de decisão (não revisitar durante a implementação)
Widgets de dados · integrações de domínio · notificações · deep linking · analytics · animações complexas.

### 3.4 Contrato de slots (formalizado — nomes fixos, mesmo vazios)

Os slots são um **contrato arquitetural**: nomes estáveis definidos agora, independentemente de estarem
preenchidos. Cada slot respeita a definição de §2.1 (região estável, contrato visual/estrutural, sem exigir
redesenho) e a independência (§2.1).

| Slot | Incremento 3 | Conteúdo em incrementos futuros |
|------|-------------|--------------------------------|
| **Welcome** (Saudação) | ✅ preenchido — saudação com dados da sessão | permanece |
| **QuickActions** (Ações rápidas) | ✅ preenchido — **só navegação** para áreas existentes (§3.1) | pode evoluir, **sem** regras de negócio/priorização |
| **Summary** (Resumo) | ⬜ **reservado (vazio)** | Daily Score / métricas-chave |
| **Timeline** (Linha do tempo) | ⬜ **reservado (vazio)** | Activity Feed / itens recentes |
| **Insights** | ⬜ **reservado (vazio)** | Insights Panel |
| **Footer** (Rodapé) | ✅ preenchido — logout (existente) / versão | permanece |

Os slots reservados ficam **visualmente vazios** (ou com um marcador neutro), **sem** conteúdo de domínio. O
`RegistrationHub` (HUB-001) **não** ocupa nenhum destes slots no Incremento 3 — terá incremento próprio.

**Cuidado de implementação (fundadora):** cada slot é implementado como um **componente real** — mesmo os
reservados —, ainda que retornem apenas um estado vazio. A Home compõe **componentes nomeados**, não `View`s
anônimas:
```
<HomeShell>
  <WelcomeSlot />      <QuickActionsSlot />   <SummarySlot />
  <TimelineSlot />     <InsightsSlot />       <FooterSlot />
</HomeShell>
```
Isso preserva o contrato arquitetural e **reduz o retrabalho** quando os domínios forem adicionados (um
incremento futuro apenas preenche o corpo do slot correspondente).

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
7. **Desempenho / "realmente infraestrutura":** a Home Shell **renderiza usando exclusivamente dados locais da
   sessão autenticada** — **nenhuma requisição adicional de rede** deve ocorrer durante a renderização inicial
   da Home (verificável por inspeção de rede no `adb`/logcat).
8. **Independência dos slots:** cada slot pode ser implementado, removido ou evoluído **independentemente** dos
   demais (§2.1), sem afetar o layout-base nem os outros slots.
9. **Evolução (teste da qualidade da arquitetura):** a inclusão do **primeiro widget de domínio** em incremento
   futuro deve ocorrer **sem alteração estrutural** da Home Shell — ou seja, apenas preenchendo um slot já
   contratado. *(Critério de projeto, verificado no primeiro incremento de domínio que preencher um slot.)*
10. **Sem regressão** do Incremento 2: gate, navegação, logout e **restauração de sessão** permanecem íntegros.
11. **Build** nativo verde · **tsc(mobile)** verde · topologia íntegra.
12. **Auditoria arquitetural**: nenhum acesso direto ao SDK Supabase em `apps/mobile` (mantém a fronteira do Inc. 1); identidade DS-002 preservada.
13. **Relatório executivo** objetivo (funcionalidade · impactos · evidências · riscos).

## 6. Riscos

- **R1 — Scope creep para widgets de domínio.** Mitigado por §3.2/§3.3 explícitos; regiões reservadas ficam **vazias**.
- **R2 — Pontos de entrada acumularem lógica de negócio.** Devem ser **apenas navegação** (reusar `AppNavigator`); nenhuma consulta/estado de domínio.
- **R3 — Regiões reservadas mal generalizadas.** Devem ser genéricas o suficiente para acomodar widgets futuros (score, insights, gráficos etc.) **sem redesenhar** a Home; caso contrário, retrabalho nos próximos incrementos.
- **R4 — Regressão de auth/navegação.** Substituir o conteúdo da tab "Início" não pode afetar gate/logout/restauração de sessão (revalidar o fluxo homologado no Inc. 2).
- **R5 — Acoplamento visual.** Ajustes específicos para um widget futuro **modificarem o layout-base da Home**
  (risco comum em dashboards). Mitigação: os slots têm contrato visual/estrutural estável (§2.1/§3.4); um widget
  se adapta ao slot, **não** o slot ao widget. Alterar o layout-base para acomodar um widget exige ADR.

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
