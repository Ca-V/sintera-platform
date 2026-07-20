# ARCH-002 — Mobile-First · API-First (princípio permanente)

**Status:** PRINCÍPIO PERMANENTE · **Architectural Baseline** (fundadora, 20/07). Orienta **toda** decisão arquitetural
futura; mudança estrutural exige revisão formal (ADR). Sob [[ADR-000]]. Decisões: [[adr_002_mobile_first|ADR-002]] · [[adr_003_api_first|ADR-003]].

## Direcionamento
- **O aplicativo móvel é o PRODUTO PRINCIPAL e a PRINCIPAL EXPERIÊNCIA do usuário da SINTERA.** Não é "mais um cliente"
  da plataforma — é o centro do produto. A plataforma web **continua existindo**, mas como **interface complementar**:
  tarefas administrativas, configurações avançadas, revisão de documentos e uso profissional (tela grande).
- **Toda nova funcionalidade nasce considerando PRIMEIRO a experiência móvel.**
- **Fluxo de concepção:** **Mobile → API → Web** (nunca mais Web → Mobile). A web consome exatamente as **mesmas APIs**.
- **Backend API-first:** o backend serve **prioritariamente o app**, com APIs versionadas e estáveis; **sem fluxos
  exclusivos de navegador**. A web é mais um cliente das mesmas APIs.

## Regra permanente — nada existe só na web
**Nenhuma funcionalidade pode existir apenas na interface web.** Toda capacidade da plataforma existe **primeiro como
serviço de backend (API)**, consumida pelo app móvel e, quando necessário, também pela web. Isso mantém o **backend
desacoplado de qualquer interface**. Uma tela (mobile ou web) nunca contém regra de negócio que não esteja na API.

## Health Connect e Apple Health = capacidades NATIVAS do app (não "conectores")
Health Connect e Apple HealthKit **não são "primeiros conectores"** — são **capacidades nativas da plataforma móvel da
SINTERA** (fazem parte do app). Os **conectores externos** (fabricantes, agregadores, parceiros) são **outra categoria**,
consumida via backend. Ambos produzem **Observações** ([[HIP-007]]), mas ocupam camadas distintas do produto.

## Consequências arquiteturais (permanentes)
1. **Contrato único de API** para mobile e web; nenhuma rota "só web" ou "só mobile" sem justificativa forte.
2. **Monorepo com compartilhamento máximo** web↔mobile: contratos de API, **modelos de domínio** (Observação — [[HIP-007]]),
   **validações**, **regras de negócio**, **cliente de API** e **componentes** reutilizáveis quando fizer sentido.
   Fonte única → evolução sincronizada, duplicação mínima.
3. **Camada observacional universal** ([[HIP-007]]) e **NOV-001** servem ambos os clientes pela mesma via.
4. **Expansão sem revisão estrutural:** novas funcionalidades entram como módulos sobre a mesma base (API-first +
   observacional + monorepo), sem reengenharia.

## Regra de decisão
Toda decisão arquitetural futura deve **fortalecer**: mobile-first · backend API-first · arquitetura observacional
universal · capacidade de expansão sem revisões estruturais. Decisões que criem acoplamento exclusivo à web, dupliquem
regras entre plataformas ou tratem o app como "cliente secundário" **contrariam este princípio**.
