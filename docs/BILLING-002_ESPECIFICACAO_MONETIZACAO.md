# BILLING-002 — Monetização: gratuito + assinatura mensal/anual

**Status:** ESPECIFICAÇÃO — abre a frente comercial sobre a fundação já existente (`BILLING-001`).
**Consome:** `BILLING-001_ASSINATURAS` · ADR-000 · ADR-001 (SSOT) · ADR-023 (dono único) · ADR-002 (Mobile-First)

---

## 1. O pedido

> "a plataforma terá uma opção gratuita, mas terá também a opção de SaaS, um plano de assinatura mensal/anual."

---

## 2. Estado medido (24/08/2026)

| Peça | Estado |
|---|---|
| `billing_plans` · `subscriptions` · `billing_invoices` · `subscription_events` · `payment_methods` | **existem em produção** (migrations 116, 117, 118) |
| `src/lib/billing/` — `entitlements` · `lifecycle` · `load` · `service` | **existe** |
| Contrato `can(feature)` / `limit(key)` / `hasModule(m)` | **existe** |
| Módulos que **consultam** entitlements | **0 ocorrências** |
| Arquivos que **importam** `src/lib/billing` | **0** |
| Gateway de pagamento (Stripe, Mercado Pago, Pagar.me, Asaas, Iugu, Pix…) | **nenhum** |
| Billing em `packages/` (alcançável pelo Mobile) | **não existe** |

### A fundação está certa

`entitlements.ts` é boa arquitetura: os módulos consultam permissão, não plano nem preço; o gateway é adaptador
externo; `FREE_PLAN` degrada em vez de quebrar. Trocar de gateway não toca módulo nenhum. Isso não precisa ser
refeito.

### E hoje tudo é gratuito por construção

```ts
export const FREE_PLAN: PlanEntitlements = {
  features: ['*'],   // curinga: concede tudo
  limits: {},
  modules: ['*'],
}
```

Foi deliberado — introduzir o Billing sem restringir nada. Mas significa que **ligar a cobrança não é
"implementar billing": é decidir a fronteira** entre gratuito e pago, que hoje não existe em lugar nenhum.

---

## 3. O padrão que se repete — e que precisa parar

Terceira ocorrência da mesma forma, medida nesta semana:

| Frente | Especificado | Código escrito | Schema | Consumidores |
|---|---|---|---|---|
| ADR-023 (escrita via serviço) | sim | — | — | 0 de 11 fundações em `main` |
| DOC-001 (documentos clínicos) | sim | sim, testado | não aplicado | **0** |
| BILLING-001 (assinaturas) | sim | sim | **aplicado em produção** | **0** |

Decisão tomada → código escrito → **ligação nunca feita**. O billing é o caso mais caro: há schema em produção
sustentando funcionalidade que ninguém chama.

Recomendação para o cronograma: **nenhuma destas frentes é declarada concluída sem um consumidor real**. É o
princípio de Capacidade Concluída (4 dimensões) aplicado literalmente — infra sozinha não conta.

---

## 4. A restrição que muda o desenho: Apple e Google

**Isto precisa ser decidido antes da submissão iOS, não depois.**

Se a assinatura desbloqueia funcionalidade **dentro do app**, Apple e Google exigem a compra pelo mecanismo
deles — StoreKit e Google Play Billing — e retêm comissão:

| | Comissão |
|---|---|
| Apple / Google, ano 1 | **30%** |
| Apple / Google, após 12 meses de assinante contínuo | **15%** |
| Small Business Program (< US$ 1M/ano) | **15%** desde o início |
| Gateway na web (Stripe, Mercado Pago, Pix…) | ~3–5% |

Vender por fora e liberar no app **é rejeição** na revisão da Apple, salvo exceções que não se aplicam a este
produto.

### Os três caminhos

**A — Assinatura só na web.** O app lê o estado da assinatura, nunca oferece compra. Custo ~4% em vez de 30%.
Exige que o app **não mencione nem direcione** para a compra externa — a Apple é literal quanto a isso. Legítimo
e comum; a fricção de conversão é real.

