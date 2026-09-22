# VAL-001 — Plano de Validação

> **O que este documento é.** Como se mede se o negócio funciona, e com que números se decide escalar ou parar.
> Fixa as coortes, os eventos, os limites do portão e o tamanho de amostra **antes** do lançamento — porque
> limite fixado depois do resultado é limite escolhido para caber no resultado.
>
> **Deriva de:** Mini Business Plan v1.0 §41 a §46. **Consome:** CARE-003 · BILLING-003.

---

## 1. O achado que muda o desenho, antes de qualquer outra coisa

**A comparação entre coortes não vai produzir significância estatística no primeiro ano, e é importante saber
disso antes de desenhá-la.**

Para distinguir um cancelamento mensal de 8% de um de 5% com poder de 80%, seriam necessários cerca de
**1.000 usuários em cada braço**. A projeção do plano de negócios chega a algo como 900 pagantes **no total**
no mês 24. Os braços teriam dezenas de pessoas, não milhares.

Mesmo a medida mais simples — o cancelamento agregado, sem braços — tem limite:

| Pagantes na medição | Precisão do cancelamento (95%) |
|---|---|
| ~240 | ± 3 pontos percentuais |
| ~540 | ± 2 pontos percentuais |
| ~2.200 | ± 1 ponto percentual |

Com 250 pagantes e cancelamento medido em 6%, o valor verdadeiro está entre **3% e 9%**. O portão do plano diz
"seguir se ≤ 6%" — e nessa amostra o ponto medido não distingue aprovação de reprovação.

**Consequências que este documento assume:**

1. O portão decide pelo **intervalo**, não pelo ponto — §5.
2. A comparação A/B/C serve para **direção e magnitude**, nunca para afirmar significância. Quem escrever
   "a coorte B reteve mais" sem o intervalo estará afirmando o que o dado não sustenta.
3. O peso da decisão migra para indicadores com **muitos eventos por pessoa** — frequência de uso, documentos
   acrescentados, retorno semanal — em vez de um único evento raro por pessoa, que é o cancelamento.

---

## 2. O segundo achado: as coortes não são sorteáveis

O plano §42 propõe três coortes:

| Coorte | Composição |
|---|---|
| A | Usuário sozinho |
| B | Usuário + profissional vinculado |
| C | Usuário + profissional + documentos e plano |

**Ninguém pode ser sorteado para a coorte B.** Ter um nutricionista que aceita entrar na plataforma não é uma
condição que se atribui — é uma característica da pessoa. Quem tem profissional acompanhando provavelmente já
é mais organizada, mais engajada com a própria saúde e mais disposta a pagar **antes** de conhecer a SINTERA.

Então a diferença observada entre A e B mistura duas coisas: o efeito do vínculo e a seleção de quem o tem.
**Atribuir tudo ao vínculo superestima o efeito** — e o vínculo é justamente a aposta central do negócio, o
que torna esse viés o mais perigoso de todos.

### 2.1 Mitigações, em ordem de força

1. **Medir a mesma pessoa antes e depois.** Quem passou 30 dias sem profissional e depois vinculou um serve
   como seu próprio controle. Elimina a seleção, porque a pessoa é a mesma. É a evidência mais forte que este
   desenho consegue produzir, e por isso a **data do vínculo é o dado mais importante a registrar**.
2. **Comparar com quem convidou e não foi aceito.** Quem tentou vincular um profissional que não aceitou tem a
   mesma disposição de quem conseguiu, e não tem o vínculo. É o controle mais próximo que existe.
3. **Registrar as características de entrada** — objetivo declarado, se já usava outro aplicativo, se estava em
   acompanhamento profissional no cadastro — para ao menos **descrever** a diferença entre os grupos em vez de
   ignorá-la.
4. **Onde couber, sortear de verdade.** Não dá para sortear "ter profissional". Dá para sortear **o convite**:
   metade dos novos usuários recebe o passo de convidar profissional no onboarding, metade não. Isso mede o
   efeito de *oferecer o vínculo*, que é o que a plataforma controla — e é aleatorizável.

> A mitigação 4 é a única que produz evidência causal limpa, e é barata. **Recomendação: fazer.**

---

## 3. O que precisa ser provado

| # | Hipótese | Como se mede | Falsificada se |
|---|---|---|---|
| H1 | A pessoa entende o valor rápido | Ativação em 7 dias | Menos da metade chega ao primeiro valor |
| H2 | Aceita pagar | Conversão de gratuito para pago | Conversão abaixo de 2% em 90 dias |
| H3 | Continua pagando | Cancelamento mensal | Intervalo inteiro acima de 6% |
| H4 | O profissional aumenta retenção | Antes e depois do vínculo, na mesma pessoa | Sem diferença de frequência nem de permanência |
| H5 | A rede aumenta o valor percebido | Coorte C contra B | C não se distingue de B |
| H6 | Integrar dados tem baixa fricção | Conclusão da conexão iniciada | Menos de 60% conclui |

