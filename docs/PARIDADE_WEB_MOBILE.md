# Matriz de Paridade Web ↔ Mobile

> **Status:** vivo · **Origem:** decisão da fundadora (2026‑07‑24) · **Governa:** toda alteração na Web enquanto o Mobile está em construção.
> **Princípio‑raiz:** [ARCH‑002 — Mobile‑First · API‑First](./ARCH-002_MOBILE_FIRST_API_FIRST.md) · refinado pelo princípio de paridade abaixo.

## 1. Por que este documento existe

O **app móvel é o produto principal** (mais acessado). A Web permanece como **referência funcional** (valida comportamento, SSOT de UX), mas **não evolui de forma independente**. A regra‑mestra:

> **Toda alteração feita na Web deve REDUZIR — e não aumentar — o trabalho futuro do Mobile.**

Consequência operacional: **nenhuma alteração na Web pode ser considerada concluída sem um plano explícito de como será refletida no Mobile** (mesmo contrato de dados, mesma modelagem, UX da Web como referência da UX do Mobile). Esta matriz é o **checklist** que se consulta *antes* de mexer em qualquer módulo da Web.

### 1.1 Princípios de execução (fundadora, 2026-07-31)

- **"Web First, Contrato Primeiro, Mobile Depois"** — por incremento novo: definir/revisar o **contrato
  funcional** → ajustar o **contrato da API** se necessário → implementar/consolidar a **lógica compartilhada**
  → **validar a regra de negócio** → implementar a **Web** → implementar o **Mobile reusando os mesmos
  contratos** → **homologar ambas**. Mantém as plataformas sincronizadas e a lógica centralizada.
- **"Nenhuma funcionalidade exclusiva do Mobile"** — salvo necessidade de **dispositivo** (câmera, biometria,
  push, recursos nativos), toda função nova nasce como **capacidade de plataforma** (Web+Mobile), não como dois
  produtos distintos.

> **Nota de fase (honesta):** os incrementos da **Onda 1** são o **Mobile alcançando paridade** — a Web já tem
> essas funções, e ainda **não consome** o `@sintera/api-client` (dívida de paridade, [R-008](../RISK_REGISTER.md)).
> O "Web First" governa capacidades **net-new / pós-paridade**; enquanto a Web está congelada, o padrão prático é
> **contrato compartilhado + Mobile**, com a Web a alinhar ao descongelar.

## 2. Como usar (antes de alterar a Web)

Para o domínio que você vai tocar, responda com esta matriz em mãos:

1. **O Mobile já prevê este domínio?** (está no roadmap de incrementos?)
2. **A modelagem/contrato de dados será a mesma** que o Mobile vai consumir?
3. **A Fonte da Verdade** é única e compartilhada (não há duplicação por plataforma)?
4. **A UX da Web servirá de referência** direta à UX do Mobile?
5. **O esforço agora poupa trabalho** quando o Mobile chegar neste domínio?

Se **todas** = sim → a mudança é segura (tende a **Prioridade A/B**). Se **alguma** = não → **risco de divergência** → não fazer sem decisão estratégica.

### Classificação do trabalho

| Classe | Quando | Exemplos |
|---|---|---|
| **A — pode fazer agora** | Ativo compartilhado, risco ~zero de desalinhamento | Design System (recipes + primitivos RN), `@sintera/api-client`, tipos/contratos, correções de arquitetura que beneficiam ambas |
| **B — só com plano de sincronização** | Mudança na Web que o Mobile vai herdar; exige as 5 respostas = sim | FB‑011 (Central de Notificações camada 2) |
| **C — evitar** | Aumenta a distância entre as plataformas | Componentes exclusivos da Web, UX só‑desktop, exceções sem doc, comportamento sem contrato |

## 3. Legenda de status de paridade

| Símbolo | Significado |
|---|---|
| 🟢 **Pareado** | Web e Mobile consomem a mesma Fonte da Verdade com o mesmo contrato; tela Mobile entregue/aceita |
| 🟡 **Preparado** | Contrato/DS/api‑client prontos e compartilháveis; tela Mobile ainda não implementada (planejada) |
| 🟠 **A projetar** | Domínio existe na Web; Mobile ainda não tem contrato/tela; entra por incremento futuro |
| 🔵 **Estrutural** | Camada de navegação/shell já projeta o domínio (rótulo/aba), sem lógica de domínio |

