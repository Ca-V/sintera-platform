# BILLING-003 — Matriz de planos e entitlements

> **O que este documento é.** A configuração comercial concreta: quais planos existem, quanto custam, e o
> `entitlements` exato de cada um. Fecha as decisões que o `BILLING-002` §5 deixou abertas, com as respostas do
> Mini Business Plan v1.0 (22/09/2026) §27.
>
> **Consome:** BILLING-001 (fundação) · BILLING-002 (especificação e caminho de compra) · CARE-003 (vínculo) ·
> ADR-000 · ADR-001.
>
> **Não repete** o que BILLING-002 já decidiu. Ele continua sendo o documento do *como*; este é o do *quanto* e
> do *o quê*.

---

## 1. O que o plano de negócios respondeu, e o que continua aberto

| BILLING-002 §5 | Estado |
|---|---|
| 1. Fronteira gratuito × pago | **Respondida** — §3 e §4 abaixo |
| 2. Preço mensal e anual | **Respondida** — anual = 10 meses, desconto de 16,7% |
| 3. Trial | **Aberta.** Recomendação em §7.1 |
| 4. Dependentes | **Aberta**, e permanece — CARE-002 não existe |
| 5. Caminho de compra (web / IAP / web-primeiro) | **Aberta.** BILLING-002 recomenda C; a fundadora não decidiu |
| 6. Gateway | **Aberta** |

As três primeiras etapas de implementação **não dependem** das três questões abertas.

---

## 2. Dois achados que mudam o schema

### 2.1 Uma pessoa não pode ter duas assinaturas — e o negócio exige

```sql
create table public.subscriptions (
  user_id uuid primary key references auth.users(id) ...
```

`user_id` é **chave primária**: uma assinatura por pessoa. Mas o plano de negócios prevê exatamente o caso
contrário — a nutricionista que assina o **Evolução** para a própria saúde e o **Inteligência da Prática** para
a carteira dela. São dois produtos, dois preços, dois ciclos de cobrança.

**Decidido pela fundadora em 22/09/2026 — um login, uma pessoa, dois perfis, duas assinaturas** (CARE-003
§2.0). A correção é a menor possível: acrescentar `escopo` (`pessoal` | `profissional`) e mover a chave
primária para `(user_id, escopo)`. Nada mais muda de forma — mas `loadEntitlements` usa `.maybeSingle()` sobre
`user_id` e passa a precisar do filtro por escopo, senão quebra no dia em que a segunda linha aparecer.

A alternativa de dois cadastros separados, chaveados por CPF e por CNPJ, foi avaliada e descartada; as quatro
razões estão em CARE-003 §2.0, e a decisiva é comercial: o CNPJ amarraria a carteira do profissional a quem o
emprega.

> Feito **antes** de cadastrar qualquer plano pago. Depois de haver assinatura real, virar a chave primária
> deixa de ser migração aditiva.

### 2.2 O dia em que `free` deixa de ser `'*'` é uma quebra, não uma configuração

Hoje o único plano cadastrado é:

```json
{ "features": ["*"], "limits": {}, "modules": ["*"] }
```

Curinga: concede tudo. Foi deliberado — introduzir o billing sem restringir nada. Mas isso significa que
**trocar o `'*'` pela fronteira real tira acesso de todo mundo que não tiver assinatura**, no mesmo instante,
sem aviso.

E tem um segundo efeito, menos óbvio: `resolveEntitlements` cai no plano FREE quando o status é `past_due`,
`suspended` ou `canceled`. Ou seja, **a definição do plano gratuito é também a definição do que acontece com
quem parou de pagar.**

Sequência obrigatória:

1. Cadastrar os planos pagos, mantendo `free` com `'*'`. Nada muda para ninguém.
2. Ligar os consumidores — telas lendo `can()`, `limit()`, `hasModule()`. Continua nada mudando, porque o
   gratuito ainda concede tudo.
3. Só então trocar o `'*'` do `free` pela fronteira real, **avisando antes quem vai perder acesso**.

Inverter 2 e 3 restringe antes de existir tela que explique a restrição.

---

## 3. A regra que nenhum limite pode violar

> **Limite se aplica a ACRESCENTAR, nunca a VER o que já está lá.**