**H4 é a hipótese central do negócio.** Se cair, o plano profissional perde a razão de existir e a economia
volta a depender só de aquisição paga — que o §44 já mostrou insuficiente.

---

## 4. Instrumentação

### 4.1 O que existe, verificado em 22/09/2026

`usage_events` existe desde a migração 018, com RLS de inserção pelo próprio usuário, e
`logUsageEvent` em `packages/api-client` já é alcançável pelos dois aplicativos.

**Mas só cinco eventos são emitidos, e nenhum serve ao portão:**
`exam_analyzed_success` · `exam_detail_viewed` · `feedback_submitted` · `perfil_segmentacao` ·
`problema_reportado`. Os três primeiros são disparados direto por `fetch('/api/events')` em telas da Web — o
Mobile não emite nenhum.

A infraestrutura está pronta. **O conjunto de eventos não existe.**

### 4.2 Os eventos que faltam

Nomes definitivos. Mudá-los depois quebra a série histórica, que é o ativo que este plano existe para construir.

**Ciclo de vida**
`cadastro_concluido` · `onboarding_concluido` · `primeiro_valor` · `sessao_iniciada`

`primeiro_valor` é o evento mais importante do conjunto e precisa de definição única, não de interpretação por
tela: **a pessoa viu dado próprio dela organizado** — um exame extraído, ou uma medida registrada e vista na
linha do tempo. Registrar na mesma chamada quanto tempo passou desde o cadastro.

**Vínculo** — `convite_enviado` (com a direção) · `convite_aceito` · `convite_recusado` ·
`vinculo_criado` · `vinculo_revogado` · `documento_proposto` · `documento_aceito` · `documento_recusado`

**Comercial** — `plano_visualizado` · `checkout_iniciado` · `assinatura_criada` (com escopo e plano) ·
`assinatura_cancelada` (com o motivo, quando declarado) · `pagamento_falhou`

**Dados** — `conexao_iniciada` · `conexao_concluida` · `conexao_falhou` (com o motivo) ·
`documento_proprio_enviado`

**Coorte** — `coorte_atribuida`, gravado no cadastro, com o braço sorteado da mitigação 4 do §2.1.

### 4.3 Regras

- **O evento nunca quebra a tela.** `logUsageEvent` já não lança; manter assim.
- **Web e Mobile emitem os mesmos nomes**, com a lista morando no core. Escrita duas vezes, divergiria — e
  série histórica divergente não se conserta depois.
- **Nenhum dado de saúde em `metadata`.** Nem valor de exame, nem nome de condição, nem medida. Telemetria de
  produto não é lugar de dado sensível, e `metadata` é `jsonb` livre — a disciplina tem de ser explícita.
- **A data de cada transição fica no evento.** Retenção não se mede para trás: o que não foi registrado no dia
  não existe depois.

---

## 5. O portão

Fixado **antes** do lançamento. Medido no mês 6 ou ao atingir 200 pagantes, o que vier depois.

| Medida | Seguir | Parar | Zona intermediária |
|---|---|---|---|
| Cancelamento mensal | Limite **superior** do intervalo ≤ 6% | Limite **inferior** > 6% | Continuar medindo; **não escalar gasto** |
| Custo de aquisição por pagante | ≤ R$ 200 | > R$ 300 | Rever o canal antes do produto |
| Ativação em 7 dias | ≥ 50% | < 30% | Problema de produto, não de aquisição |
| Conversão gratuito → pago, 90 dias | ≥ 4% | < 2% | Testar preço antes de concluir |
| Indicação profissional | ≥ 2% ao mês | < 0,5% | Tratar como canal que não existe |

**A zona intermediária é a resposta mais provável, e não é fracasso.** Ela significa que a amostra ainda não
decide. O erro a evitar é lê-la como aprovação: escalar gasto na zona intermediária é apostar o caixa numa
medida que ainda não distingue 3% de 9%.

**A regra de gasto do plano §36 continua valendo até o portão:** aquisição paga próxima de zero.

---

## 6. O que este plano não resolve

- **Não sei** quantos usuários existirão de fato. A projeção é modelo, não medição, e toda a discussão de
  amostra do §1 depende dela.
- **Não verifiquei** se a definição de `primeiro_valor` é implementável sem ambiguidade em todas as telas.
- **Não defini** como o custo de aquisição será atribuído por canal, o que exige parâmetros de origem.
- A mitigação 4 do §2.1 — sortear o convite no onboarding — **altera o onboarding**, e isso precisa entrar no
  escopo antes do lançamento, não depois.
- Nada aqui mede satisfação ou percepção. Mede comportamento. As duas coisas divergem, e a entrevista com
  usuário continua necessária.