> A coluna **Fonte da Verdade** aponta o **domínio dono do fato** ([ADR‑001](./ADR-001_PROJECAO_SEM_DUPLICACAO_SSOT.md): quem é dono edita; os demais projetam/referenciam, nunca duplicam). É o mesmo dado nas duas plataformas — por construção, não por sincronização manual.

## 4. Matriz por grupo da taxonomia SSOT

> A navegação do Mobile é uma **projeção** da taxonomia única da Web (`Sidebar` = SSOT; ver `apps/mobile/src/presentation/navigation/ssotTabs.ts`). Os grupos abaixo são exatamente os 5 destinos + Painel Inicial.

### Início
| Domínio | Web (rota) | Mobile | Fonte da Verdade | Paridade |
|---|---|---|---|---|
| Painel Inicial | `/dashboard` | Aba **Início** · Home shell (slots) — Inc 3 (impl., homolog. pendente) | Composição de projeções (ADR‑018) — não é dono de fato | 🔵→🟡 |

### Acompanhamento
| Domínio | Web (rota) | Mobile | Fonte da Verdade | Paridade |
|---|---|---|---|---|
| Agenda | `/dashboard/agenda` | Aba **Acompanhamento** (rótulo) | Evento Assistencial (`health_events`) | 🟠 |
| Histórico de Saúde | `/dashboard/historico` | idem | Evento Assistencial (`health_events`) | 🟠 |
| Histórico de Exames | `/dashboard/exams` (timeline) | idem | Domínio Exames | 🟠 |
| Composição Corporal | `/dashboard/medidas` | idem | `body_metrics` (com source/rastreabilidade) | 🟠 |
| Monitoramento | `/dashboard/sinais-vitais` | idem | Observação (HIP‑007, FHIR Observation) | 🟠 |

### Documentos
| Domínio | Web (rota) | Mobile | Fonte da Verdade | Paridade |
|---|---|---|---|---|
| Exames | `/dashboard/exams` | Aba **Documentos** (rótulo) | Domínio Exames + Capture Hub / CEF | 🟠 |

### Minha Saúde
| Domínio | Web (rota) | Mobile | Fonte da Verdade | Paridade |
|---|---|---|---|---|
| Condições de Saúde | `/dashboard/condicoes` | Aba **Minha Saúde** (rótulo) | Domínio Condições | 🟠 |
| Medicamentos | `/dashboard/medicamentos` | idem | Domínio Medicamentos | 🟠 |
| Suplementos | `/dashboard/suplementos` | idem | Domínio Suplementos | 🟠 |
| Recursos de Saúde | `/dashboard/recursos` | idem | Domínio Recursos | 🟠 |
| Hábitos | `/dashboard/habitos` | idem | Domínio Hábitos | 🟠 |
| Ciclo e Contracepção | `/dashboard/ciclo` | idem | Domínio Ciclo (Saúde da Mulher) | 🟠 |

### Mais (overflow: Organização + Configurações)
| Domínio | Web (rota) | Mobile | Fonte da Verdade | Paridade |
|---|---|---|---|---|
| Despesas | `/dashboard/gastos` | Aba **Mais** (rótulo) | Projeção financeira sobre os fatos (FIN‑001) | 🟠 |
| Relatórios | `/dashboard/relatorios` | idem | Projeção sobre domínios (espelha o domínio) | 🟠 |
| Configurações | `/dashboard/configuracoes` | idem | Preferências do usuário (`profiles.pref_*`) | 🟠 |
| **Perfil** | `/dashboard/profile` | **Inc 4 (planejado, MOBILE‑016)** — DS Switch/Avatar prontos | `profiles` (SSOT do Perfil) | 🟡 |

## 5. Ativos compartilhados (a base da paridade)

Estes não têm "versão Web" e "versão Mobile" — são **um só ativo** consumido pelas duas plataformas. Evoluí‑los é sempre **Prioridade A**.

| Ativo | Papel | Estado |
|---|---|---|
| **Design System** (`@sintera/design-system`) | Recipes headless (`recipe(theme,props)→VisualSpec`) — identidade única | Congelado (DS‑002); evolui por lacuna motivada pelo produto |
| Primitivos RN (`apps/mobile/.../primitives`) | Adaptadores finos que consomem as recipes | Box · Text · Button · Input · **Switch** · **Avatar** |
| `@sintera/api-client` | Acesso a dados com contrato único | Compartilhado |
| `@sintera/types` · `@sintera/validation` | Contratos e regras de validação | Compartilhados |

**Switch + Avatar** (branch `feat/ds-switch-avatar`) foram os primeiros ativos entregues sob este princípio: nasceram compartilhados, desbloqueiam o Inc 4 (Perfil) e não abriram nenhuma dívida de sincronização.

