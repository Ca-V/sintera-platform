# BILLING-001 — Assinaturas & Billing (pilar transversal · SaaS)

> Fundadora (14/07/2026): a infraestrutura de assinaturas é um **PILAR ARQUITETURAL**, não uma
> funcionalidade isolada. Deve **nascer integrada** (não ser adicionada depois) e sustentar toda a operação
> comercial da SINTERA. Entra no roadmap **desde já** como capacidade transversal, ao lado de **CPE · UCDA ·
> CARE-001 · infraestrutura de Eventos**. É **requisito para produção** — pronta antes da disponibilização
> comercial. **Registrar agora, implementar na fase adequada** (não interrompe a prioridade atual: consolidar
> o módulo Exames).

## Princípio arquitetural (inegociável)
**Toda a lógica comercial fica centralizada em um SERVIÇO próprio de Billing & Assinaturas — exatamente como
o conhecimento clínico fica no Clinical Processing Engine.** A camada comercial é **completamente DESACOPLADA
dos módulos clínicos**:
- Os módulos **NÃO conhecem regras comerciais** (planos, preços, limites, gateways).
- Os módulos apenas **consultam PERMISSÕES** (entitlements) que o serviço de assinaturas disponibiliza.
- Fronteira única: uma interface de **entitlements/permissões** (ex.: `can(feature)`, `limit(x)`,
  `hasModule(m)`). Nenhum módulo importa lógica de billing. *(A garantir por teste ARCH de desacoplamento,
  como `ARCH-processor-decoupling` fez para o CPE.)*

```
Módulos clínicos ─(consultam)→ Entitlements/Permissões ←(publica)─ Billing & Subscriptions Service
   (não conhecem regra comercial)                                   (planos · pagamentos · status · gateway)
                                                                            │ (adapters)
                                                                    Gateway A · Gateway B · … (multi-meio)
```

## Capacidades (mínimo)
- **Planos**: cadastro dos planos da plataforma (catálogo).
- **Ciclo do assinante**: contratação · alteração de plano · **upgrade/downgrade** · período de avaliação
  (trial, quando existir) · **renovação automática** · cancelamento.
- **Status da assinatura**: controle de estado (ativa · trial · inadimplente · suspensa · cancelada) e
  **suspensão/reativação automática** conforme regras.
- **Permissões por plano**: features · **limites** · módulos disponíveis — expostos como entitlements.
- **Pagamentos**: processamento · emissão e controle das **cobranças** · **histórico financeiro** do
  assinante · **tratamento de falhas de pagamento** (dunning/retry).
- **Gateway**: integração com gateway de pagamento; **arquitetura preparada para múltiplos meios/gateways**
  (padrão de ADAPTER — um adapter por gateway/meio, sem que o núcleo conheça o gateway específico).

## Arquitetura (diretrizes)
1. **Serviço próprio** (`billing`/entitlements) — todo o domínio comercial vive aqui; nada vaza para os módulos.
2. **Entitlements como contrato** — os módulos leem permissões/limites/módulos por um único contrato estável
   (independente de plano/gateway); trocar plano ou gateway não muda o módulo.
3. **Gateway-agnóstico** — adapters por gateway/meio de pagamento (cartão, Pix, boleto, …), como o Laboratory
   Adapter fez para o laboratório: o núcleo não conhece o gateway.
4. **Auditabilidade & eventos** — cobranças/renovações/falhas/suspensões geram histórico auditável
   (rastreável, como a Certificação da Plataforma exige do clínico).
5. **LGPD** — dado financeiro/PII do assinante tratado com o mesmo rigor; segredos de gateway fora do cliente.

## Posição no roadmap
Capacidade **transversal** (não uma modalidade). Sequência da governança: consolidação da plataforma →
capacidades transversais reutilizáveis (**Eventos · Notificações · Billing**) → CARE-001 → modalidades.
**Billing deve estar pronta antes da disponibilização comercial.** Relaciona: infraestrutura de Eventos
Assistenciais (histórico financeiro do usuário × cobranças do assinante são domínios distintos — não
confundir despesas de saúde do usuário com a fatura da assinatura SINTERA).