Uma pessoa no Plus com 500 documentos que para de pagar cai no gratuito, cujo limite é 5 documentos. Os outros
495 **não somem, não são ocultados e não ficam borrados.** Ela deixa de poder enviar o 501º.

Não é gentileza. São dados de saúde da pessoa, e condicionar o acesso a eles ao pagamento seria reter
informação clínica dela como garantia — além de conflitar com o direito de acesso e de portabilidade.

**Catraca de teste obrigatória:** um usuário com dados acima do limite do plano atual continua lendo todos.

Mesma lógica para o vínculo: quem tem 3 profissionais e cai para o gratuito (1 profissional) **não perde os
vínculos** — deixa de poder criar o quarto. Revogação é ato da pessoa, nunca consequência de fatura.

---

## 4. Planos da pessoa

| | Essencial | Evolução | Plus |
|---|---|---|---|
| **Preço** | Gratuito | R$ 29,90/mês · R$ 299/ano | R$ 59,90/mês · R$ 599/ano |
| `plan_id` | `free` | `evolucao` | `plus` |
| Profissionais vinculados | 1 | 3 | ilimitado |
| Documentos enviados pela pessoa | 5 | ilimitado | ilimitado |
| Receber documento de profissional | **ilimitado** | **ilimitado** | **ilimitado** |
| Extração estruturada de exame | — | sim | sim |
| Medidas e composição corporal | básico | comparação por método | comparação por método |
| Linha do tempo | básica | completa | completa |
| Apple Saúde e Conexão Saúde | — | sim | sim |
| Conector de balança (Withings) | — | — | sim |
| Exportação e portabilidade | — | — | sim |

**Receber documento é ilimitado em todos os planos**, inclusive no gratuito. É a aplicação da regra do CARE-003
§6 do lado da pessoa: bloquear o recebimento mataria o ciclo de crescimento no ponto em que ele funciona.

### 4.1 Entitlements

```json
// free
{ "features": [], "limits": { "profissionais": 1, "documentos_proprios": 5 },
  "modules": ["inicio","exames","documentos","medidas","medicamentos","condicoes","historico-saude","rede","configuracoes"] }

// evolucao
{ "features": ["extracao.exames","medidas.comparacao_por_metodo","timeline.completa","conectores.sistema_operacional"],
  "limits": { "profissionais": 3 },
  "modules": ["inicio","agenda","exames","pedidos","documentos","medidas","medicamentos","suplementos","condicoes",
              "ciclo","habitos","monitoramento","historico-exames","historico-saude","rede","despesas","configuracoes"] }

// plus
{ "features": ["extracao.exames","medidas.comparacao_por_metodo","timeline.completa","conectores.sistema_operacional",
               "conectores.dispositivo","exportacao.portabilidade"],
  "limits": {},
  "modules": ["*"] }
```

Ausência de chave em `limits` = ilimitado, conforme o contrato (`limit()` devolve `null`). Os nomes de módulo
são os identificadores de `packages/core/src/domain/navigation/sections.ts` — a sidebar é SSOT da taxonomia, e
inventar nomes aqui criaria uma segunda.

---

## 5. Planos do profissional

| | Acompanhamento | Inteligência da Prática | Clínica e equipe |
|---|---|---|---|
| **Preço** | Gratuito | R$ 79,90/mês · R$ 799/ano | A partir de R$ 249/mês |
| `plan_id` | `prof_acompanhamento` | `prof_inteligencia` | `prof_clinica` |
| Receber pacientes | **ilimitado** | **ilimitado** | **ilimitado** |
| Enviar documento e plano | sim | sim | sim |
| Ver evolução individual | sim | sim | sim |
| Painel da carteira | — | sim | sim |
| Convidar pacientes | — | sim | sim |
| Vários profissionais na conta | — | — | sim |

```json
// prof_acompanhamento
{ "features": ["prof.receber_pacientes","prof.enviar_documento","prof.ver_evolucao"],
  "limits": {}, "modules": ["profissional"] }

// prof_inteligencia
{ "features": ["prof.receber_pacientes","prof.enviar_documento","prof.ver_evolucao",
               "prof.painel_carteira","prof.convidar_pacientes","prof.exportar_relatorio"],
  "limits": {}, "modules": ["profissional"] }

// prof_clinica
{ "features": ["prof.receber_pacientes","prof.enviar_documento","prof.ver_evolucao",
               "prof.painel_carteira","prof.convidar_pacientes","prof.exportar_relatorio","prof.equipe"],
  "limits": { "profissionais_na_conta": 5 }, "modules": ["profissional"] }
```

