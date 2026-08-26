# HIP-014 — Monitoramento: sinais vitais, atividade física e prioridade de fonte

**Status:** Approved · **Versão:** 1.0 (2026-08-25) · Sob [[ADR-000]] · [[HIP-001]] · [[HIP-007]] · [[HIP-009]].
**Decisões da fundadora em 25/08/2026**, confirmadas: módulo **Monitoramento** único nas duas pontas ·
entidade **`activity_sessions`** · registro manual **mantido e reordenado** · **Health Connect primeiro**.

> **Por que este documento existe.** A camada de conectores já estava construída, testada e vendor-neutral desde
> a V2 — e mesmo assim os wearables não podiam ser integrados. Faltavam três coisas que nenhum documento anterior
> cobria: onde a atividade física é armazenada, o que acontece quando duas fontes discordam, e o fato de a camada
> inteira morar onde o aplicativo não alcança. Este documento fecha as três.

---

## 1. As três origens de um dado observacional

Do ponto de vista da pessoa são três; tecnicamente são **duas**.

| Origem | Como chega | Exemplo |
|---|---|---|
| **Manual** | a pessoa digita | pressão do aparelho de braço em casa |
| **Aparelho** | o app do fabricante escreve no repositório do sistema | glicosímetro conectado |
| **Wearable / app** | idem | Strava, Oura, Garmin |

As duas últimas percorrem **o mesmo caminho técnico**: o app do fabricante escreve no Health Connect (ou no Apple
Health), e a SINTERA lê dali. Isso significa **um conector, não um por aparelho** — e é a razão principal da
estratégia da §5.

`body_metrics.source` é `NOT NULL` desde a origem: a distinção já está modelada, não precisa de coluna nova.

---

## 2. O registro manual permanece — reordenado, não removido

A dúvida da fundadora (25/08) foi legítima: *ninguém vai digitar sinal vital todo dia*. A verificação mostrou que
a resposta não se divide entre manual e automático, e sim **por métrica**:

| Sinal vital | Wearable cobre | Aparelho doméstico que não fala |
|---|---|---|
| **Pressão arterial** | quase nunca | **a esmagadora maioria** |
| **Glicemia** | só sensor contínuo (caro, minoritário no país) | **glicosímetro de ponta de dedo** |
| Temperatura | alguns anéis | termômetro comum |
| Saturação | sim, relógios | oxímetro de dedo |
| Frequência cardíaca | **sim, continuamente** | — |