## 6. Estado do Mobile (referência para a coluna "Mobile")

| Incremento | Domínio | Estado |
|---|---|---|
| Inc 1 | Autenticação | ✅ Aceito (`mobile-inc1-accepted`) |
| Inc 2 | Navegação (projeção SSOT) | ✅ Aceito (`mobile-inc2-accepted`) |
| Inc 3 | Home Shell (slots) | 🔧 Implementado — homologação pendente (RAM 16GB) |
| Inc 4 | Perfil | 📋 Planejado (MOBILE‑016); DS Switch/Avatar já prontos |
| Inc 5+ | Demais domínios | 📋 Roadmap (MOBILE‑015) |

## 7. Registro de avaliações (o gate em uso)

> A Matriz **não é só documento — é gate de decisão.** Nenhuma evolução relevante da Web começa sem passar por aqui. Cada avaliação fica registrada com data, respostas objetivas e veredito.

### FB‑011 — Central de Notificações, Camada 2 (`event_key`) — avaliado 2026‑07‑27

| Pergunta | Resposta | Evidência |
|---|---|---|
| **1. O domínio "Notificações" já existe no roadmap do Mobile?** | ❌ **Não** | MOBILE‑015 tem 11 incrementos (Auth→…→Insights); nenhum é Notificações. A Central só chegaria embutida em "Configurações" (rótulo da aba *Mais*), sem incremento dedicado. |
| **2. O modelo de dados será exatamente o mesmo?** | ⚠️ **Parcial / ambíguo** | O contrato de **preferências** (categoria × canal → `event_key`) está bem definido e a lib de resolução `src/lib/notifications/preferences.ts` é **pura/determinística** (100% reutilizável). Porém os campos "status de leitura · timestamps · dedup" **não** são a Camada 2: *dedup* vive no worker de despacho (marca enviado), e *status de leitura* é o **NOV‑001** (`content_seen`) — **outro SSOT**. Há ambiguidade de escopo (preferências × inbox) a resolver **antes** de congelar contrato. |
| **3. A UX é portável?** | ✅ **Sim (comportamento/regras/estados/contrato)** | A lib pura é compartilhável; só o layout difere (matriz categoria×canal no desktop × lista no mobile). O que precisa ser compartilhado — comportamento, regras, estados, contratos — é portável. |
| **4. Há dependência ainda não pronta?** | ❌ **Sim, há** | Camada 2 = *reescrita da resolução do worker de despacho VIVO* (`api/agenda/reminders`, pg_cron+pg_net) + pendência aberta "generalizar o worker além da Agenda". O próprio NOTIF‑001 sequenciou a Camada 2 como **"pós‑estabilização"** para não desestabilizar o envio real. WhatsApp em produção depende de pré‑requisitos de negócio (fundadora). |

**Veredito:** 🔴 **reprovado no gate por ora** (Q1 e Q4 negativas; Q2 com ambiguidade de escopo). Classe **B** — **manter no roadmap**, **não implementar** nestes dois dias; aguardar a homologação do Inc 3.

**Condição para reabrir:** resolver a ambiguidade de escopo da Q2 (preferências × inbox/read‑status) e **congelar o contrato** (Etapa 1) — categoria · `event_key` · canal · prioridade · fallback do worker · critérios de aceite · estratégia de portabilidade — **antes** de qualquer código (Etapa 2). Assim Web e Mobile implementam o **mesmo contrato**, e o Mobile não "copia a Web".

**Ação de paridade recomendada (quando FB‑011 for feito, não agora):** mover a lib pura de resolução (`preferences.ts`) para um pacote compartilhado (`@sintera/*`) para o Mobile reusar sem cópia.

## 8. Manutenção deste documento

- Atualizar a coluna **Mobile** a cada incremento aceito (🟠→🟡→🟢).
- Ao **planejar** uma alteração na Web, registrar aqui a resposta às 5 perguntas da §2 e a classe (A/B/C).
- Quando um domínio ficar **🟢 Pareado**, registrar a tag/aceite do incremento correspondente.
- Divergências detectadas (Web mudou sem reflexo no Mobile) entram como **dívida de paridade** e são tratadas antes de novas alterações no mesmo domínio.

---
*Referências: [principio_paridade_web_mobile] (memória) · ARCH‑002 · ADR‑001 (SSOT) · ADR‑011 (recipes) · ADR‑018 (agregação por slots) · MOBILE‑015 (roadmap) · MOBILE‑016 (Inc 4).*