**`prof.painel_carteira` fica cadastrado e não é construído.** A questão 1 do Briefing Jurídico decide a base
legal do tratamento agregado. A permissão existir antes da função não custa nada; a função existir antes do
parecer, sim.

**`prof.convidar_pacientes`** depende da questão 3 do Briefing. Enquanto não houver resposta, a permissão fica
cadastrada e desligada — a regra de lançamento do CARE-003 §4.1 já é "só o paciente convida", então isso não
atrasa nada.

O limite de 5 profissionais no plano Clínica é **hipótese**, não decisão validada. Modelar vários profissionais
sob uma conta conversa com TENANT-001 e não está resolvido; CARE-003 §9 registra isso como pendência.

---

## 6. Anual

Todos os planos anuais custam **dez mensalidades** — desconto de 16,7%, dois meses grátis. É a convenção mais
reconhecível do mercado e dispensa explicação na tela.

| Plano | Mensal | Anual | Economia |
|---|---|---|---|
| Evolução | R$ 29,90 | R$ 299,00 | R$ 59,80 |
| Plus | R$ 59,90 | R$ 599,00 | R$ 119,80 |
| Inteligência da Prática | R$ 79,90 | R$ 799,00 | R$ 159,80 |

**Todos os preços são hipóteses de teste.** Nenhum foi validado por disposição a pagar. Ancoragem em §27.3 do
plano de negócios: Dietbox R$ 24,90–74,90 (referência de 2023), WebDiet a partir de R$ 49,17, Amplimed ~R$ 89,
iClinic R$ 99–299, Feegow R$ 129–249.

---

## 7. O que ainda falta decidir

### 7.1 Trial
**Recomendação:** 14 dias do Evolução, **sem cartão**, para todo cadastro novo. Sem cartão porque a hipótese
que precisa ser medida é se a pessoa percebe valor — pedir cartão mistura essa medição com a fricção do
pagamento, e o portão do §46 depende de ler as duas separadas. O `status` `trial` já existe em
`lifecycle.ts` e concede o plano sem alteração de contrato.

### 7.2 Caminho de compra
Continua como BILLING-002 §4 deixou: recomendação C (web primeiro, IAP depois). **Decidir antes da submissão
iOS**, porque muda o que o app pode exibir.

### 7.3 Gateway
Aberto. No Brasil, Pix e boleto pesam mais que cartão.

---

## 8. Ordem de implementação

1. **`escopo` em `subscriptions`** e o filtro em `loadEntitlements` — §2.1. Antes de qualquer plano pago.
2. **Mover `src/lib/billing/` para `packages/core`** — BILLING-002 passo 1. O Mobile não alcança o que está em
   `src/`, e nascer um segundo dono do mesmo conceito é o defeito que o ADR-023 nomeia.
3. **Cadastrar os planos** com os JSON acima, mantendo `free` com `'*'`.
4. **Ligar os consumidores** — telas lendo `can()` / `limit()` / `hasModule()`, Web e Mobile.
5. **Catracas** — a de §3 (limite não esconde o que já existe) e a de teto de vínculo.
6. **Trocar o `'*'` do `free`** pela fronteira de §4.1, com aviso prévio.
7. **Gateway e telas de assinatura** — depende de §7.2 e §7.3.

Os passos 1 e 2 não dependem de nenhuma decisão aberta e podem começar já.

---

## 9. O que este documento não resolve

- **Não verifiquei** se `payment_methods` está conforme quanto a não guardar PAN (BILLING-002 §7 já alertava).
- **Não defini** o preço do Clínica acima do piso de R$ 249, nem o que acontece ao passar de 5 profissionais.
- **Não defini** o comportamento de cobrança em upgrade e downgrade no meio do ciclo.
- Os preços podem ser derrubados pela validação. O portão do §46 do plano de negócios é o que decide.
