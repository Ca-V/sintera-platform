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

**8.2 · A projeção descarta leituras: "último do dia vence".**
`projectBodyMetricPoints` colapsa por `(métrica, dia)` — a pressão da manhã é apagada pela da noite na exibição.
O bruto sobrevive em `wearable_readings`, mas a série que a pessoa **vê** perde metade das medições justamente no
caso em que cada medição importa. A granularidade da projeção precisa acompanhar a da métrica.

**8.3 · Não existe `activity_sessions`.** §3.

**8.4 · "Monitoramento" só existe no Mobile.** Na Web o mesmo conteúdo está espalhado por `sinais-vitais`,
`medidas`, `habitos` e `conexoes`. **Decisão da fundadora: módulo único nas duas pontas**, contendo sinais vitais,
medidas, atividade física, sono e o banner de Conexões.

---

## 9. Sequência

| # | Etapa | Estado |
|---|---|---|
| 1 | Conector migra para `packages/core` | **feito** (§7) |
| 2 | `body_metrics.measured_at` (migração 148) | **aplicado** em produção, 25/08 |
| 3 | `activity_sessions` + RLS (migração 149) | **aplicado** em produção, 25/08 |
| 4 | Granularidade da projeção — parar de descartar leituras (§8.2) | a fazer |
| 5 | Monitoramento como módulo único nas duas pontas (§8.4) | a fazer |
| 6 | Conector Health Connect (Android) | a fazer |
| 7 | Prioridade de fonte por métrica, ajustável (§4) | a fazer |
| 8 | Apple Health (Trilha B) | depois do iOS |

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