**Frequência cardíaca**: o campo manual é peso morto — o relógio mede melhor e sem esforço.
**Pressão e glicemia**: o oposto. O diário de pressão é instrução médica literal ("meça duas vezes por dia por
duas semanas e me traga"); hipertensão é a crônica mais prevalente do país. Remover isso quebraria a continuidade
exatamente onde ela mais importa.

**Decisão:** pressão e glicemia em destaque; frequência cardíaca e saturação recuadas. Isso também resolve a
divergência já registrada entre o card expansivo da Web e a lista aberta do Mobile.

**Terceira origem, hoje não ligada:** todo registro de consulta traz pressão, peso e altura. Isso não é a pessoa
digitando — é a plataforma lendo (`autofillFrom`, escrito e testado, sem consumidor). Alimenta a mesma série sem
pedir nada a ninguém, e é o item **D** de [[divergencias_paridade_pendentes]].

> Referência externa: a prioridade padrão do Apple HealthKit coloca a **entrada manual em primeiro lugar**, acima
> do próprio hardware da Apple. Quem digita, digitou de propósito.

---

## 3. Modelo de dados — três formas de fato, não uma

```
medição pontual      → wearable_readings   (bruto por conector, imutável, com proveniência)
                     → body_metrics        (manual e documento)
sessão de atividade  → activity_sessions   ← NOVO
meta declarada       → life_habits         ("correr 3x por semana")
```

**Por que `activity_sessions` é entidade nova e não acomodação.** `wearable_readings` guarda *um número*
(`value numeric`). Uma corrida tem início, fim, tipo, distância, desnível e ritmo — não é escalar. Apple e Google
chegaram à mesma conclusão independentemente: `HKWorkout` e `ExerciseSessionRecord` são **tipos distintos** de
medida pontual, em ambas as plataformas.

Isto é o caso previsto pela ressalva da fundadora ao princípio de acomodar-antes-de-criar
([[principio_estabilidade_arquitetural]]): *"muitas vezes uma coisa que é estrutural precisa ser criada para que
seja base de outras derivadas"*. Forçar sessão em `wearable_readings` empurraria o essencial para dentro de `raw`
jsonb — e o que mora em jsonb não é consultável, não é comparável e não sustenta série longitudinal.

**O que `life_habits` NÃO é.** `life_habits.atividade_fisica` é a **intenção declarada**; a sessão do Strava é o
**fato observado**. São coisas diferentes, e ligá-las é o valor: *"você declarou 3x por semana; neste mês foram
2"*. Nenhuma das duas tabelas sozinha entrega acompanhamento de hábito.

**A visão longitudinal é projeção sobre as quatro, nunca uma quinta tabela** ([[adr_001_projecao_ssot]]), e a
origem fica visível em toda ela.

---

## 4. Prioridade de fonte — e onde a SINTERA diverge do setor

Apple e Google resolveram o conflito entre fontes da mesma forma, independentemente: uma **lista de prioridade
por tipo de registro**, ajustável pela pessoa. Quem mede melhor sono não é quem mede melhor passos.

A SINTERA adota o mecanismo e **recusa a consequência**. Apple e Google usam a prioridade para *escolher um
valor* e exibir só ele. Escolher em silêncio entre duas medições divergentes **é interpretar** — vedado por
[[ADR-000]] e pela RDC 657.

> **Regra:** a prioridade define o que aparece **em primeiro plano**, nunca o que existe. As outras fontes
> permanecem visíveis, e quando divergem a plataforma **diz que divergem**, sem eleger vencedor.

É a mesma disciplina já aplicada a indicadores com unidades incompatíveis: agrupar, explicar, nunca esconder.

**Nunca fundir séries de fontes diferentes.** Fusão é irreversível; separação preservada é sempre reversível.

---

## 5. Health Connect primeiro — e só ele, para validar a categoria

RC1 é Android. Numa integração só chegam: passos, frequência cardíaca, sono, **pressão arterial, glicemia**,
saturação, temperatura, peso — **e `ExerciseSession`** com tipo, duração e distância. Cobre o catálogo inteiro de
sinais vitais **mais** a atividade física.

E Strava, Oura e Garmin chegam **por dentro dele**, sem contrato separado, sem aprovação de parceria e sem
dependência de intermediário. Apple Health entra na Trilha B reusando a mesma abstração.

**Agregadores (Terra, ROOK, Spike, Junction) ficam para depois**, e só se uma lacuna concreta se provar real. O
`ConnectorRegistry` já os acomoda como adaptador — não é reescrita. O mercado está consolidando; adiar a escolha
de fornecedor é vantagem, não atraso.

### Cobertura real, verificada — não presumida

| Fonte | Pelo Health Connect |
|---|---|
| Strava | **só** tempo, distância e calorias de atividades com GPS — não FC, não sono |
| Garmin | entrega desde junho/2025; **não aceita** dados de volta (indiferente: só lemos) |
| Oura | Gen2/Gen3+ com assinatura ativa, Android |

**Lacuna previsível:** ritmo, splits e zonas de FC — "desempenho físico" de verdade — exigiriam a API direta do
Strava, **que proíbe IA e aprendizado de máquina sobre os dados dela**. Saber disso antes de prometer desempenho.

---

## 6. Nuvem sem servidor próprio — consequência no desenho

Princípio reforçado pela fundadora em 25/08: banco, código e estrutura vivem **em nuvem** (GitHub, Supabase, EAS),
sem armazenamento em servidor próprio. Isso tem uma consequência específica aqui, e ela não é óbvia:

**o Health Connect lê no aparelho, e o aparelho não é a nuvem.**

> **Regra:** o aparelho é **conduto, nunca armazenamento**. O que se lê do Health Connect é gravado em
> `wearable_readings` na mesma sincronização. Armazenamento local existe apenas como buffer transitório de
> offline — nunca como fonte da verdade, nunca como o único lugar onde um dado esteve.

Sem essa regra, um dado observacional viveria só no telefone: perdido na troca de aparelho, invisível na Web,
fora de backup e fora da rastreabilidade — o oposto de tudo o que este documento sustenta.

---

## 7. Fronteira de pacote — por que a camada mudou de lugar

Executado em 25/08 (commits `5f492e71`, `5d2d9196`).

Os 10 módulos puros da camada de conectores viviam em `src/lib/connectors/`, **onde o Mobile não alcança**. Não
era dívida estética: como o Health Connect roda no aparelho, era impossível sincronizar wearables no Android com
o código onde estava. É o padrão [[padrao_especificado_nunca_ligado]] na sua forma bloqueante.

**Migrados** para `packages/core/src/domain/connectors/`: `connector` · `oauth` · `registry` · `persistence` ·
`orchestrator` · `connections` · `syncService` · `webhook` · `mock` (todos já puros, com IO injetada).

**Permanecem no servidor da Web, deliberadamente:**

| Arquivo | Motivo |
|---|---|
| `supabase-persist.ts`, `supabase-connections.ts` | usam cliente **service-role** — escrita privilegiada não entra em pacote empacotado no aplicativo |
| `runtime.server.ts` | wiring Next.js, env e segredos |
| `withings/` | adaptador de fornecedor; o Mobile usa Health Connect |

Guardado por `tests/contracts/conector-fronteira.ARCH.test.ts`, que verifica os dois invariantes — e que foi
verificado **falhando** quando violado, não apenas passando.

---

## 8. Defeitos a corrigir antes de ligar o conector

Os dois primeiros bloqueiam o caso de uso aprovado na §2 e não são contornáveis na interface.

**8.1 · `body_metrics.measured_on` é `date`, sem hora.**
Um diário de pressão de manhã e à noite gera duas linhas na mesma data, indistinguíveis e sem ordem. Precisa de
`measured_at timestamptz`, com `measured_on` preservado por compatibilidade.

**8.2 · A projeção do CONECTOR colapsa por dia — e só ela.**

Correção de um relato anterior meu, que confundia dois caminhos diferentes:

- **Registro manual** (o diário de pressão): grava direto em `body_metrics`, uma linha por medição. As duas
  leituras do dia **sempre existiram e sempre apareceram** — o que faltava era a hora para distingui-las e
  ordená-las. É o §8.1, e está resolvido.
- **Dado de conector**: passa por `projectBodyMetricPoints`, que colapsa por `(métrica, dia)` com "último do dia
  vence". Aí sim há descarte na exibição — o bruto sobrevive em `wearable_readings`, o ponto projetado não.

O ponto projetado agora **carrega o instante real** da leitura (`measured_at`), em vez de perdê-lo — o que o torna
ordenável junto com as medições manuais, na mesma série. **Mas o colapso por dia continua**, e é decisão em
aberto: soltá-lo para todo sinal vital traria uma frequência cardíaca de pulseira como milhares de pontos por dia.
A granularidade por métrica do lado do conector depende da prioridade de fonte (§4) e é resolvida junto com ela.

**8.3 · Não existe `activity_sessions`.** §3.

**8.4 · ~~"Monitoramento" só existe no Mobile.~~ — RETRATADO em 25/08.**

Eu afirmei que a Web espalhava por `sinais-vitais`, `medidas`, `habitos` e `conexoes` o que o Mobile reunia numa
tela só, e propus unificar. **A premissa estava errada, e a proposta teria piorado a arquitetura de informação.**

O erro: procurei uma rota chamada `monitoramento` na Web, não achei, e concluí que o módulo não existia. Mas
`Monitoramento` é o **rótulo** da rota `/dashboard/sinais-vitais` na taxonomia SSOT (`Sidebar.tsx`), e o Mobile
projeta essa mesma taxonomia em `MinhaSaudeMenuScreen`. Confundi caminho de rota com nome de domínio.

A taxonomia real, **idêntica nas duas pontas**, em Minha Saúde → Saúde:

| | Web | Mobile |
|---|---|---|
| Condições de Saúde | `/dashboard/condicoes` | `Conditions` |
| Composição Corporal | `/dashboard/medidas` | `Composicao` |
| Ciclo e Contracepção | `/dashboard/ciclo` | `Ciclo` |
| **Monitoramento** | `/dashboard/sinais-vitais` | `Monitoramento` |
| Hábitos | `/dashboard/habitos` | `Habits` |

Composição Corporal é item **separado** de Monitoramento — nos dois lados, por decisão de ADR-021/MOBILE-036
(modelo mental do usuário). Fundi-los seria **mudar uma IA aprovada**, não corrigir divergência.

**A divergência real era outra**, e essa existia: a tela da Web escrevia à mão 12 textos que o core já tinha e o
Mobile já lia — título, subtítulo, Adicionar/Fechar/Salvar, os rótulos dos campos, o convite de Conexões e o vazio.
É exatamente a causa do subtítulo divergente que a fundadora pegou na homologação. Corrigido; a Web agora lê tudo
de `SCREEN_COPY.monitoramento`.

**O que Monitoramento ainda não faz** — e é o trabalho de verdade: mostrar dado de **conector** e **sessão de
atividade**. Hoje exibe só sinal vital manual. Isso é acréscimo a uma tela bem localizada, não reestruturação.

---

## 9. Sequência

| # | Etapa | Estado |
|---|---|---|
| 1 | Conector migra para `packages/core` | **feito** (§7) |
| 2 | `body_metrics.measured_at` (migração 148) | **aplicado** em produção, 25/08 |
| 3 | `activity_sessions` + RLS (migração 149) | **aplicado** em produção, 25/08 |
| 4 | Hora da medição de ponta a ponta — core · api-client · Web · Mobile | **feito** |
| 5 | Paridade de texto em Monitoramento — a Web passou a ler o `SCREEN_COPY` (§8.4) | **feito** |
| 5b | Procedência visível + seção de Atividade física nas duas pontas | **feito** |
| 6 | Conector Health Connect (Android) | a fazer |
| 7 | Prioridade de fonte por métrica, ajustável (§4) — resolve junto a granularidade do conector (§8.2) | a fazer |
| 8 | Apple Health (Trilha B) | depois do iOS |

**Etapa 4, o que entrou:** `requiresTimeOfDay` · `measurementInstant` · `hasTimeOfDay` ·
`compareMeasurementsDesc` no core (18 testes) · `measured_at` no `BodyMetricDTO`/`Input` e na ordenação do
`api-client` · campo de hora nas duas telas, com o texto vindo do `SCREEN_COPY` para que digam o mesmo · primitiva
`TimePicker` no Mobile (o DS ganhou a capacidade antes da tela consumi-la) · o ponto projetado do conector passou
a preservar o instante.

A hora é **opcional** de propósito: quem mede uma vez por dia não é obstruído por um campo que não usa. Meia-noite
UTC exata permanece sendo o marcador de "hora não registrada", e `hasTimeOfDay` é quem lê esse marcador — no core,
para que Web e Mobile não decidam diferente.

**Etapa 5b, o que entrou:** `bodySourceLabel` ganhou consumidor — a **procedência aparece** em toda medição, e
existia no core desde o BOD-001 sem ninguém usá-la · `measurementMeta` no core compõe *quando · de onde ·
observação*, com a ordem e o separador fora das telas · seção **Atividade física** irmã de Sinais vitais nas duas
pontas, com registro manual · `ACTIVITY_TYPES` em lista aberta · conversão de unidade no core
(`durationSecondsFromMinutes`, `distanceMetersFromKm`), que estava duplicada nas duas telas · 14 testes de
api-client sobre a linha que vai ao banco.

> **Um defeito que só o teste achou.** A conversão devolvia **zero** para texto sem número: limpar `"abc"` deixa
> string vazia, e `Number('')` é `0`. Uma musculação com lixo no campo distância gravaria "0 km" — afirmando que
> alguém mediu e deu zero. Falso, e sobre saúde. A regra hoje distingue campo **em branco** (`null`) de zero
> **digitado** (`0`, porque a pessoa afirmou).

**Não verificado:** o fluxo rodando no aparelho e no navegador. Não há toolchain RN no ambiente de
desenvolvimento; depende de homologação.

### Aplicação em produção — 25/08/2026

Autorizada explicitamente pela fundadora ([[protocolo_autonomo_execucao_gates]], Gate C). Versões atribuídas pelo
Supabase: **`20260825203944`** (148) e **`20260825204009`** (149). Os arquivos locais foram renomeados para essas
versões — o histórico registra o que de fato aconteceu, não o que se pretendia.

Verificado após aplicar, não presumido:

| Verificação | Resultado |
|---|---|
| `body_metrics.measured_at` existe | sim |
| linhas sem `measured_at` após backfill | **0** (7 de 7 preenchidas) |
| `activity_sessions` existe | sim |
| RLS habilitado | **true** |
| políticas | **4** — `select`/`insert`/`delete` com `auth.uid() = user_id`; `update` com `using` **e** `with check` (impede transferir registro para outra pessoa) |
| índices | 5 (chave primária · 2 únicos de idempotência · 2 de leitura) |

**Atenção para a etapa 4:** a coluna existe, mas `projectBodyMetricPoints` continua colapsando por
`(métrica, dia)` com "último do dia vence". Enquanto essa projeção não acompanhar a nova granularidade, **a
segunda medição do dia continua sumindo da exibição** — o banco já guarda, a tela ainda não mostra.