**B — IAP nas duas lojas.** Melhor conversão, custo 15–30%, e mais trabalho: StoreKit + Play Billing + webhooks
de renovação/cancelamento/reembolso de cada loja, cada um com seu ciclo de vida.

**C — Web primeiro, IAP depois.** O contrato de entitlements já é gateway-agnóstico — acrescentar StoreKit
depois é um adaptador, não uma reescrita. A fundação existente foi desenhada exatamente para isto.

**Recomendação: C.** Preserva o caixa no começo, não fecha porta nenhuma, e a arquitetura já suporta.

---

## 5. Decisões que dependem da fundadora

Nenhuma destas é técnica.

1. **A fronteira gratuito × pago.** O que o plano gratuito entrega? Hoje `['*']` — tudo. Sugestão de eixo:
   gratuito = registrar e organizar os próprios documentos; pago = continuidade e colaboração (relatório
   compartilhável, Rede de Cuidado, dependentes, integrações com wearables, histórico longo). É proposta, não
   decisão.
2. **Preço mensal e anual**, e o desconto do anual.
3. **Trial** — existe? Quantos dias? Pede cartão?
4. **Dependentes** (CARE-002) — cobra por pessoa ou por conta? Muda o schema, decidir antes.
5. **Caminho de compra** — A, B ou C acima.
6. **Gateway**, se web: no Brasil, Pix e boleto pesam mais que cartão. Mercado Pago e Asaas cobrem os três;
   Stripe é mais limpo para cartão e recorrência internacional.

---

## 6. Escopo da implementação (após as decisões)

### Passo 1 — mover para `packages/core`
`src/lib/billing/` é Web-only. O Mobile não alcança. Sem isso, o app não consegue nem **exibir** o estado da
assinatura — e nasceria um segundo dono do mesmo conceito, que é o defeito nomeado pelo ADR-023 e que já custou
três PRs no campo de telefone.

### Passo 2 — configurar os planos
Popular `billing_plans` com gratuito, mensal e anual, e trocar o `['*']` do FREE pela fronteira decidida em §5.1.

### Passo 3 — ligar os consumidores
Os módulos passam a consultar `can()` / `hasModule()`. **Este é o passo que hoje não existe** e sem o qual nada
é cobrado. Web e Mobile.

### Passo 4 — adaptador de gateway
Checkout, webhook de confirmação, ciclo de vida (renovação, falha de pagamento, cancelamento, reembolso).
`lifecycle.ts` já modela os estados; falta o canal.

### Passo 5 — as telas
Planos, assinatura atual, faturas, método de pagamento, cancelamento. Web e Mobile, com paridade.

---

## 7. Conformidade — não é opcional

- **Cobrança recorrente no Brasil:** CDC exige cancelamento tão fácil quanto a contratação. Cancelar precisa
  estar no produto, não em e-mail para o suporte.
- **LGPD:** dado de pagamento é dado pessoal. O gateway é **operador** — exige contrato e registro no ROPA.
  Nunca guardar PAN; só o token do gateway. `payment_methods` precisa ser auditada quanto a isto antes de
  receber dado real.
- **Fiscal:** SaaS por assinatura emite nota. Definir regime e emissor antes do primeiro pagamento, não depois.
- **ADR-000:** a assinatura dá acesso a **organização e continuidade** de informação. Nada no material comercial
  pode sugerir interpretação clínica ou desfecho de saúde (RDC 657) — vale para a página de planos, para a
  ficha da loja e para o texto de submissão.

---

## 8. Posição no cronograma

Depende de §5, que é decisão de negócio — não de engenharia. Mas há uma ordem forçada:

```
decisão do caminho de compra (§4)  ──►  ANTES da submissão iOS
      porque muda o que o app pode exibir e o que a ficha da loja declara

decisão da fronteira gratuito×pago (§5.1)  ──►  ANTES do Passo 3
      porque é ela que define o que cada módulo consulta

Passo 1 (mover para core)  ──►  pode começar já: é dono único, não depende de preço
```

O Passo 1 é a única parte que não espera nenhuma decisão.
