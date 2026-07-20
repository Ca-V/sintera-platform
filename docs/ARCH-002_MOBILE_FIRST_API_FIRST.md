# ARCH-002 — Mobile-First · API-First (princípio permanente)

**Status:** PRINCÍPIO PERMANENTE (fundadora, 20/07). Orienta **toda** decisão arquitetural futura. Sob [[ADR-000]].

## Direcionamento
- **O aplicativo móvel é o PRODUTO PRINCIPAL da SINTERA.** A plataforma web **continua existindo**, mas como **interface
  complementar** — tarefas administrativas, configurações avançadas, revisão de documentos, uso por profissionais de
  saúde e o que se beneficia de tela grande.
- **Fluxo de concepção:** **Mobile → API → Web** (nunca mais Web → Mobile). Toda funcionalidade nasce pensada para o
  mobile; a web consome exatamente as **mesmas APIs**.
- **Backend API-first:** o backend serve **prioritariamente o app**, com APIs versionadas e estáveis; **sem fluxos
  exclusivos de navegador**. A web é mais um cliente das mesmas APIs.

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
